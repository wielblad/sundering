import { Room, Client } from '@colyseus/core';
import { v4 as uuidv4 } from 'uuid';
import { GameState, GamePlayer, GameChatMessage, AbilityState, MapPing, InventoryItem, BuffState, TowerState, CreepState, JungleCampState, JungleMonsterState, Vector3 } from './schemas/GameState.js';
import { verifyToken, getUserById } from '../services/auth.js';
import { saveMatchResult, type MatchPlayerResult } from '../services/matchResults.js';
import { setActiveGame, clearActiveGame, updateActiveGameDisconnect } from '../services/redis.js';
import type { MatchConfig } from '../services/matchmaking.js';
import {
  HEROES, HERO_IDS, BALANCE, TIMING, GAME_CONFIG, ABILITIES, getAbilitiesForHero, ITEMS, Item,
  MAIN_MAP, getSpawnPosition, Point2D, Obstacle, Circle, Rectangle,
  findPath, hasLineOfSight, simplifyPath,
  BUFFS, BuffType, AppliedBuff,
  isDamageOverTime, isHealOverTime,
  calculateMoveSpeedModifier, calculateAttackSpeedModifier, calculateArmorModifier, calculateMagicResistModifier,
  TOWER_STATS, TOWER_CONFIG,
  CREEP_STATS, CREEP_SPAWN_CONFIG, CREEP_AI_CONFIG, CreepType, getScaledCreepStats, getWaveComposition,
  MONSTER_STATS, CAMP_COMPOSITIONS, RIVER_BOSS_COMPOSITION, JUNGLE_AI_CONFIG, MonsterType, getScaledMonsterStats, getMonsterSpawnPositions, CampDifficulty,
  VISION_CONFIG, isInVisionRange,
  // Collision system
  ENTITY_COLLISION_CONFIG, CREEP_COLLISION_RADIUS, MONSTER_COLLISION_RADIUS,
  CollisionEntityType, PassthroughTrait,
  getCircleCollisionPenetration, shouldEntitiesCollide
} from '@sundering/shared';

interface JoinOptions {
  token?: string;
  matchId: string;
}

const HERO_SELECT_TIME = 60; // seconds
const BOT_HERO_SELECT_DELAY = 3000; // ms
const TICK_INTERVAL_MS = 1000 / TIMING.tickRate; // 50ms for 20 ticks/sec
const ARRIVAL_THRESHOLD = 5; // Units - consider arrived when this close to target
const RECONNECT_TIMEOUT = 60000; // 60 seconds to reconnect
const CREEP_ARRIVAL_THRESHOLD = 50; // Larger threshold for creeps

export class GameRoom extends Room<GameState> {
  maxClients = 10;
  private matchConfig: MatchConfig | null = null;
  private heroSelectInterval: ReturnType<typeof setInterval> | null = null;
  private gameLoopInterval: ReturnType<typeof setInterval> | null = null;
  private lastTickTime: number = 0;
  private gameTimeAccumulator: number = 0;
  private goldAccumulator: number = 0;
  private visionAccumulator: number = 0; // For vision updates
  private gameStartedAt: Date | null = null;
  private matchSaved: boolean = false;
  private disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  // Pathfinding waypoints for each player (not synced to client)
  private playerPaths: Map<string, Point2D[]> = new Map();
  // Creep wave tracking
  private creepIdCounter: number = 0;
  // Jungle monster tracking
  private jungleMonsterIdCounter: number = 0;

  onCreate(options: { matchConfig: MatchConfig }) {
    this.setState(new GameState());

    this.matchConfig = options.matchConfig;
    this.state.matchId = this.matchConfig.matchId;
    this.state.phase = 'waiting';

    // Initialize players from match config
    this.initializePlayers();

    // Set up message handlers
    this.setupMessageHandlers();

    console.log(`GameRoom created: ${this.state.matchId}`);
  }

  private initializePlayers() {
    if (!this.matchConfig) return;

    for (const matchPlayer of this.matchConfig.players) {
      const player = new GamePlayer();
      player.id = matchPlayer.userId;
      player.userId = matchPlayer.userId;
      player.username = matchPlayer.username;
      player.displayName = matchPlayer.username;
      player.team = matchPlayer.team;
      player.isBot = matchPlayer.isBot;
      player.isConnected = matchPlayer.isBot; // Bots are always "connected"
      player.isReady = matchPlayer.isBot; // Bots are always "ready"

      // Set spawn position based on team
      const spawnPos = this.getSpawnPosition(matchPlayer.team, this.state.players.size);
      player.position.x = spawnPos.x;
      player.position.y = spawnPos.y;
      player.position.z = spawnPos.z;

      this.state.players.set(player.id, player);
    }

    // Start waiting for real players
    this.checkAllPlayersConnected();
  }

  private getSpawnPosition(team: 'radiant' | 'dire', index: number): { x: number; y: number; z: number } {
    // Use map spawn points with random offset
    const spawnPoint = getSpawnPosition(team, MAIN_MAP.spawns);

    // Add slight offset based on player index to prevent overlap
    const angleOffset = (index % 5) * (Math.PI * 2 / 5);
    const distanceOffset = 100 + (index % 5) * 50;

    return {
      x: spawnPoint.x + Math.cos(angleOffset) * distanceOffset,
      y: 0,
      z: spawnPoint.z + Math.sin(angleOffset) * distanceOffset,
    };
  }

  private setupMessageHandlers() {
    // Hero selection
    this.onMessage('select_hero', (client, heroId: string) => {
      this.handleSelectHero(client, heroId);
    });

    this.onMessage('lock_hero', (client) => {
      this.handleLockHero(client);
    });

    // Chat
    this.onMessage('chat', (client, data: { content: string; teamOnly: boolean }) => {
      this.handleChat(client, data);
    });

    // Game commands
    this.onMessage('move', (client, target: { x: number; y: number; z: number }) => {
      this.handleMove(client, target);
    });

    this.onMessage('attack', (client, targetId: string) => {
      this.handleAttack(client, targetId);
    });

    this.onMessage('stop', (client) => {
      this.handleStop(client);
    });

    this.onMessage('use_ability', (client, data: { slot: string; targetId?: string; targetPoint?: { x: number; y: number; z: number } }) => {
      this.handleUseAbility(client, data);
    });

    // Ping
    this.onMessage('ping', (client, data: { type: string; position: { x: number; y: number; z: number } }) => {
      this.handlePing(client, data);
    });

    // Shop
    this.onMessage('buy_item', (client, itemId: string) => {
      this.handleBuyItem(client, itemId);
    });

    this.onMessage('sell_item', (client, slot: number) => {
      this.handleSellItem(client, slot);
    });
  }

  async onAuth(_client: Client, options: JoinOptions): Promise<{ userId: string; username: string }> {
    // Allow joining with match ID for reconnection
    if (options.matchId !== this.state.matchId) {
      throw new Error('Invalid match ID');
    }

    if (!options.token) {
      throw new Error('Authentication required');
    }

    const payload = verifyToken(options.token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    // Check if player is part of this match
    const player = this.state.players.get(payload.userId);
    if (!player || player.isBot) {
      throw new Error('Not a participant in this match');
    }

    return { userId: payload.userId, username: payload.username };
  }

  async onJoin(client: Client, _options: JoinOptions, auth?: { userId: string; username: string }) {
    if (!auth) {
      throw new Error('Authentication required');
    }
    const player = this.state.players.get(auth.userId);
    if (!player) return;

    // Clear any existing disconnect timer for this player (reconnection)
    const existingTimer = this.disconnectTimers.get(auth.userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.disconnectTimers.delete(auth.userId);
      console.log(`Player ${auth.username} reconnected to game ${this.state.matchId}`);
    }

    // Update player info
    player.isConnected = true;
    player.username = auth.username;

    // Try to get display name from DB
    try {
      const user = await getUserById(auth.userId);
      if (user) {
        player.displayName = user.display_name || user.username;
      }
    } catch {
      player.displayName = auth.username;
    }

    client.userData = { userId: auth.userId, player };

    // Store active game info in Redis for reconnection
    await setActiveGame(auth.userId, {
      matchId: this.state.matchId,
      roomId: this.roomId,
      team: player.team as 'radiant' | 'dire',
      heroId: player.heroId || player.lockedHeroId || '',
    });

    console.log(`Player ${auth.username} joined game ${this.state.matchId}`);

    this.checkAllPlayersConnected();
  }

  async onLeave(client: Client, consented: boolean) {
    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    player.isConnected = false;

    console.log(`Player ${player.username} left game ${this.state.matchId} (consented: ${consented})`);

    // Update Redis with disconnect timestamp
    await updateActiveGameDisconnect(userData.userId);

    // If game is still active (not ended), start reconnect timer
    if (this.state.phase !== 'ended' && !player.isBot) {
      // Broadcast disconnect to other players
      this.broadcast('player_disconnected', {
        oddsUserId: userData.userId,
        oddsDisplayName: player.displayName,
        reconnectTimeout: RECONNECT_TIMEOUT / 1000,
      });

      // Set timer to mark player as abandoned
      const timer = setTimeout(async () => {
        this.disconnectTimers.delete(userData.userId);

        // Player didn't reconnect in time
        console.log(`Player ${player.username} abandoned game ${this.state.matchId}`);

        // Clear active game from Redis
        await clearActiveGame(userData.userId);

        // Broadcast abandonment
        this.broadcast('player_abandoned', {
          oddsUserId: userData.userId,
          oddsDisplayName: player.displayName,
        });

        // If game is in hero select or waiting, might need to handle differently
        // For now, just mark the player as disconnected permanently
        // The game can continue with bots or reduced players
      }, RECONNECT_TIMEOUT);

      this.disconnectTimers.set(userData.userId, timer);
    } else if (this.state.phase === 'ended') {
      // Game ended, clear active game
      await clearActiveGame(userData.userId);
    }
  }

  async onDispose() {
    if (this.heroSelectInterval) {
      clearInterval(this.heroSelectInterval);
    }
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }

    // Clear all disconnect timers
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();

    // Clear active game for all players
    for (const player of this.state.players.values()) {
      if (!player.isBot) {
        await clearActiveGame(player.userId);
      }
    }

    console.log(`GameRoom disposed: ${this.state.matchId}`);
  }

  private checkAllPlayersConnected() {
    const realPlayers = Array.from(this.state.players.values()).filter(p => !p.isBot);
    const connectedPlayers = realPlayers.filter(p => p.isConnected);

    if (connectedPlayers.length === realPlayers.length && this.state.phase === 'waiting') {
      // All real players connected, start hero selection
      this.startHeroSelect();
    }
  }

  private startHeroSelect() {
    this.state.phase = 'hero_select';
    this.state.heroSelectTimer = HERO_SELECT_TIME;

    console.log(`Hero selection started for match ${this.state.matchId}`);

    // Bots select heroes after a delay
    setTimeout(() => this.botsSelectHeroes(), BOT_HERO_SELECT_DELAY);

    // Start countdown
    this.heroSelectInterval = setInterval(() => {
      this.state.heroSelectTimer--;

      if (this.state.heroSelectTimer <= 0) {
        this.finishHeroSelect();
      }
    }, 1000);
  }

  private botsSelectHeroes() {
    const usedHeroes = new Set<string>();

    // Collect already selected heroes
    this.state.players.forEach(player => {
      if (player.lockedHeroId) {
        usedHeroes.add(player.lockedHeroId);
      }
    });

    // Bots select random available heroes
    this.state.players.forEach(player => {
      if (player.isBot && !player.lockedHeroId) {
        const availableHeroes = HERO_IDS.filter(id => !usedHeroes.has(id));
        if (availableHeroes.length > 0) {
          const heroId = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
          player.selectedHeroId = heroId;
          player.lockedHeroId = heroId;
          usedHeroes.add(heroId);

          console.log(`Bot ${player.displayName} selected ${heroId}`);
        }
      }
    });
  }

  private handleSelectHero(client: Client, heroId: string) {
    if (this.state.phase !== 'hero_select') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    if (player.lockedHeroId) return; // Already locked

    // Check if hero is available
    if (!HERO_IDS.includes(heroId)) return;

    // Check if hero is already locked by someone else
    let isLocked = false;
    this.state.players.forEach(p => {
      if (p.lockedHeroId === heroId) {
        isLocked = true;
      }
    });

    if (isLocked) {
      client.send('hero_unavailable', { heroId });
      return;
    }

    player.selectedHeroId = heroId;
    console.log(`Player ${player.username} selected ${heroId}`);
  }

  private handleLockHero(client: Client) {
    if (this.state.phase !== 'hero_select') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    if (player.lockedHeroId) return; // Already locked
    if (!player.selectedHeroId) return; // Nothing selected

    // Check if hero is still available
    let isLocked = false;
    this.state.players.forEach(p => {
      if (p.lockedHeroId === player.selectedHeroId) {
        isLocked = true;
      }
    });

    if (isLocked) {
      client.send('hero_unavailable', { heroId: player.selectedHeroId });
      player.selectedHeroId = '';
      return;
    }

    player.lockedHeroId = player.selectedHeroId;
    player.isReady = true;

    console.log(`Player ${player.username} locked ${player.lockedHeroId}`);

    // Check if all players are ready
    this.checkAllReady();
  }

  private checkAllReady() {
    let allReady = true;
    this.state.players.forEach(player => {
      if (!player.isReady) {
        allReady = false;
      }
    });

    if (allReady) {
      this.finishHeroSelect();
    }
  }

  private finishHeroSelect() {
    if (this.heroSelectInterval) {
      clearInterval(this.heroSelectInterval);
      this.heroSelectInterval = null;
    }

    // Auto-assign heroes for players who didn't select
    this.autoAssignHeroes();

    // Initialize hero stats
    this.initializeHeroStats();

    // Initialize towers
    this.initializeTowers();

    // Initialize jungle camps
    this.initializeJungleCamps();

    // Start the game
    this.state.phase = 'playing';
    this.state.gameTime = 0;
    this.gameStartedAt = new Date();

    console.log(`Game started: ${this.state.matchId}`);

    // Broadcast game start
    this.broadcast('game_start', { matchId: this.state.matchId });

    // Start game loop (for now just timer)
    this.startGameLoop();
  }

  private autoAssignHeroes() {
    const usedHeroes = new Set<string>();

    // Collect locked heroes
    this.state.players.forEach(player => {
      if (player.lockedHeroId) {
        usedHeroes.add(player.lockedHeroId);
      }
    });

    // Assign to players without locked heroes
    this.state.players.forEach(player => {
      if (!player.lockedHeroId) {
        const availableHeroes = HERO_IDS.filter(id => !usedHeroes.has(id));
        if (availableHeroes.length > 0) {
          const heroId = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
          player.selectedHeroId = heroId;
          player.lockedHeroId = heroId;
          player.isReady = true;
          usedHeroes.add(heroId);

          console.log(`Auto-assigned ${heroId} to ${player.displayName}`);
        }
      }
    });
  }

  private initializeHeroStats() {
    this.state.players.forEach(player => {
      const heroData = HEROES[player.lockedHeroId];
      if (heroData) {
        player.heroId = player.lockedHeroId;
        player.maxHealth = heroData.baseStats.maxHealth;
        player.currentHealth = heroData.baseStats.maxHealth;
        player.maxMana = heroData.baseStats.maxMana;
        player.currentMana = heroData.baseStats.maxMana;
        player.level = 1;
        player.gold = 600;
        player.goldEarned = 600; // Starting gold counts
        player.damageDealt = 0;
        player.isAlive = true;

        // Movement stats
        player.moveSpeed = heroData.baseStats.moveSpeed;
        player.isMoving = false;

        // Combat stats
        player.attackDamage = heroData.baseStats.attackDamage;
        player.attackSpeed = heroData.baseStats.attackSpeed;
        player.attackRange = heroData.baseStats.attackRange;
        player.armor = heroData.baseStats.armor;
        player.magicResist = heroData.baseStats.magicResist;
        player.attackCooldown = 0;
        player.targetId = '';

        // Set target position to current position so players don't start moving
        player.targetPosition.x = player.position.x;
        player.targetPosition.y = player.position.y;
        player.targetPosition.z = player.position.z;

        // Initialize abilities
        player.abilities.clear();
        const heroAbilities = getAbilitiesForHero(player.heroId);
        heroAbilities.forEach(abilityDef => {
          const abilityState = new AbilityState();
          abilityState.abilityId = abilityDef.id;
          abilityState.level = abilityDef.slot === 'R' ? 0 : 1; // R starts at 0, others at 1
          abilityState.currentCooldown = 0;
          abilityState.isActive = false;
          player.abilities.push(abilityState);
        });
      }
    });
  }

  private initializeTowers() {
    // Create towers from map configuration
    for (const towerConfig of MAIN_MAP.towers) {
      const tower = new TowerState();
      tower.id = towerConfig.id;
      tower.team = towerConfig.team;
      tower.lane = towerConfig.lane;
      tower.tier = towerConfig.tier;

      // Set position
      tower.position = new Vector3();
      tower.position.x = towerConfig.position.x;
      tower.position.y = 0;
      tower.position.z = towerConfig.position.z;

      // Get stats based on tier
      const tierKey = `tier${towerConfig.tier}` as keyof typeof TOWER_STATS;
      const stats = TOWER_STATS[tierKey];

      tower.maxHealth = stats.health;
      tower.currentHealth = stats.health;
      tower.armor = stats.armor;
      tower.attackDamage = stats.attackDamage;
      tower.attackRange = stats.attackRange;
      tower.attackSpeed = stats.attackSpeed;
      tower.attackCooldown = 0;

      tower.isAlive = true;
      tower.targetId = '';
      tower.isUnderAttack = false;

      this.state.towers.set(tower.id, tower);
    }

    console.log(`Initialized ${MAIN_MAP.towers.length} towers`);
  }

  private initializeJungleCamps() {
    // Create camps from map configuration
    for (const campConfig of MAIN_MAP.camps) {
      const camp = new JungleCampState();
      camp.id = campConfig.id;
      camp.difficulty = campConfig.difficulty;
      camp.team = campConfig.team;

      camp.position = new Vector3();
      camp.position.x = campConfig.position.x;
      camp.position.y = 0;
      camp.position.z = campConfig.position.z;

      camp.isCleared = false;
      camp.respawnTimer = 0;
      camp.lastClearedBy = '';

      this.state.jungleCamps.set(camp.id, camp);

      // Spawn initial monsters for this camp
      this.spawnCampMonsters(camp);
    }

    console.log(`Initialized ${MAIN_MAP.camps.length} jungle camps`);
  }

  private spawnCampMonsters(camp: JungleCampState) {
    // Get the composition for this difficulty
    const isRiverBoss = camp.id === 'river_boss';
    const composition = isRiverBoss
      ? RIVER_BOSS_COMPOSITION
      : CAMP_COMPOSITIONS[camp.difficulty as CampDifficulty];

    if (!composition) {
      console.warn(`No composition found for camp ${camp.id} with difficulty ${camp.difficulty}`);
      return;
    }

    const gameTime = this.state.gameTime;
    const campPosition = { x: camp.position.x, z: camp.position.z };
    const spawnPositions = getMonsterSpawnPositions(campPosition, composition);

    for (const spawn of spawnPositions) {
      const monster = new JungleMonsterState();
      monster.id = `monster_${camp.id}_${this.jungleMonsterIdCounter++}`;
      monster.campId = camp.id;
      monster.monsterType = spawn.type;

      // Get monster stats
      const baseStats = MONSTER_STATS[spawn.type as MonsterType];
      if (!baseStats) continue;

      const scaledStats = getScaledMonsterStats(baseStats, gameTime);

      monster.name = scaledStats.name;

      // Position
      monster.position = new Vector3();
      monster.position.x = spawn.position.x;
      monster.position.y = 0;
      monster.position.z = spawn.position.z;

      monster.spawnPosition = new Vector3();
      monster.spawnPosition.x = spawn.position.x;
      monster.spawnPosition.y = 0;
      monster.spawnPosition.z = spawn.position.z;

      monster.rotation = 0;

      // Stats
      monster.maxHealth = scaledStats.maxHealth;
      monster.currentHealth = scaledStats.maxHealth;
      monster.attackDamage = scaledStats.attackDamage;
      monster.attackSpeed = scaledStats.attackSpeed;
      monster.attackRange = scaledStats.attackRange;
      monster.moveSpeed = scaledStats.moveSpeed;
      monster.armor = scaledStats.armor;
      monster.magicResist = scaledStats.magicResist;
      monster.attackCooldown = 0;
      monster.goldReward = scaledStats.goldReward;
      monster.experienceReward = scaledStats.experienceReward;

      // State
      monster.isAlive = true;
      monster.targetId = '';
      monster.isAggro = false;
      monster.isResetting = false;

      this.state.jungleMonsters.set(monster.id, monster);
    }

    camp.isCleared = false;
  }

  private startGameLoop() {
    this.lastTickTime = Date.now();
    this.gameTimeAccumulator = 0;
    this.goldAccumulator = 0;

    this.gameLoopInterval = setInterval(() => {
      if (this.state.phase !== 'playing' || this.state.isPaused) return;

      const now = Date.now();
      const deltaTime = (now - this.lastTickTime) / 1000; // Convert to seconds
      this.lastTickTime = now;

      // Update game time (increment every second)
      this.gameTimeAccumulator += deltaTime;
      if (this.gameTimeAccumulator >= 1) {
        this.state.gameTime++;
        this.gameTimeAccumulator -= 1;

        // Check time limit win condition
        if (this.state.gameTime >= GAME_CONFIG.maxGameTime) {
          this.handleTimeLimit();
          return;
        }
      }

      // Passive gold income (every second)
      this.goldAccumulator += deltaTime;
      if (this.goldAccumulator >= 1) {
        this.state.players.forEach(player => {
          if (player.isAlive) {
            player.gold += GAME_CONFIG.goldPerSecond;
            player.goldEarned += GAME_CONFIG.goldPerSecond;
          }
        });
        this.goldAccumulator -= 1;
      }

      // Update all players
      this.state.players.forEach(player => {
        if (player.isAlive) {
          this.updatePlayerBuffs(player, deltaTime);
          this.updatePlayerMovement(player, deltaTime);
          this.updatePlayerCombat(player, deltaTime);
          this.updatePlayerAbilityCooldowns(player, deltaTime);
        } else {
          this.updatePlayerRespawn(player, deltaTime);
        }
      });

      // Update all towers
      this.state.towers.forEach(tower => {
        if (tower.isAlive) {
          this.updateTowerCombat(tower, deltaTime);
        }
      });

      // Spawn creep waves
      this.updateCreepSpawning();

      // Update all creeps
      this.state.creeps.forEach(creep => {
        if (creep.isAlive) {
          this.updateCreepAI(creep, deltaTime);
        }
      });

      // Update jungle camps (respawn timers)
      this.updateJungleCamps(deltaTime);

      // Update all jungle monsters
      this.state.jungleMonsters.forEach(monster => {
        if (monster.isAlive) {
          this.updateJungleMonsterAI(monster, deltaTime);
        }
      });

      // Update vision / fog of war (every VISION_CONFIG.visionUpdateInterval ms)
      this.visionAccumulator += deltaTime * 1000; // Convert to ms
      if (this.visionAccumulator >= VISION_CONFIG.visionUpdateInterval) {
        this.updateVision();
        this.visionAccumulator = 0;
      }
    }, TICK_INTERVAL_MS);
  }

  private updatePlayerMovement(player: GamePlayer, deltaTime: number) {
    // Check if player is stunned or rooted (cannot move)
    if (this.hasBuffType(player, 'stun') || this.hasBuffType(player, 'root')) {
      player.isMoving = false;
      return;
    }

    // Calculate distance to target
    const dx = player.targetPosition.x - player.position.x;
    const dz = player.targetPosition.z - player.position.z;
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz);

    // Check if arrived at target
    if (distanceToTarget <= ARRIVAL_THRESHOLD) {
      player.isMoving = false;
      return;
    }

    // Get movement speed from hero stats with buff modifiers
    const effectiveStats = this.getEffectiveStats(player);
    const moveSpeed = effectiveStats.moveSpeed;
    player.moveSpeed = moveSpeed;
    player.isMoving = true;

    // Calculate movement for this tick
    const moveDistance = moveSpeed * deltaTime;

    // Normalize direction and apply movement
    const dirX = dx / distanceToTarget;
    const dirZ = dz / distanceToTarget;

    // Calculate new position
    let newX = player.position.x + dirX * moveDistance;
    let newZ = player.position.z + dirZ * moveDistance;

    // If we would overshoot, try to snap to target
    if (moveDistance >= distanceToTarget) {
      newX = player.targetPosition.x;
      newZ = player.targetPosition.z;
    }

    // Clamp to map boundaries
    const halfMapWidth = BALANCE.mapWidth / 2;
    const halfMapHeight = BALANCE.mapHeight / 2;
    newX = Math.max(-halfMapWidth, Math.min(halfMapWidth, newX));
    newZ = Math.max(-halfMapHeight, Math.min(halfMapHeight, newZ));

    // Check for obstacle collision with player radius
    const playerRadius = ENTITY_COLLISION_CONFIG.player.radius;
    const newPoint: Point2D = { x: newX, z: newZ };
    const terrainCollision = this.checkCollisionWithRadius(newPoint, playerRadius);

    if (terrainCollision) {
      // Try to slide along the obstacle
      const slideResult = this.trySlideMovement(
        { x: player.position.x, z: player.position.z },
        newPoint,
        terrainCollision,
        playerRadius
      );

      if (slideResult) {
        newX = slideResult.x;
        newZ = slideResult.z;
      } else {
        // Can't move, stop
        player.isMoving = false;
        return;
      }
    }

    // Check for unit-to-unit collision
    const playerTraits = this.getPlayerPassthroughTraits(player);
    const unitCollision = this.checkUnitCollision(
      player.id,
      'player',
      newX,
      newZ,
      playerRadius,
      playerTraits
    );

    if (unitCollision) {
      // Try to slide around the unit
      const slideResult = this.tryUnitSlideMovement(
        player.id,
        'player',
        player.position.x,
        player.position.z,
        newX,
        newZ,
        playerRadius,
        playerTraits
      );

      if (slideResult) {
        newX = slideResult.x;
        newZ = slideResult.z;
      } else {
        // Try to resolve by pushing back
        const resolved = this.resolveUnitCollision(
          player.position.x,
          player.position.z,
          newX,
          newZ,
          unitCollision
        );
        newX = resolved.x;
        newZ = resolved.z;

        // If still colliding after push, don't move
        const stillColliding = this.checkUnitCollision(
          player.id,
          'player',
          newX,
          newZ,
          playerRadius,
          playerTraits
        );
        if (stillColliding) {
          // Can't move, stay in place
          player.isMoving = false;
          return;
        }
      }
    }

    player.position.x = newX;
    player.position.z = newZ;

    // Check if arrived at current waypoint
    const newDx = player.targetPosition.x - newX;
    const newDz = player.targetPosition.z - newZ;
    if (Math.sqrt(newDx * newDx + newDz * newDz) <= ARRIVAL_THRESHOLD) {
      // Check if there are more waypoints in the path
      const path = this.playerPaths.get(player.id);
      if (path && path.length > 0) {
        // Remove the current waypoint and move to next
        path.shift();
        if (path.length > 0) {
          // Set next waypoint as target
          player.targetPosition.x = path[0].x;
          player.targetPosition.z = path[0].z;
        } else {
          // Reached final destination
          this.playerPaths.delete(player.id);
          player.isMoving = false;
        }
      } else {
        player.isMoving = false;
      }
    }

    // Update rotation to face movement direction
    player.rotation = Math.atan2(dirX, dirZ);
  }

  /**
   * Check if a point with radius collides with any obstacle
   */
  private checkCollisionWithRadius(point: Point2D, radius: number): Obstacle | null {
    for (const obstacle of MAIN_MAP.obstacles) {
      if (!obstacle.blocksMovement) continue;

      if (obstacle.shape === 'circle') {
        const circle = obstacle.bounds as Circle;
        const dx = point.x - circle.x;
        const dz = point.z - circle.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < circle.radius + radius) {
          return obstacle;
        }
      } else {
        // Rectangle collision with circle (player)
        const rect = obstacle.bounds as Rectangle;
        // Find closest point on rectangle to circle center
        const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
        const closestZ = Math.max(rect.z, Math.min(point.z, rect.z + rect.height));
        const dx = point.x - closestX;
        const dz = point.z - closestZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < radius) {
          return obstacle;
        }
      }
    }
    return null;
  }

  /**
   * Try to slide along an obstacle instead of stopping completely
   */
  private trySlideMovement(
    from: Point2D,
    to: Point2D,
    _obstacle: Obstacle,
    playerRadius: number
  ): Point2D | null {
    // Try sliding along X axis only
    const slideX: Point2D = { x: to.x, z: from.z };
    if (!this.checkCollisionWithRadius(slideX, playerRadius)) {
      return slideX;
    }

    // Try sliding along Z axis only
    const slideZ: Point2D = { x: from.x, z: to.z };
    if (!this.checkCollisionWithRadius(slideZ, playerRadius)) {
      return slideZ;
    }

    // Can't slide, return null
    return null;
  }

  // ============================================
  // Unit-to-Unit Collision System
  // ============================================

  /**
   * Get passthrough traits from player's active buffs
   */
  private getPlayerPassthroughTraits(player: GamePlayer): PassthroughTrait[] {
    const traits: PassthroughTrait[] = [];

    for (let i = 0; i < player.buffs.length; i++) {
      const buff = player.buffs.at(i);
      if (!buff) continue;

      // Check for collision-modifying buff types
      if (buff.type === 'phase' || buff.buffId.includes('phase')) {
        traits.push('phase_units');
      }
      if (buff.type === 'flying' || buff.buffId.includes('flying')) {
        traits.push('flying');
      }
      if (buff.buffId.includes('ghost') || buff.buffId.includes('ethereal')) {
        traits.push('phase_all');
      }
    }

    return traits;
  }

  /**
   * Check collision between a moving entity and all other units
   * Returns the collision with deepest penetration if any
   */
  private checkUnitCollision(
    entityId: string,
    entityType: CollisionEntityType,
    newX: number,
    newZ: number,
    entityRadius: number,
    entityTraits: PassthroughTrait[]
  ): { entityId: string; type: CollisionEntityType; penetration: { depth: number; normalX: number; normalZ: number } } | null {
    let deepestCollision: { entityId: string; type: CollisionEntityType; penetration: { depth: number; normalX: number; normalZ: number } } | null = null;

    // Check collision with players
    this.state.players.forEach((otherPlayer, playerId) => {
      if (playerId === entityId) return; // Skip self
      if (!otherPlayer.isAlive) return;

      const otherRadius = ENTITY_COLLISION_CONFIG.player.radius;
      const otherTraits = this.getPlayerPassthroughTraits(otherPlayer);

      // Check if these entities should collide
      if (!shouldEntitiesCollide(entityType, entityTraits, 'player', otherTraits)) {
        return;
      }

      const penetration = getCircleCollisionPenetration(
        newX, newZ, entityRadius,
        otherPlayer.position.x, otherPlayer.position.z, otherRadius
      );

      if (penetration && (!deepestCollision || penetration.depth > deepestCollision.penetration.depth)) {
        deepestCollision = { entityId: playerId, type: 'player', penetration };
      }
    });

    // Check collision with creeps
    this.state.creeps.forEach((creep, creepId) => {
      if (creepId === entityId) return;
      if (!creep.isAlive) return;

      const creepType = creep.type as keyof typeof CREEP_COLLISION_RADIUS;
      const otherRadius = CREEP_COLLISION_RADIUS[creepType] || ENTITY_COLLISION_CONFIG.creep.radius;

      // Check if these entities should collide
      if (!shouldEntitiesCollide(entityType, entityTraits, 'creep', [])) {
        return;
      }

      const penetration = getCircleCollisionPenetration(
        newX, newZ, entityRadius,
        creep.position.x, creep.position.z, otherRadius
      );

      if (penetration && (!deepestCollision || penetration.depth > deepestCollision.penetration.depth)) {
        deepestCollision = { entityId: creepId, type: 'creep', penetration };
      }
    });

    // Check collision with jungle monsters
    this.state.jungleMonsters.forEach((monster, monsterId) => {
      if (monsterId === entityId) return;
      if (!monster.isAlive) return;

      const otherRadius = MONSTER_COLLISION_RADIUS[monster.monsterType] || ENTITY_COLLISION_CONFIG.monster.radius;

      // Check if these entities should collide
      if (!shouldEntitiesCollide(entityType, entityTraits, 'monster', [])) {
        return;
      }

      const penetration = getCircleCollisionPenetration(
        newX, newZ, entityRadius,
        monster.position.x, monster.position.z, otherRadius
      );

      if (penetration && (!deepestCollision || penetration.depth > deepestCollision.penetration.depth)) {
        deepestCollision = { entityId: monsterId, type: 'monster', penetration };
      }
    });

    // Check collision with towers
    this.state.towers.forEach((tower, towerId) => {
      if (!tower.isAlive) return;

      const otherRadius = ENTITY_COLLISION_CONFIG.tower.radius;

      // Check if these entities should collide
      if (!shouldEntitiesCollide(entityType, entityTraits, 'tower', [])) {
        return;
      }

      const penetration = getCircleCollisionPenetration(
        newX, newZ, entityRadius,
        tower.position.x, tower.position.z, otherRadius
      );

      if (penetration && (!deepestCollision || penetration.depth > deepestCollision.penetration.depth)) {
        deepestCollision = { entityId: towerId, type: 'tower', penetration };
      }
    });

    return deepestCollision;
  }

  /**
   * Resolve unit collision by pushing back the moving entity
   */
  private resolveUnitCollision(
    _currentX: number,
    _currentZ: number,
    newX: number,
    newZ: number,
    collision: { penetration: { depth: number; normalX: number; normalZ: number } }
  ): Point2D {
    // Push the entity back along the collision normal
    const pushX = collision.penetration.normalX * collision.penetration.depth;
    const pushZ = collision.penetration.normalZ * collision.penetration.depth;

    // Apply push to the new position
    let resolvedX = newX - pushX;
    let resolvedZ = newZ - pushZ;

    // Clamp to map boundaries
    const halfMapWidth = BALANCE.mapWidth / 2;
    const halfMapHeight = BALANCE.mapHeight / 2;
    resolvedX = Math.max(-halfMapWidth, Math.min(halfMapWidth, resolvedX));
    resolvedZ = Math.max(-halfMapHeight, Math.min(halfMapHeight, resolvedZ));

    return { x: resolvedX, z: resolvedZ };
  }

  /**
   * Try to find an alternate path around a unit collision
   */
  private tryUnitSlideMovement(
    entityId: string,
    entityType: CollisionEntityType,
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number,
    entityRadius: number,
    entityTraits: PassthroughTrait[]
  ): Point2D | null {
    // Try sliding along X axis only
    const slideX: Point2D = { x: toX, z: fromZ };
    if (!this.checkUnitCollision(entityId, entityType, slideX.x, slideX.z, entityRadius, entityTraits)) {
      // Also check terrain collision
      if (!this.checkCollisionWithRadius(slideX, entityRadius)) {
        return slideX;
      }
    }

    // Try sliding along Z axis only
    const slideZ: Point2D = { x: fromX, z: toZ };
    if (!this.checkUnitCollision(entityId, entityType, slideZ.x, slideZ.z, entityRadius, entityTraits)) {
      // Also check terrain collision
      if (!this.checkCollisionWithRadius(slideZ, entityRadius)) {
        return slideZ;
      }
    }

    return null;
  }

  /**
   * Update player buffs - tick durations, apply DoT/HoT, remove expired
   */
  private updatePlayerBuffs(player: GamePlayer, deltaTime: number) {
    const buffsToRemove: number[] = [];

    for (let i = 0; i < player.buffs.length; i++) {
      const buff = player.buffs.at(i);
      if (!buff) continue;

      const definition = BUFFS[buff.buffId];

      // Update remaining duration
      buff.remainingDuration -= deltaTime;

      // Check if buff expired
      if (buff.remainingDuration <= 0) {
        buffsToRemove.push(i);
        continue;
      }

      // Handle DoT (Damage over Time)
      if (definition && isDamageOverTime(buff.type as BuffType)) {
        const tickInterval = definition.tickInterval || 1;
        // Simple tick logic - apply damage every tick interval
        // We apply damage proportionally to deltaTime
        const damageThisTick = (buff.value * buff.stacks * deltaTime) / tickInterval;

        if (damageThisTick > 0) {
          const damageType = buff.type === 'burn' ? 'magical' : 'physical';

          if (damageType === 'physical') {
            // Physical DoT - reduced by armor
            const armorReduction = player.armor / (100 + player.armor);
            const actualDamage = damageThisTick * (1 - armorReduction);
            player.currentHealth = Math.max(0, player.currentHealth - actualDamage);
          } else {
            // Magical DoT - reduced by magic resist
            const mrReduction = player.magicResist / (100 + player.magicResist);
            const actualDamage = damageThisTick * (1 - mrReduction);
            player.currentHealth = Math.max(0, player.currentHealth - actualDamage);
          }

          // Track damage dealt by source
          const source = this.state.players.get(buff.sourceId);
          if (source && source.id !== player.id) {
            source.damageDealt += damageThisTick;
          }
        }
      }

      // Handle HoT (Heal over Time)
      if (definition && isHealOverTime(buff.type as BuffType)) {
        const tickInterval = definition.tickInterval || 1;
        // Apply healing proportionally to deltaTime
        const healingThisTick = (buff.value * buff.stacks * deltaTime) / tickInterval;
        if (healingThisTick > 0) {
          player.currentHealth = Math.min(player.maxHealth, player.currentHealth + healingThisTick);
        }
      }

      // Handle shield decay (shields don't naturally decay, but we track them)
      // Shield absorption happens in the damage calculation
    }

    // Remove expired buffs (in reverse order to maintain indices)
    for (let i = buffsToRemove.length - 1; i >= 0; i--) {
      player.buffs.splice(buffsToRemove[i], 1);
    }

    // Check for death from DoT
    if (player.currentHealth <= 0 && player.isAlive) {
      // Find the DoT source for kill credit
      const buffArray = Array.from(player.buffs);
      const dotBuff = buffArray.find(b => b && isDamageOverTime(b.type as BuffType));
      const killerId = dotBuff?.sourceId || '';
      const killer = this.state.players.get(killerId);
      if (killer) {
        this.handleKill(killer, player);
      } else {
        // No valid killer, handle death without kill credit
        player.isAlive = false;
        player.deaths++;
        player.respawnTime = GAME_CONFIG.respawnTimeBase + (player.level * GAME_CONFIG.respawnTimePerLevel);
      }
    }
  }

  /**
   * Apply a buff to a player
   */
  protected applyBuff(
    target: GamePlayer,
    buffId: string,
    sourceId: string,
    duration?: number,
    value?: number
  ): void {
    const definition = BUFFS[buffId];
    if (!definition) return;

    const actualDuration = duration ?? definition.defaultDuration;
    const actualValue = value ?? definition.defaultValue ?? 0;

    // Check if buff already exists
    const existingBuff = target.buffs.find(b => b.buffId === buffId);

    if (existingBuff) {
      if (definition.stackable) {
        // Add stack
        existingBuff.stacks = Math.min(existingBuff.stacks + 1, definition.maxStacks || 99);
        if (definition.refreshDuration) {
          existingBuff.remainingDuration = actualDuration;
        }
      } else if (definition.refreshDuration) {
        // Refresh duration
        existingBuff.remainingDuration = actualDuration;
        // Use higher value
        if (actualValue > existingBuff.value) {
          existingBuff.value = actualValue;
        }
      }
      return;
    }

    // Create new buff
    const buffState = new BuffState();
    buffState.id = `${buffId}_${sourceId}_${Date.now()}`;
    buffState.buffId = buffId;
    buffState.type = definition.type;
    buffState.sourceId = sourceId;
    buffState.remainingDuration = actualDuration;
    buffState.value = actualValue;
    buffState.stacks = 1;

    target.buffs.push(buffState);
  }

  /**
   * Remove a specific buff from a player
   */
  protected removeBuff(target: GamePlayer, buffId: string): void {
    const index = target.buffs.findIndex(b => b.buffId === buffId);
    if (index !== -1) {
      target.buffs.splice(index, 1);
    }
  }

  /**
   * Remove all buffs of a certain type from a player
   */
  protected removeBuffsByType(target: GamePlayer, type: BuffType): void {
    for (let i = target.buffs.length - 1; i >= 0; i--) {
      const buff = target.buffs.at(i);
      if (buff && buff.type === type) {
        target.buffs.splice(i, 1);
      }
    }
  }

  /**
   * Clear all buffs from a player (e.g., on death)
   */
  protected clearAllBuffs(target: GamePlayer): void {
    target.buffs.splice(0, target.buffs.length);
  }

  /**
   * Check if player has a specific buff
   */
  protected hasBuff(player: GamePlayer, buffId: string): boolean {
    return player.buffs.some(b => b.buffId === buffId);
  }

  /**
   * Check if player has any buff of a specific type
   */
  private hasBuffType(player: GamePlayer, type: BuffType): boolean {
    return player.buffs.some(b => b.type === type);
  }

  /**
   * Get player's effective stats with buff modifiers
   */
  private getEffectiveStats(player: GamePlayer): {
    moveSpeed: number;
    attackSpeed: number;
    armor: number;
    magicResist: number;
  } {
    const heroData = HEROES[player.heroId];
    if (!heroData) {
      return {
        moveSpeed: player.moveSpeed,
        attackSpeed: player.attackSpeed,
        armor: player.armor,
        magicResist: player.magicResist,
      };
    }

    // Convert BuffState[] to AppliedBuff[] format for helper functions
    const appliedBuffs: AppliedBuff[] = player.buffs.map(b => ({
      id: b.id,
      buffId: b.buffId,
      type: b.type as BuffType,
      sourceId: b.sourceId,
      targetId: player.id,
      startTime: Date.now() - (b.remainingDuration * 1000),
      duration: BUFFS[b.buffId]?.defaultDuration || b.remainingDuration,
      remainingDuration: b.remainingDuration,
      value: b.value,
      stacks: b.stacks,
    }));

    const moveSpeedMod = calculateMoveSpeedModifier(appliedBuffs);
    const attackSpeedMod = calculateAttackSpeedModifier(appliedBuffs);
    const armorMod = calculateArmorModifier(appliedBuffs);
    const mrMod = calculateMagicResistModifier(appliedBuffs);

    return {
      moveSpeed: heroData.baseStats.moveSpeed * moveSpeedMod,
      attackSpeed: player.attackSpeed * attackSpeedMod,
      armor: Math.max(0, player.armor + armorMod),
      magicResist: Math.max(0, player.magicResist + mrMod),
    };
  }

  private updatePlayerCombat(player: GamePlayer, deltaTime: number) {
    // Check if player is stunned or disarmed (cannot attack)
    if (this.hasBuffType(player, 'stun') || this.hasBuffType(player, 'disarm')) {
      return;
    }

    // Reduce attack cooldown (with attack speed modifiers)
    if (player.attackCooldown > 0) {
      const effectiveStats = this.getEffectiveStats(player);
      const attackSpeedMod = effectiveStats.attackSpeed / player.attackSpeed;
      player.attackCooldown = Math.max(0, player.attackCooldown - deltaTime * attackSpeedMod);
    }

    // Check if player has a target
    if (!player.targetId) return;

    // Try to find target as player, creep, tower, or monster
    let targetX = 0;
    let targetZ = 0;
    let targetValid = false;
    let targetType: 'player' | 'creep' | 'tower' | 'monster' = 'player';

    const targetPlayer = this.state.players.get(player.targetId);
    if (targetPlayer && targetPlayer.isAlive && targetPlayer.team !== player.team) {
      targetX = targetPlayer.position.x;
      targetZ = targetPlayer.position.z;
      targetValid = true;
      targetType = 'player';
    }

    if (!targetValid) {
      const targetCreep = this.state.creeps.get(player.targetId);
      if (targetCreep && targetCreep.isAlive && targetCreep.team !== player.team) {
        targetX = targetCreep.position.x;
        targetZ = targetCreep.position.z;
        targetValid = true;
        targetType = 'creep';
      }
    }

    if (!targetValid) {
      const targetTower = this.state.towers.get(player.targetId);
      if (targetTower && targetTower.isAlive && targetTower.team !== player.team) {
        targetX = targetTower.position.x;
        targetZ = targetTower.position.z;
        targetValid = true;
        targetType = 'tower';
      }
    }

    if (!targetValid) {
      const targetMonster = this.state.jungleMonsters.get(player.targetId);
      if (targetMonster && targetMonster.isAlive) {
        targetX = targetMonster.position.x;
        targetZ = targetMonster.position.z;
        targetValid = true;
        targetType = 'monster';
      }
    }

    // Clear target if invalid
    if (!targetValid) {
      player.targetId = '';
      return;
    }

    // Calculate distance to target
    const dx = targetX - player.position.x;
    const dz = targetZ - player.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // If out of range, move toward target
    if (distance > player.attackRange) {
      // Set target position to be within attack range
      const moveDistance = distance - player.attackRange + 10; // +10 to get slightly closer
      const dirX = dx / distance;
      const dirZ = dz / distance;

      player.targetPosition.x = player.position.x + dirX * moveDistance;
      player.targetPosition.z = player.position.z + dirZ * moveDistance;
      return;
    }

    // In range - stop moving and attack
    player.targetPosition.x = player.position.x;
    player.targetPosition.z = player.position.z;
    player.isMoving = false;

    // Face target
    player.rotation = Math.atan2(dx, dz);

    // Attack if cooldown is ready
    if (player.attackCooldown <= 0) {
      if (targetType === 'player') {
        const target = this.state.players.get(player.targetId)!;
        this.performAttack(player, target);
      } else if (targetType === 'creep') {
        this.handleAttackCreep(player, player.targetId);
      } else if (targetType === 'tower') {
        const target = this.state.towers.get(player.targetId)!;
        this.handleAttackTower(player, player.targetId);
        this.damageTower(target, player.attackDamage, player);
      } else if (targetType === 'monster') {
        this.handleAttackMonster(player, player.targetId);
      }
    }
  }

  private performAttack(attacker: GamePlayer, target: GamePlayer) {
    // Calculate damage with armor reduction
    // Armor formula: damageMultiplier = 100 / (100 + armor)
    const armorReduction = 100 / (100 + target.armor);
    const damage = Math.floor(attacker.attackDamage * armorReduction);

    // Apply damage
    target.currentHealth = Math.max(0, target.currentHealth - damage);

    // Track damage dealt
    attacker.damageDealt += damage;

    // Set attack cooldown (1 / attackSpeed = time between attacks)
    attacker.attackCooldown = 1 / attacker.attackSpeed;

    // Check for kill
    if (target.currentHealth <= 0) {
      this.handleKill(attacker, target);
    }
  }

  private handleKill(killer: GamePlayer, victim: GamePlayer) {
    // Mark victim as dead
    victim.isAlive = false;
    victim.deaths++;
    victim.targetId = '';

    // Credit killer
    killer.kills++;
    killer.targetId = '';

    // Update team score
    if (killer.team === 'radiant') {
      this.state.radiantScore++;
    } else {
      this.state.direScore++;
    }

    // Award gold to killer (base + per level)
    const killGold = BALANCE.heroKillGoldBase + (victim.level * BALANCE.heroKillGoldPerLevel);
    killer.gold += killGold;
    killer.goldEarned += killGold;

    // Award experience to killer
    const killExp = this.calculateKillExperience(victim.level);
    this.awardExperience(killer, killExp);

    // Set respawn timer (base + per level)
    victim.respawnTime = GAME_CONFIG.respawnTimeBase + (victim.level * GAME_CONFIG.respawnTimePerLevel);

    console.log(`${killer.displayName} killed ${victim.displayName} (+${killGold} gold, +${killExp} exp)`);

    // Check for win condition
    this.checkWinCondition();
  }

  private checkWinCondition() {
    if (this.state.phase !== 'playing') return;

    // Check kill-based win
    if (this.state.radiantScore >= GAME_CONFIG.killsToWin) {
      this.endGame('radiant');
    } else if (this.state.direScore >= GAME_CONFIG.killsToWin) {
      this.endGame('dire');
    }
    // Time limit win will be checked in game loop
  }

  private async endGame(winner: 'radiant' | 'dire') {
    this.state.phase = 'ended';
    this.state.winner = winner;

    // Stop game loop
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    // Collect player stats for the end screen
    const playerStats: Array<{
      oddsUserId: string;
      oddsDisplayName: string;
      team: string;
      heroId: string;
      kills: number;
      deaths: number;
      assists: number;
      goldEarned: number;
      damageDealt: number;
      isBot: boolean;
      isWinner: boolean;
    }> = [];

    this.state.players.forEach(player => {
      playerStats.push({
        oddsUserId: player.userId,
        oddsDisplayName: player.displayName,
        team: player.team,
        heroId: player.heroId,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        goldEarned: player.goldEarned,
        damageDealt: player.damageDealt,
        isBot: player.isBot,
        isWinner: player.team === winner,
      });
    });

    // Broadcast game end with full stats
    this.broadcast('game_end', {
      winner,
      radiantScore: this.state.radiantScore,
      direScore: this.state.direScore,
      gameTime: this.state.gameTime,
      playerStats,
    });

    console.log(`Game ended! Winner: ${winner} (Radiant: ${this.state.radiantScore}, Dire: ${this.state.direScore})`);

    // Save match results to database (only once)
    if (!this.matchSaved && this.gameStartedAt) {
      this.matchSaved = true;
      const endedAt = new Date();

      const matchPlayers: MatchPlayerResult[] = playerStats.map(p => ({
        oddsUserId: p.isBot ? null : p.oddsUserId,
        team: p.team as 'radiant' | 'dire',
        heroId: p.heroId,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        goldEarned: p.goldEarned,
        damageDealt: p.damageDealt,
        isWinner: p.isWinner,
        displayName: p.oddsDisplayName,
        isBot: p.isBot,
      }));

      await saveMatchResult({
        matchId: this.state.matchId,
        startedAt: this.gameStartedAt,
        endedAt,
        durationSeconds: this.state.gameTime,
        winner,
        radiantScore: this.state.radiantScore,
        direScore: this.state.direScore,
        players: matchPlayers,
      });
    }
  }

  private handleTimeLimit() {
    // Team with more kills wins, or draw if equal
    if (this.state.radiantScore > this.state.direScore) {
      this.endGame('radiant');
    } else if (this.state.direScore > this.state.radiantScore) {
      this.endGame('dire');
    } else {
      // Draw - radiant wins by default (or could be extended)
      this.endGame('radiant');
      console.log('Game ended in a draw - Radiant wins by default');
    }
  }

  // ============================================
  // Tower Combat Logic
  // ============================================

  private updateTowerCombat(tower: TowerState, deltaTime: number) {
    // Reduce attack cooldown
    if (tower.attackCooldown > 0) {
      tower.attackCooldown = Math.max(0, tower.attackCooldown - deltaTime);
    }

    // Clear isUnderAttack flag (will be set if attacked this tick)
    tower.isUnderAttack = false;

    // Find target if we don't have one or current target is invalid
    if (!tower.targetId || !this.isValidTowerTarget(tower, tower.targetId)) {
      tower.targetId = this.findTowerTarget(tower);
    }

    // If no target, nothing to do
    if (!tower.targetId) return;

    // Determine if target is a player or creep
    const targetPlayer = this.state.players.get(tower.targetId);
    const targetCreep = this.state.creeps.get(tower.targetId);

    let targetX = 0;
    let targetZ = 0;

    if (targetPlayer) {
      targetX = targetPlayer.position.x;
      targetZ = targetPlayer.position.z;
    } else if (targetCreep) {
      targetX = targetCreep.position.x;
      targetZ = targetCreep.position.z;
    } else {
      tower.targetId = '';
      return;
    }

    // Calculate distance to target
    const dx = targetX - tower.position.x;
    const dz = targetZ - tower.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if target is in range
    if (distance > tower.attackRange) {
      tower.targetId = ''; // Clear target if out of range
      return;
    }

    // Attack if cooldown is ready
    if (tower.attackCooldown <= 0) {
      if (targetPlayer) {
        this.performTowerAttack(tower, targetPlayer);
      } else if (targetCreep) {
        this.performTowerAttackCreep(tower, targetCreep);
      }
    }
  }

  private isValidTowerTarget(tower: TowerState, targetId: string): boolean {
    // Check if target is a player
    const targetPlayer = this.state.players.get(targetId);
    if (targetPlayer) {
      if (!targetPlayer.isAlive || targetPlayer.team === tower.team) {
        return false;
      }

      const dx = targetPlayer.position.x - tower.position.x;
      const dz = targetPlayer.position.z - tower.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      return distance <= tower.attackRange;
    }

    // Check if target is a creep
    const targetCreep = this.state.creeps.get(targetId);
    if (targetCreep) {
      if (!targetCreep.isAlive || targetCreep.team === tower.team) {
        return false;
      }

      const dx = targetCreep.position.x - tower.position.x;
      const dz = targetCreep.position.z - tower.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      return distance <= tower.attackRange;
    }

    return false;
  }

  private findTowerTarget(tower: TowerState): string {
    let nearestCreepId: string = '';
    let nearestCreepDistance = Infinity;
    let nearestPlayerId: string = '';
    let nearestPlayerDistance = Infinity;

    // Find nearest enemy creep in range (higher priority)
    this.state.creeps.forEach(creep => {
      if (!creep.isAlive || creep.team === tower.team) return;

      const dx = creep.position.x - tower.position.x;
      const dz = creep.position.z - tower.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= tower.attackRange && distance < nearestCreepDistance) {
        nearestCreepDistance = distance;
        nearestCreepId = creep.id;
      }
    });

    // Find nearest enemy player in range
    this.state.players.forEach(player => {
      if (!player.isAlive || player.team === tower.team) return;

      // Check if player is untargetable
      if (this.hasBuffType(player, 'untargetable')) return;

      const dx = player.position.x - tower.position.x;
      const dz = player.position.z - tower.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= tower.attackRange && distance < nearestPlayerDistance) {
        nearestPlayerDistance = distance;
        nearestPlayerId = player.id;
      }
    });

    // Prioritize creeps over players (tower AI)
    if (nearestCreepId) {
      return nearestCreepId;
    }
    return nearestPlayerId;
  }

  private performTowerAttack(tower: TowerState, target: GamePlayer) {
    // Check if target is invulnerable
    if (this.hasBuffType(target, 'invulnerable')) {
      return;
    }

    // Calculate damage with armor reduction
    const armorReduction = 100 / (100 + target.armor);
    const damage = Math.floor(tower.attackDamage * armorReduction);

    // Apply damage
    target.currentHealth = Math.max(0, target.currentHealth - damage);

    // Set attack cooldown (1 / attackSpeed = time between attacks)
    tower.attackCooldown = 1 / tower.attackSpeed;

    // Check for kill
    if (target.currentHealth <= 0) {
      this.handleTowerKill(tower, target);
    }
  }

  private performTowerAttackCreep(tower: TowerState, target: CreepState) {
    // Calculate damage with armor reduction
    const armorReduction = 100 / (100 + target.armor);
    const damage = Math.floor(tower.attackDamage * armorReduction);

    // Apply damage
    target.currentHealth = Math.max(0, target.currentHealth - damage);

    // Set attack cooldown (1 / attackSpeed = time between attacks)
    tower.attackCooldown = 1 / tower.attackSpeed;

    // Check for kill (no rewards for tower kills)
    if (target.currentHealth <= 0) {
      target.isAlive = false;
      tower.targetId = '';

      // Remove creep after short delay
      setTimeout(() => {
        this.state.creeps.delete(target.id);
      }, 1000);
    }
  }

  private handleTowerKill(tower: TowerState, victim: GamePlayer) {
    // Mark victim as dead
    victim.isAlive = false;
    victim.deaths++;
    victim.targetId = '';

    // Tower kills don't count toward team score
    // (Only player kills count)

    // Set respawn timer
    victim.respawnTime = GAME_CONFIG.respawnTimeBase + (victim.level * GAME_CONFIG.respawnTimePerLevel);

    // Clear tower's target
    tower.targetId = '';

    console.log(`${victim.displayName} was killed by ${tower.team} tower (${tower.id})`);
  }

  // Allow players to attack towers
  protected handleAttackTower(player: GamePlayer, towerId: string) {
    const tower = this.state.towers.get(towerId);
    if (!tower || !tower.isAlive || tower.team === player.team) return;

    // Mark tower as under attack (for visual indicator)
    tower.isUnderAttack = true;
  }

  protected damageTower(tower: TowerState, damage: number, attacker: GamePlayer): void {
    // Apply armor reduction
    const armorReduction = 100 / (100 + tower.armor);
    const actualDamage = Math.floor(damage * armorReduction);

    tower.currentHealth = Math.max(0, tower.currentHealth - actualDamage);
    tower.isUnderAttack = true;

    // Track damage dealt by attacker
    attacker.damageDealt += actualDamage;

    // Check for tower destruction
    if (tower.currentHealth <= 0) {
      this.handleTowerDestroyed(tower, attacker);
    }
  }

  private handleTowerDestroyed(tower: TowerState, lastHitPlayer: GamePlayer) {
    tower.isAlive = false;
    tower.targetId = '';

    // Award gold to last hitter
    lastHitPlayer.gold += TOWER_CONFIG.destroyGoldLastHit;
    lastHitPlayer.goldEarned += TOWER_CONFIG.destroyGoldLastHit;

    // Award gold to all team members
    this.state.players.forEach(player => {
      if (player.team === lastHitPlayer.team) {
        player.gold += TOWER_CONFIG.destroyGoldGlobal;
        player.goldEarned += TOWER_CONFIG.destroyGoldGlobal;
      }
    });

    console.log(`${lastHitPlayer.displayName} destroyed ${tower.team} ${tower.lane} T${tower.tier} tower!`);

    // Check for ancient destruction (T4 towers = ancient defense)
    if (tower.tier === 4) {
      // Count remaining T4 towers for this team
      let remainingT4Towers = 0;
      this.state.towers.forEach(t => {
        if (t.team === tower.team && t.tier === 4 && t.isAlive) {
          remainingT4Towers++;
        }
      });

      // If all T4 towers destroyed, that team loses
      if (remainingT4Towers === 0) {
        const winner = tower.team === 'radiant' ? 'dire' : 'radiant';
        console.log(`All ${tower.team} ancient towers destroyed! ${winner} wins!`);
        this.endGame(winner as 'radiant' | 'dire');
      }
    }
  }

  // ============================================
  // Creep Spawning and AI Logic
  // ============================================

  private updateCreepSpawning() {
    const gameTime = this.state.gameTime;

    // Wait for initial spawn delay
    if (gameTime < CREEP_SPAWN_CONFIG.initialSpawnDelay) {
      return;
    }

    // Check if it's time to spawn a new wave
    const timeSinceFirstWave = gameTime - CREEP_SPAWN_CONFIG.initialSpawnDelay;
    const expectedWaveNumber = Math.floor(timeSinceFirstWave / CREEP_SPAWN_CONFIG.waveInterval) + 1;

    if (expectedWaveNumber > this.state.currentWave) {
      this.spawnCreepWave(expectedWaveNumber);
    }
  }

  private spawnCreepWave(waveNumber: number) {
    this.state.currentWave = waveNumber;
    const composition = getWaveComposition(waveNumber);
    const gameTime = this.state.gameTime;

    console.log(`Spawning wave ${waveNumber}: ${composition.melee} melee, ${composition.ranged} ranged, ${composition.siege} siege`);

    // Spawn for each lane
    const lanes: Array<'top' | 'mid' | 'bot'> = ['top', 'mid', 'bot'];

    for (const lane of lanes) {
      // Spawn for radiant team
      this.spawnCreepsForTeam('radiant', lane, composition, gameTime);
      // Spawn for dire team
      this.spawnCreepsForTeam('dire', lane, composition, gameTime);
    }
  }

  private spawnCreepsForTeam(
    team: 'radiant' | 'dire',
    lane: 'top' | 'mid' | 'bot',
    composition: { melee: number; ranged: number; siege: number },
    gameTime: number
  ) {
    const laneConfig = MAIN_MAP.lanes.find(l => l.type === lane);
    if (!laneConfig) return;

    // Get spawn position (first waypoint)
    const waypoints = team === 'radiant' ? laneConfig.waypoints.radiant : laneConfig.waypoints.dire;
    if (waypoints.length === 0) return;

    const spawnPoint = waypoints[0];
    let creepIndex = 0;

    // Spawn melee creeps
    for (let i = 0; i < composition.melee; i++) {
      this.spawnCreep(team, lane, 'melee', spawnPoint, creepIndex++, gameTime, waypoints);
    }

    // Spawn ranged creeps
    for (let i = 0; i < composition.ranged; i++) {
      this.spawnCreep(team, lane, 'ranged', spawnPoint, creepIndex++, gameTime, waypoints);
    }

    // Spawn siege creeps
    for (let i = 0; i < composition.siege; i++) {
      this.spawnCreep(team, lane, 'siege', spawnPoint, creepIndex++, gameTime, waypoints);
    }
  }

  private spawnCreep(
    team: 'radiant' | 'dire',
    lane: 'top' | 'mid' | 'bot',
    type: CreepType,
    spawnPoint: Point2D,
    index: number,
    gameTime: number,
    waypoints: Point2D[]
  ) {
    const creep = new CreepState();
    creep.id = `creep_${team}_${lane}_${this.creepIdCounter++}`;
    creep.team = team;
    creep.type = type;
    creep.lane = lane;

    // Get scaled stats based on game time
    const baseStats = CREEP_STATS[type];
    const scaledStats = getScaledCreepStats(baseStats, gameTime);

    // Set position with spread
    const spreadX = (index % 3 - 1) * CREEP_SPAWN_CONFIG.spawnSpread;
    const spreadZ = Math.floor(index / 3) * CREEP_SPAWN_CONFIG.spawnSpread;

    creep.position = new Vector3();
    creep.position.x = spawnPoint.x + spreadX;
    creep.position.y = 0;
    creep.position.z = spawnPoint.z + spreadZ;

    // Set target to first waypoint after spawn
    creep.targetPosition = new Vector3();
    const nextWaypoint = waypoints.length > 1 ? waypoints[1] : waypoints[0];
    creep.targetPosition.x = nextWaypoint.x;
    creep.targetPosition.y = 0;
    creep.targetPosition.z = nextWaypoint.z;
    creep.waypointIndex = 1;

    // Set stats
    creep.maxHealth = scaledStats.maxHealth;
    creep.currentHealth = scaledStats.maxHealth;
    creep.attackDamage = scaledStats.attackDamage;
    creep.attackSpeed = scaledStats.attackSpeed;
    creep.attackRange = scaledStats.attackRange;
    creep.moveSpeed = scaledStats.moveSpeed;
    creep.armor = scaledStats.armor;
    creep.attackCooldown = 0;
    creep.goldReward = scaledStats.goldReward;
    creep.experienceReward = scaledStats.experienceReward;

    creep.isAlive = true;
    creep.targetId = '';
    creep.targetType = '';
    creep.isMoving = true;
    creep.rotation = 0;

    this.state.creeps.set(creep.id, creep);
  }

  private updateCreepAI(creep: CreepState, deltaTime: number) {
    // Reduce attack cooldown
    if (creep.attackCooldown > 0) {
      creep.attackCooldown = Math.max(0, creep.attackCooldown - deltaTime);
    }

    // Find target if we don't have one or current target is invalid
    if (!creep.targetId || !this.isValidCreepTarget(creep, creep.targetId, creep.targetType)) {
      this.findCreepTarget(creep);
    }

    // If we have a target, attack or move to it
    if (creep.targetId) {
      this.updateCreepCombat(creep, deltaTime);
    } else {
      // No target, continue along lane
      this.updateCreepMovement(creep, deltaTime);
    }
  }

  private isValidCreepTarget(creep: CreepState, targetId: string, targetType: string): boolean {
    if (targetType === 'player') {
      const target = this.state.players.get(targetId);
      if (!target || !target.isAlive || target.team === creep.team) return false;

      // Check if still in aggro range
      const dx = target.position.x - creep.position.x;
      const dz = target.position.z - creep.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance <= CREEP_AI_CONFIG.chaseRange;
    }

    if (targetType === 'creep') {
      const target = this.state.creeps.get(targetId);
      if (!target || !target.isAlive || target.team === creep.team) return false;

      const dx = target.position.x - creep.position.x;
      const dz = target.position.z - creep.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance <= CREEP_AI_CONFIG.chaseRange;
    }

    if (targetType === 'tower') {
      const target = this.state.towers.get(targetId);
      if (!target || !target.isAlive || target.team === creep.team) return false;

      const dx = target.position.x - creep.position.x;
      const dz = target.position.z - creep.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance <= CREEP_AI_CONFIG.aggroRange;
    }

    return false;
  }

  private findCreepTarget(creep: CreepState) {
    let bestTargetId = '';
    let bestTargetType = '';
    let bestPriority = Infinity;
    let bestDistance = Infinity;

    // Check for enemy creeps in aggro range
    this.state.creeps.forEach(target => {
      if (target.team === creep.team || !target.isAlive) return;

      const dx = target.position.x - creep.position.x;
      const dz = target.position.z - creep.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= CREEP_AI_CONFIG.aggroRange) {
        const priority = CREEP_AI_CONFIG.targetPriority.enemyCreep;
        if (priority < bestPriority || (priority === bestPriority && distance < bestDistance)) {
          bestTargetId = target.id;
          bestTargetType = 'creep';
          bestPriority = priority;
          bestDistance = distance;
        }
      }
    });

    // Check for enemy towers in aggro range (only if no creep targets)
    if (!bestTargetId) {
      this.state.towers.forEach(target => {
        if (target.team === creep.team || !target.isAlive) return;

        const dx = target.position.x - creep.position.x;
        const dz = target.position.z - creep.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= CREEP_AI_CONFIG.aggroRange) {
          const priority = CREEP_AI_CONFIG.targetPriority.enemyTower;
          if (priority < bestPriority || (priority === bestPriority && distance < bestDistance)) {
            bestTargetId = target.id;
            bestTargetType = 'tower';
            bestPriority = priority;
            bestDistance = distance;
          }
        }
      });
    }

    // Check for enemy players attacking creeps (lower priority than creeps/towers)
    this.state.players.forEach(target => {
      if (target.team === creep.team || !target.isAlive) return;

      const dx = target.position.x - creep.position.x;
      const dz = target.position.z - creep.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= CREEP_AI_CONFIG.aggroRange) {
        const priority = CREEP_AI_CONFIG.targetPriority.enemyHero;
        if (priority < bestPriority || (priority === bestPriority && distance < bestDistance)) {
          bestTargetId = target.id;
          bestTargetType = 'player';
          bestPriority = priority;
          bestDistance = distance;
        }
      }
    });

    creep.targetId = bestTargetId;
    creep.targetType = bestTargetType;
  }

  private updateCreepCombat(creep: CreepState, deltaTime: number) {
    let targetX = 0;
    let targetZ = 0;
    let targetHealth = 0;

    // Get target position based on type
    if (creep.targetType === 'player') {
      const target = this.state.players.get(creep.targetId);
      if (!target) {
        creep.targetId = '';
        creep.targetType = '';
        return;
      }
      targetX = target.position.x;
      targetZ = target.position.z;
      targetHealth = target.currentHealth;
    } else if (creep.targetType === 'creep') {
      const target = this.state.creeps.get(creep.targetId);
      if (!target) {
        creep.targetId = '';
        creep.targetType = '';
        return;
      }
      targetX = target.position.x;
      targetZ = target.position.z;
      targetHealth = target.currentHealth;
    } else if (creep.targetType === 'tower') {
      const target = this.state.towers.get(creep.targetId);
      if (!target) {
        creep.targetId = '';
        creep.targetType = '';
        return;
      }
      targetX = target.position.x;
      targetZ = target.position.z;
      targetHealth = target.currentHealth;
    }

    const dx = targetX - creep.position.x;
    const dz = targetZ - creep.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // If out of range, move toward target
    if (distance > creep.attackRange) {
      const dirX = dx / distance;
      const dirZ = dz / distance;

      const moveDistance = creep.moveSpeed * deltaTime;
      creep.position.x += dirX * moveDistance;
      creep.position.z += dirZ * moveDistance;
      creep.rotation = Math.atan2(dirX, dirZ);
      creep.isMoving = true;
      return;
    }

    // In range - stop and attack
    creep.isMoving = false;
    creep.rotation = Math.atan2(dx, dz);

    // Attack if cooldown ready
    if (creep.attackCooldown <= 0 && targetHealth > 0) {
      this.performCreepAttack(creep);
    }
  }

  private performCreepAttack(creep: CreepState) {
    if (creep.targetType === 'player') {
      const target = this.state.players.get(creep.targetId);
      if (!target || !target.isAlive) return;

      // Calculate damage with armor reduction
      const armorReduction = 100 / (100 + target.armor);
      const damage = Math.floor(creep.attackDamage * armorReduction);

      target.currentHealth = Math.max(0, target.currentHealth - damage);
      creep.attackCooldown = 1 / creep.attackSpeed;

      // Check for kill
      if (target.currentHealth <= 0) {
        // Creep kills a hero - no kill credit, just death
        target.isAlive = false;
        target.deaths++;
        target.targetId = '';
        target.respawnTime = GAME_CONFIG.respawnTimeBase + (target.level * GAME_CONFIG.respawnTimePerLevel);
        console.log(`${target.displayName} was killed by a creep`);
      }
    } else if (creep.targetType === 'creep') {
      const target = this.state.creeps.get(creep.targetId);
      if (!target || !target.isAlive) return;

      // Calculate damage with armor reduction
      const armorReduction = 100 / (100 + target.armor);
      const damage = Math.floor(creep.attackDamage * armorReduction);

      target.currentHealth = Math.max(0, target.currentHealth - damage);
      creep.attackCooldown = 1 / creep.attackSpeed;

      // Check for kill (no rewards for creep vs creep)
      if (target.currentHealth <= 0) {
        target.isAlive = false;
        // Remove dead creep after short delay
        setTimeout(() => {
          this.state.creeps.delete(target.id);
        }, 2000);
      }
    } else if (creep.targetType === 'tower') {
      const target = this.state.towers.get(creep.targetId);
      if (!target || !target.isAlive) return;

      // Calculate damage with armor reduction
      const armorReduction = 100 / (100 + target.armor);
      const damage = Math.floor(creep.attackDamage * armorReduction);

      target.currentHealth = Math.max(0, target.currentHealth - damage);
      target.isUnderAttack = true;
      creep.attackCooldown = 1 / creep.attackSpeed;

      // Check for tower destruction (no rewards for creep)
      if (target.currentHealth <= 0) {
        target.isAlive = false;
        target.targetId = '';
        console.log(`${target.team} ${target.lane} T${target.tier} tower destroyed by creeps!`);

        // Check for ancient destruction
        if (target.tier === 4) {
          let remainingT4Towers = 0;
          this.state.towers.forEach(t => {
            if (t.team === target.team && t.tier === 4 && t.isAlive) {
              remainingT4Towers++;
            }
          });

          if (remainingT4Towers === 0) {
            const winner = target.team === 'radiant' ? 'dire' : 'radiant';
            console.log(`All ${target.team} ancient towers destroyed! ${winner} wins!`);
            this.endGame(winner as 'radiant' | 'dire');
          }
        }
      }
    }
  }

  private updateCreepMovement(creep: CreepState, deltaTime: number) {
    // Get lane waypoints
    const laneConfig = MAIN_MAP.lanes.find(l => l.type === creep.lane);
    if (!laneConfig) return;

    const waypoints = creep.team === 'radiant' ? laneConfig.waypoints.radiant : laneConfig.waypoints.dire;
    if (waypoints.length === 0) return;

    // Calculate distance to current waypoint
    const dx = creep.targetPosition.x - creep.position.x;
    const dz = creep.targetPosition.z - creep.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if arrived at waypoint
    if (distance <= CREEP_ARRIVAL_THRESHOLD) {
      // Move to next waypoint
      creep.waypointIndex++;
      if (creep.waypointIndex < waypoints.length) {
        creep.targetPosition.x = waypoints[creep.waypointIndex].x;
        creep.targetPosition.z = waypoints[creep.waypointIndex].z;
      } else {
        // Reached end of lane (enemy base)
        // Stay at last waypoint and look for targets
        creep.waypointIndex = waypoints.length - 1;
      }
      return;
    }

    // Move toward waypoint
    const dirX = dx / distance;
    const dirZ = dz / distance;

    const moveDistance = creep.moveSpeed * deltaTime;
    let newX = creep.position.x + dirX * moveDistance;
    let newZ = creep.position.z + dirZ * moveDistance;

    // Get creep collision radius based on type
    const creepType = creep.type as keyof typeof CREEP_COLLISION_RADIUS;
    const creepRadius = CREEP_COLLISION_RADIUS[creepType] || ENTITY_COLLISION_CONFIG.creep.radius;

    // Check for unit collision (creeps don't have passthrough traits)
    const unitCollision = this.checkUnitCollision(
      creep.id,
      'creep',
      newX,
      newZ,
      creepRadius,
      []
    );

    if (unitCollision) {
      // Try to slide around the unit
      const slideResult = this.tryUnitSlideMovement(
        creep.id,
        'creep',
        creep.position.x,
        creep.position.z,
        newX,
        newZ,
        creepRadius,
        []
      );

      if (slideResult) {
        newX = slideResult.x;
        newZ = slideResult.z;
      } else {
        // Creeps just stop if they can't move (they'll try again next tick)
        creep.isMoving = false;
        return;
      }
    }

    creep.position.x = newX;
    creep.position.z = newZ;
    creep.rotation = Math.atan2(dirX, dirZ);
    creep.isMoving = true;
  }

  /**
   * Handle player attacking a creep
   */
  private handleAttackCreep(player: GamePlayer, creepId: string) {
    const creep = this.state.creeps.get(creepId);
    if (!creep || !creep.isAlive || creep.team === player.team) return;

    // Calculate damage
    const armorReduction = 100 / (100 + creep.armor);
    const damage = Math.floor(player.attackDamage * armorReduction);

    creep.currentHealth = Math.max(0, creep.currentHealth - damage);
    player.damageDealt += damage;
    player.attackCooldown = 1 / player.attackSpeed;

    // Check for last hit
    if (creep.currentHealth <= 0) {
      this.handleCreepKill(player, creep);
    }
  }

  private handleCreepKill(killer: GamePlayer, creep: CreepState) {
    creep.isAlive = false;

    // Award gold and experience to last hitter
    killer.gold += creep.goldReward;
    killer.goldEarned += creep.goldReward;
    killer.creepScore++;
    this.awardExperience(killer, creep.experienceReward);

    console.log(`${killer.displayName} last hit ${creep.type} creep (+${creep.goldReward} gold, +${creep.experienceReward} exp)`);

    // Remove creep after short delay
    setTimeout(() => {
      this.state.creeps.delete(creep.id);
    }, 1000);
  }

  // ============================================
  // Vision / Fog of War Logic
  // ============================================

  /**
   * Update visibility of all entities based on team vision
   * Called periodically (every VISION_CONFIG.visionUpdateInterval ms)
   */
  private updateVision() {
    // Collect all vision providers (heroes provide vision)
    const radiantVisionProviders: Array<{ x: number; z: number; range: number }> = [];
    const direVisionProviders: Array<{ x: number; z: number; range: number }> = [];

    // Players provide vision for their team
    this.state.players.forEach(player => {
      if (!player.isAlive) return;

      const visionRange = player.visionRange || VISION_CONFIG.heroVisionRange;
      const provider = {
        x: player.position.x,
        z: player.position.z,
        range: visionRange,
      };

      if (player.team === 'radiant') {
        radiantVisionProviders.push(provider);
      } else {
        direVisionProviders.push(provider);
      }
    });

    // Towers provide vision for their team
    this.state.towers.forEach(tower => {
      if (!tower.isAlive) return;

      const provider = {
        x: tower.position.x,
        z: tower.position.z,
        range: VISION_CONFIG.towerVisionRange,
      };

      if (tower.team === 'radiant') {
        radiantVisionProviders.push(provider);
      } else {
        direVisionProviders.push(provider);
      }
    });

    // Creeps provide vision for their team
    this.state.creeps.forEach(creep => {
      if (!creep.isAlive) return;

      const provider = {
        x: creep.position.x,
        z: creep.position.z,
        range: VISION_CONFIG.creepVisionRange,
      };

      if (creep.team === 'radiant') {
        radiantVisionProviders.push(provider);
      } else {
        direVisionProviders.push(provider);
      }
    });

    // Update player visibility
    this.state.players.forEach(player => {
      // Players are always visible to their own team
      if (player.team === 'radiant') {
        player.visibleToRadiant = true;
        player.visibleToDire = this.isVisibleToProviders(
          player.position.x,
          player.position.z,
          direVisionProviders
        );
      } else {
        player.visibleToDire = true;
        player.visibleToRadiant = this.isVisibleToProviders(
          player.position.x,
          player.position.z,
          radiantVisionProviders
        );
      }
    });

    // Update creep visibility
    this.state.creeps.forEach(creep => {
      if (!creep.isAlive) {
        creep.visibleToRadiant = false;
        creep.visibleToDire = false;
        return;
      }

      // Creeps are always visible to their own team
      if (creep.team === 'radiant') {
        creep.visibleToRadiant = true;
        creep.visibleToDire = this.isVisibleToProviders(
          creep.position.x,
          creep.position.z,
          direVisionProviders
        );
      } else {
        creep.visibleToDire = true;
        creep.visibleToRadiant = this.isVisibleToProviders(
          creep.position.x,
          creep.position.z,
          radiantVisionProviders
        );
      }
    });

    // Update jungle monster visibility (neutral - visible if any team can see them)
    this.state.jungleMonsters.forEach(monster => {
      if (!monster.isAlive) {
        monster.visibleToRadiant = false;
        monster.visibleToDire = false;
        return;
      }

      monster.visibleToRadiant = this.isVisibleToProviders(
        monster.position.x,
        monster.position.z,
        radiantVisionProviders
      );
      monster.visibleToDire = this.isVisibleToProviders(
        monster.position.x,
        monster.position.z,
        direVisionProviders
      );
    });
  }

  /**
   * Check if a position is visible to any of the vision providers
   */
  private isVisibleToProviders(
    targetX: number,
    targetZ: number,
    providers: Array<{ x: number; z: number; range: number }>
  ): boolean {
    for (const provider of providers) {
      if (isInVisionRange(provider.x, provider.z, targetX, targetZ, provider.range)) {
        return true;
      }
    }
    return false;
  }

  // ============================================
  // Jungle Camp Logic
  // ============================================

  private updateJungleCamps(deltaTime: number) {
    this.state.jungleCamps.forEach(camp => {
      if (camp.isCleared && camp.respawnTimer > 0) {
        camp.respawnTimer = Math.max(0, camp.respawnTimer - deltaTime);

        // Respawn camp when timer hits 0
        if (camp.respawnTimer <= 0) {
          this.spawnCampMonsters(camp);
          console.log(`Camp ${camp.id} respawned`);
        }
      }
    });
  }

  private updateJungleMonsterAI(monster: JungleMonsterState, deltaTime: number) {
    // Reduce attack cooldown
    if (monster.attackCooldown > 0) {
      monster.attackCooldown = Math.max(0, monster.attackCooldown - deltaTime);
    }

    // Handle resetting (returning to spawn)
    if (monster.isResetting) {
      this.updateMonsterReset(monster, deltaTime);
      return;
    }

    // If we have a target, validate it
    if (monster.targetId) {
      if (!this.isValidMonsterTarget(monster, monster.targetId)) {
        monster.targetId = '';
        monster.isAggro = false;
      }
    }

    // Find target if we don't have one
    if (!monster.targetId) {
      this.findMonsterTarget(monster);
    }

    // If we have a target, attack/chase
    if (monster.targetId) {
      this.updateMonsterCombat(monster, deltaTime);
    }
  }

  private isValidMonsterTarget(monster: JungleMonsterState, targetId: string): boolean {
    const target = this.state.players.get(targetId);
    if (!target || !target.isAlive) return false;

    // Check distance from spawn (leash range)
    const spawnDx = target.position.x - monster.spawnPosition.x;
    const spawnDz = target.position.z - monster.spawnPosition.z;
    const distanceFromSpawn = Math.sqrt(spawnDx * spawnDx + spawnDz * spawnDz);

    if (distanceFromSpawn > JUNGLE_AI_CONFIG.leashRange) {
      // Target too far from spawn, start resetting
      monster.isResetting = true;
      monster.targetId = '';
      monster.isAggro = false;
      return false;
    }

    return true;
  }

  private findMonsterTarget(monster: JungleMonsterState) {
    let nearestPlayerId = '';
    let nearestDistance = Infinity;

    this.state.players.forEach(player => {
      if (!player.isAlive) return;

      const dx = player.position.x - monster.position.x;
      const dz = player.position.z - monster.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= JUNGLE_AI_CONFIG.aggroRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayerId = player.id;
      }
    });

    if (nearestPlayerId) {
      monster.targetId = nearestPlayerId;
      monster.isAggro = true;
    }
  }

  private updateMonsterCombat(monster: JungleMonsterState, deltaTime: number) {
    const target = this.state.players.get(monster.targetId);
    if (!target) {
      monster.targetId = '';
      monster.isAggro = false;
      return;
    }

    const dx = target.position.x - monster.position.x;
    const dz = target.position.z - monster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // If out of attack range, move toward target
    if (distance > monster.attackRange) {
      const dirX = dx / distance;
      const dirZ = dz / distance;

      const moveDistance = monster.moveSpeed * deltaTime;
      monster.position.x += dirX * moveDistance;
      monster.position.z += dirZ * moveDistance;
      monster.rotation = Math.atan2(dirX, dirZ);
      return;
    }

    // In range - attack
    monster.rotation = Math.atan2(dx, dz);

    if (monster.attackCooldown <= 0) {
      this.performMonsterAttack(monster, target);
    }
  }

  private performMonsterAttack(monster: JungleMonsterState, target: GamePlayer) {
    // Check if target is invulnerable
    if (this.hasBuffType(target, 'invulnerable')) return;

    // Calculate damage
    const armorReduction = 100 / (100 + target.armor);
    const damage = Math.floor(monster.attackDamage * armorReduction);

    target.currentHealth = Math.max(0, target.currentHealth - damage);
    monster.attackCooldown = 1 / monster.attackSpeed;

    // Check for kill
    if (target.currentHealth <= 0) {
      target.isAlive = false;
      target.deaths++;
      target.targetId = '';
      target.respawnTime = GAME_CONFIG.respawnTimeBase + (target.level * GAME_CONFIG.respawnTimePerLevel);
      console.log(`${target.displayName} was killed by ${monster.name}`);

      // Monster loses aggro when target dies
      monster.targetId = '';
      monster.isAggro = false;
      monster.isResetting = true;
    }
  }

  private updateMonsterReset(monster: JungleMonsterState, deltaTime: number) {
    const dx = monster.spawnPosition.x - monster.position.x;
    const dz = monster.spawnPosition.z - monster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if back at spawn
    if (distance < 50) {
      monster.isResetting = false;
      monster.currentHealth = monster.maxHealth; // Full heal on reset
      monster.position.x = monster.spawnPosition.x;
      monster.position.z = monster.spawnPosition.z;
      return;
    }

    // Move toward spawn
    const dirX = dx / distance;
    const dirZ = dz / distance;

    const moveDistance = monster.moveSpeed * 1.5 * deltaTime; // Move faster when resetting
    monster.position.x += dirX * moveDistance;
    monster.position.z += dirZ * moveDistance;
    monster.rotation = Math.atan2(dirX, dirZ);
  }

  /**
   * Handle player attacking a jungle monster
   */
  private handleAttackMonster(player: GamePlayer, monsterId: string) {
    const monster = this.state.jungleMonsters.get(monsterId);
    if (!monster || !monster.isAlive) return;

    // Calculate damage
    const armorReduction = 100 / (100 + monster.armor);
    const damage = Math.floor(player.attackDamage * armorReduction);

    monster.currentHealth = Math.max(0, monster.currentHealth - damage);
    player.damageDealt += damage;
    player.attackCooldown = 1 / player.attackSpeed;

    // Monster aggros on attacker if not already aggro'd
    if (!monster.targetId) {
      monster.targetId = player.id;
      monster.isAggro = true;
    }

    // Check for kill
    if (monster.currentHealth <= 0) {
      this.handleMonsterKill(player, monster);
    }
  }

  private handleMonsterKill(killer: GamePlayer, monster: JungleMonsterState) {
    monster.isAlive = false;
    monster.targetId = '';
    monster.isAggro = false;

    // Award gold and experience
    killer.gold += monster.goldReward;
    killer.goldEarned += monster.goldReward;
    this.awardExperience(killer, monster.experienceReward);

    console.log(`${killer.displayName} killed ${monster.name} (+${monster.goldReward} gold, +${monster.experienceReward} exp)`);

    // Check if camp is cleared
    const camp = this.state.jungleCamps.get(monster.campId);
    if (camp) {
      // Check if all monsters in this camp are dead
      let allDead = true;
      this.state.jungleMonsters.forEach(m => {
        if (m.campId === monster.campId && m.isAlive) {
          allDead = false;
        }
      });

      if (allDead) {
        // Get respawn time from camp config
        const campConfig = MAIN_MAP.camps.find(c => c.id === camp.id);
        const respawnTime = campConfig?.respawnTime || 60;

        camp.isCleared = true;
        camp.respawnTimer = respawnTime;
        camp.lastClearedBy = killer.id;

        console.log(`Camp ${camp.id} cleared by ${killer.displayName}, respawning in ${respawnTime}s`);
      }
    }

    // Remove monster after short delay
    setTimeout(() => {
      this.state.jungleMonsters.delete(monster.id);
    }, 1000);
  }

  private updatePlayerRespawn(player: GamePlayer, deltaTime: number) {
    if (player.respawnTime <= 0) return;

    player.respawnTime = Math.max(0, player.respawnTime - deltaTime);

    if (player.respawnTime <= 0) {
      this.respawnPlayer(player);
    }
  }

  private respawnPlayer(player: GamePlayer) {
    const heroData = HEROES[player.heroId];
    if (!heroData) return;

    // Restore health and mana
    player.currentHealth = player.maxHealth;
    player.currentMana = player.maxMana;
    player.isAlive = true;

    // Reset position to spawn
    const spawnPos = this.getSpawnPosition(player.team as 'radiant' | 'dire', 0);
    player.position.x = spawnPos.x;
    player.position.y = spawnPos.y;
    player.position.z = spawnPos.z;
    player.targetPosition.x = spawnPos.x;
    player.targetPosition.y = spawnPos.y;
    player.targetPosition.z = spawnPos.z;

    // Clear combat state
    player.targetId = '';
    player.attackCooldown = 0;
    player.isMoving = false;

    console.log(`${player.displayName} respawned`);
  }

  private calculateKillExperience(victimLevel: number): number {
    // Base experience + bonus per victim level
    return 100 + (victimLevel * 20);
  }

  private awardExperience(player: GamePlayer, amount: number) {
    player.experience += amount;

    // Check for level up
    while (player.level < BALANCE.maxLevel) {
      const requiredExp = BALANCE.experiencePerLevel[player.level];
      if (player.experience >= requiredExp) {
        this.levelUp(player);
      } else {
        break;
      }
    }
  }

  private levelUp(player: GamePlayer) {
    const heroData = HEROES[player.heroId];
    if (!heroData) return;

    player.level++;

    // Apply stat scaling
    const scaling = heroData.scaling;
    player.maxHealth += scaling.healthPerLevel;
    player.maxMana += scaling.manaPerLevel;
    player.attackDamage += scaling.attackDamagePerLevel;
    player.armor += scaling.armorPerLevel;
    player.magicResist += scaling.magicResistPerLevel;

    // Restore health/mana by the amount gained
    player.currentHealth += scaling.healthPerLevel;
    player.currentMana += scaling.manaPerLevel;

    // Cap at max values
    player.currentHealth = Math.min(player.currentHealth, player.maxHealth);
    player.currentMana = Math.min(player.currentMana, player.maxMana);

    console.log(`${player.displayName} leveled up to ${player.level}!`);
  }

  private handleAttack(client: Client, targetId: string) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    if (!player.isAlive) return;

    // Check if target is a player
    const targetPlayer = this.state.players.get(targetId);
    if (targetPlayer && targetPlayer.isAlive && targetPlayer.team !== player.team) {
      player.targetId = targetId;
      return;
    }

    // Check if target is a creep
    const targetCreep = this.state.creeps.get(targetId);
    if (targetCreep && targetCreep.isAlive && targetCreep.team !== player.team) {
      player.targetId = targetId;
      return;
    }

    // Check if target is a tower
    const targetTower = this.state.towers.get(targetId);
    if (targetTower && targetTower.isAlive && targetTower.team !== player.team) {
      player.targetId = targetId;
      return;
    }

    // Check if target is a jungle monster
    const targetMonster = this.state.jungleMonsters.get(targetId);
    if (targetMonster && targetMonster.isAlive) {
      player.targetId = targetId;
      return;
    }
  }

  private handleStop(client: Client) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;

    // Stop moving and attacking
    player.targetId = '';
    player.targetPosition.x = player.position.x;
    player.targetPosition.y = player.position.y;
    player.targetPosition.z = player.position.z;
    player.isMoving = false;
  }

  private updatePlayerAbilityCooldowns(player: GamePlayer, deltaTime: number) {
    player.abilities.forEach(ability => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown = Math.max(0, ability.currentCooldown - deltaTime);
      }
    });
  }

  private handleUseAbility(
    client: Client,
    data: { slot: string; targetId?: string; targetPoint?: { x: number; y: number; z: number } }
  ) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    if (!player.isAlive) return;

    // Find ability by slot
    const slotIndex = ['Q', 'W', 'E', 'R'].indexOf(data.slot.toUpperCase());
    if (slotIndex === -1 || slotIndex >= player.abilities.length) return;

    const abilityState = player.abilities[slotIndex];
    if (!abilityState || abilityState.level === 0) {
      client.send('ability_error', { message: 'Ability not learned' });
      return;
    }

    const abilityDef = ABILITIES[abilityState.abilityId];
    if (!abilityDef) return;

    // Check cooldown
    if (abilityState.currentCooldown > 0) {
      client.send('ability_error', { message: 'Ability on cooldown' });
      return;
    }

    // Check mana cost
    const manaCost = abilityDef.manaCost[abilityState.level - 1] || abilityDef.manaCost[0];
    if (player.currentMana < manaCost) {
      client.send('ability_error', { message: 'Not enough mana' });
      return;
    }

    // Execute ability based on target type
    let success = false;
    switch (abilityDef.targetType) {
      case 'self':
        success = this.executeAbilitySelf(player, abilityDef, abilityState);
        break;
      case 'unit':
        if (data.targetId) {
          // Try to find target as player, creep, or monster
          const targetPlayer = this.state.players.get(data.targetId);
          if (targetPlayer && targetPlayer.isAlive) {
            success = this.executeAbilityUnit(player, targetPlayer, abilityDef, abilityState);
          } else {
            // Try creep
            const targetCreep = this.state.creeps.get(data.targetId);
            if (targetCreep && targetCreep.isAlive) {
              success = this.executeAbilityOnCreep(player, targetCreep, abilityDef, abilityState);
            } else {
              // Try monster
              const targetMonster = this.state.jungleMonsters.get(data.targetId);
              if (targetMonster && targetMonster.isAlive) {
                success = this.executeAbilityOnMonster(player, targetMonster, abilityDef, abilityState);
              }
            }
          }
        }
        break;
      case 'point':
      case 'area':
        if (data.targetPoint) {
          success = this.executeAbilityPoint(player, data.targetPoint, abilityDef, abilityState);
        }
        break;
      case 'direction':
        if (data.targetPoint) {
          success = this.executeAbilityDirection(player, data.targetPoint, abilityDef, abilityState);
        }
        break;
    }

    if (success) {
      // Deduct mana
      player.currentMana -= manaCost;

      // Set cooldown
      const cooldown = abilityDef.cooldown[abilityState.level - 1] || abilityDef.cooldown[0];
      abilityState.currentCooldown = cooldown;

      console.log(`${player.displayName} used ${abilityDef.name}`);
    }
  }

  private executeAbilitySelf(player: GamePlayer, abilityDef: any, _abilityState: AbilityState): boolean {
    // Self-targeted abilities (buffs, shields)
    // For now, just log - implement specific effects later
    console.log(`${player.displayName} activated ${abilityDef.name} on self`);
    return true;
  }

  private executeAbilityUnit(
    caster: GamePlayer,
    target: GamePlayer,
    abilityDef: any,
    abilityState: AbilityState
  ): boolean {
    // Check range
    const dx = target.position.x - caster.position.x;
    const dz = target.position.z - caster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > abilityDef.range) {
      return false;
    }

    // Calculate damage
    if (abilityDef.baseDamage) {
      const baseDamage = abilityDef.baseDamage[abilityState.level - 1] || abilityDef.baseDamage[0];
      let totalDamage = baseDamage;

      // Add scaling
      if (abilityDef.scalingAD) {
        totalDamage += caster.attackDamage * abilityDef.scalingAD;
      }
      if (abilityDef.scalingAP) {
        const heroData = HEROES[caster.heroId];
        if (heroData) {
          totalDamage += heroData.baseStats.spellPower * abilityDef.scalingAP * 100;
        }
      }

      // Apply resistance
      let damageReduction = 1;
      if (abilityDef.damageType === 'physical') {
        damageReduction = 100 / (100 + target.armor);
      } else if (abilityDef.damageType === 'magical') {
        damageReduction = 100 / (100 + target.magicResist);
      }

      const finalDamage = Math.floor(totalDamage * damageReduction);
      target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

      // Track damage dealt
      caster.damageDealt += finalDamage;

      console.log(`${abilityDef.name} dealt ${finalDamage} damage to ${target.displayName}`);

      // Check for kill
      if (target.currentHealth <= 0) {
        this.handleKill(caster, target);
      }
    }

    // Face target
    caster.rotation = Math.atan2(dx, dz);

    return true;
  }

  /**
   * Execute a unit-targeted ability on a creep
   */
  private executeAbilityOnCreep(
    caster: GamePlayer,
    target: CreepState,
    abilityDef: any,
    abilityState: AbilityState
  ): boolean {
    // Check range
    const dx = target.position.x - caster.position.x;
    const dz = target.position.z - caster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > abilityDef.range) {
      return false;
    }

    // Calculate damage
    if (abilityDef.baseDamage) {
      const baseDamage = abilityDef.baseDamage[abilityState.level - 1] || abilityDef.baseDamage[0];
      let totalDamage = baseDamage;

      // Add scaling
      if (abilityDef.scalingAD) {
        totalDamage += caster.attackDamage * abilityDef.scalingAD;
      }
      if (abilityDef.scalingAP) {
        const heroData = HEROES[caster.heroId];
        if (heroData) {
          totalDamage += heroData.baseStats.spellPower * abilityDef.scalingAP * 100;
        }
      }

      // Apply armor reduction (creeps only have armor, no magic resist)
      let damageReduction = 1;
      if (abilityDef.damageType === 'physical') {
        damageReduction = 100 / (100 + target.armor);
      }
      // Magical damage has no reduction on creeps (no magic resist stat)

      const finalDamage = Math.floor(totalDamage * damageReduction);
      target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

      // Track damage dealt
      caster.damageDealt += finalDamage;

      console.log(`${abilityDef.name} dealt ${finalDamage} damage to ${target.type} creep`);

      // Check for kill
      if (target.currentHealth <= 0) {
        this.handleCreepKill(caster, target);
      }
    }

    // Face target
    caster.rotation = Math.atan2(dx, dz);

    return true;
  }

  /**
   * Execute a unit-targeted ability on a jungle monster
   */
  private executeAbilityOnMonster(
    caster: GamePlayer,
    target: JungleMonsterState,
    abilityDef: any,
    abilityState: AbilityState
  ): boolean {
    // Check range
    const dx = target.position.x - caster.position.x;
    const dz = target.position.z - caster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > abilityDef.range) {
      return false;
    }

    // Calculate damage
    if (abilityDef.baseDamage) {
      const baseDamage = abilityDef.baseDamage[abilityState.level - 1] || abilityDef.baseDamage[0];
      let totalDamage = baseDamage;

      // Add scaling
      if (abilityDef.scalingAD) {
        totalDamage += caster.attackDamage * abilityDef.scalingAD;
      }
      if (abilityDef.scalingAP) {
        const heroData = HEROES[caster.heroId];
        if (heroData) {
          totalDamage += heroData.baseStats.spellPower * abilityDef.scalingAP * 100;
        }
      }

      // Apply resistance
      let damageReduction = 1;
      if (abilityDef.damageType === 'physical') {
        damageReduction = 100 / (100 + target.armor);
      } else if (abilityDef.damageType === 'magical') {
        damageReduction = 100 / (100 + target.magicResist);
      }

      const finalDamage = Math.floor(totalDamage * damageReduction);
      target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

      // Track damage dealt
      caster.damageDealt += finalDamage;

      // Trigger aggro on the monster
      if (!target.isAggro && !target.isResetting) {
        target.isAggro = true;
        target.targetId = caster.id;
      }

      console.log(`${abilityDef.name} dealt ${finalDamage} damage to ${target.name}`);

      // Check for kill
      if (target.currentHealth <= 0) {
        this.handleMonsterKill(caster, target);
      }
    }

    // Face target
    caster.rotation = Math.atan2(dx, dz);

    return true;
  }

  private executeAbilityPoint(
    caster: GamePlayer,
    targetPoint: { x: number; y: number; z: number },
    abilityDef: any,
    abilityState: AbilityState
  ): boolean {
    // Check range
    const dx = targetPoint.x - caster.position.x;
    const dz = targetPoint.z - caster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > abilityDef.range) {
      return false;
    }

    // Face target point
    caster.rotation = Math.atan2(dx, dz);

    // AoE damage
    if (abilityDef.baseDamage && abilityDef.radius) {
      const baseDamage = abilityDef.baseDamage[abilityState.level - 1] || abilityDef.baseDamage[0];
      let totalDamage = baseDamage;

      if (abilityDef.scalingAP) {
        const heroData = HEROES[caster.heroId];
        if (heroData) {
          totalDamage += heroData.baseStats.spellPower * abilityDef.scalingAP * 100;
        }
      }
      if (abilityDef.scalingAD) {
        totalDamage += caster.attackDamage * abilityDef.scalingAD;
      }

      // Hit all enemy players in radius
      this.state.players.forEach(target => {
        if (target.team === caster.team || !target.isAlive) return;

        const tdx = target.position.x - targetPoint.x;
        const tdz = target.position.z - targetPoint.z;
        const targetDistance = Math.sqrt(tdx * tdx + tdz * tdz);

        if (targetDistance <= abilityDef.radius) {
          let damageReduction = 1;
          if (abilityDef.damageType === 'magical') {
            damageReduction = 100 / (100 + target.magicResist);
          } else if (abilityDef.damageType === 'physical') {
            damageReduction = 100 / (100 + target.armor);
          }

          const finalDamage = Math.floor(totalDamage * damageReduction);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          // Track damage dealt
          caster.damageDealt += finalDamage;

          console.log(`${abilityDef.name} dealt ${finalDamage} AoE damage to ${target.displayName}`);

          if (target.currentHealth <= 0) {
            this.handleKill(caster, target);
          }
        }
      });

      // Hit all enemy creeps in radius
      this.state.creeps.forEach(target => {
        if (target.team === caster.team || !target.isAlive) return;

        const tdx = target.position.x - targetPoint.x;
        const tdz = target.position.z - targetPoint.z;
        const targetDistance = Math.sqrt(tdx * tdx + tdz * tdz);

        if (targetDistance <= abilityDef.radius) {
          let damageReduction = 1;
          if (abilityDef.damageType === 'physical') {
            damageReduction = 100 / (100 + target.armor);
          }
          // Magical damage has no reduction on creeps

          const finalDamage = Math.floor(totalDamage * damageReduction);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          // Track damage dealt
          caster.damageDealt += finalDamage;

          console.log(`${abilityDef.name} dealt ${finalDamage} AoE damage to ${target.type} creep`);

          if (target.currentHealth <= 0) {
            this.handleCreepKill(caster, target);
          }
        }
      });

      // Hit all jungle monsters in radius (neutral - always targetable)
      this.state.jungleMonsters.forEach(target => {
        if (!target.isAlive) return;

        const tdx = target.position.x - targetPoint.x;
        const tdz = target.position.z - targetPoint.z;
        const targetDistance = Math.sqrt(tdx * tdx + tdz * tdz);

        if (targetDistance <= abilityDef.radius) {
          let damageReduction = 1;
          if (abilityDef.damageType === 'physical') {
            damageReduction = 100 / (100 + target.armor);
          } else if (abilityDef.damageType === 'magical') {
            damageReduction = 100 / (100 + target.magicResist);
          }

          const finalDamage = Math.floor(totalDamage * damageReduction);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          // Track damage dealt
          caster.damageDealt += finalDamage;

          // Trigger aggro
          if (!target.isAggro && !target.isResetting) {
            target.isAggro = true;
            target.targetId = caster.id;
          }

          console.log(`${abilityDef.name} dealt ${finalDamage} AoE damage to ${target.name}`);

          if (target.currentHealth <= 0) {
            this.handleMonsterKill(caster, target);
          }
        }
      });
    }

    return true;
  }

  private executeAbilityDirection(
    caster: GamePlayer,
    targetPoint: { x: number; y: number; z: number },
    abilityDef: any,
    abilityState: AbilityState
  ): boolean {
    // Calculate direction
    const dx = targetPoint.x - caster.position.x;
    const dz = targetPoint.z - caster.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) return false;

    const dirX = dx / distance;
    const dirZ = dz / distance;

    // Face direction
    caster.rotation = Math.atan2(dirX, dirZ);

    // Move in direction (dash)
    const dashDistance = Math.min(abilityDef.range, distance);
    const newX = caster.position.x + dirX * dashDistance;
    const newZ = caster.position.z + dirZ * dashDistance;

    // Clamp to map
    const halfMap = BALANCE.mapWidth / 2;
    caster.position.x = Math.max(-halfMap, Math.min(halfMap, newX));
    caster.position.z = Math.max(-halfMap, Math.min(halfMap, newZ));
    caster.targetPosition.x = caster.position.x;
    caster.targetPosition.z = caster.position.z;

    // Deal damage to enemies in path
    if (abilityDef.baseDamage) {
      const baseDamage = abilityDef.baseDamage[abilityState.level - 1] || abilityDef.baseDamage[0];
      let totalDamage = baseDamage;

      if (abilityDef.scalingAD) {
        totalDamage += caster.attackDamage * abilityDef.scalingAD;
      }
      if (abilityDef.scalingAP) {
        const heroData = HEROES[caster.heroId];
        if (heroData) {
          totalDamage += heroData.baseStats.spellPower * abilityDef.scalingAP * 100;
        }
      }

      const hitRadius = 200; // Hit radius for dash abilities

      // Hit enemy players
      this.state.players.forEach(target => {
        if (target.team === caster.team || !target.isAlive) return;

        // Simple collision check - within dash path
        const tdx = target.position.x - caster.position.x;
        const tdz = target.position.z - caster.position.z;
        const targetDistance = Math.sqrt(tdx * tdx + tdz * tdz);

        if (targetDistance <= hitRadius) {
          let damageReduction = 1;
          if (abilityDef.damageType === 'physical') {
            damageReduction = 100 / (100 + target.armor);
          } else if (abilityDef.damageType === 'magical') {
            damageReduction = 100 / (100 + target.magicResist);
          }

          const finalDamage = Math.floor(totalDamage * damageReduction);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          // Track damage dealt
          caster.damageDealt += finalDamage;

          console.log(`${abilityDef.name} dealt ${finalDamage} damage to ${target.displayName}`);

          if (target.currentHealth <= 0) {
            this.handleKill(caster, target);
          }
        }
      });

      // Hit enemy creeps
      this.state.creeps.forEach(target => {
        if (target.team === caster.team || !target.isAlive) return;

        const tdx = target.position.x - caster.position.x;
        const tdz = target.position.z - caster.position.z;
        const targetDistance = Math.sqrt(tdx * tdx + tdz * tdz);

        if (targetDistance <= hitRadius) {
          let damageReduction = 1;
          if (abilityDef.damageType === 'physical') {
            damageReduction = 100 / (100 + target.armor);
          }

          const finalDamage = Math.floor(totalDamage * damageReduction);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          caster.damageDealt += finalDamage;

          console.log(`${abilityDef.name} dealt ${finalDamage} damage to ${target.type} creep`);

          if (target.currentHealth <= 0) {
            this.handleCreepKill(caster, target);
          }
        }
      });

      // Hit jungle monsters
      this.state.jungleMonsters.forEach(target => {
        if (!target.isAlive) return;

        const tdx = target.position.x - caster.position.x;
        const tdz = target.position.z - caster.position.z;
        const targetDistance = Math.sqrt(tdx * tdx + tdz * tdz);

        if (targetDistance <= hitRadius) {
          let damageReduction = 1;
          if (abilityDef.damageType === 'physical') {
            damageReduction = 100 / (100 + target.armor);
          } else if (abilityDef.damageType === 'magical') {
            damageReduction = 100 / (100 + target.magicResist);
          }

          const finalDamage = Math.floor(totalDamage * damageReduction);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          caster.damageDealt += finalDamage;

          // Trigger aggro
          if (!target.isAggro && !target.isResetting) {
            target.isAggro = true;
            target.targetId = caster.id;
          }

          console.log(`${abilityDef.name} dealt ${finalDamage} damage to ${target.name}`);

          if (target.currentHealth <= 0) {
            this.handleMonsterKill(caster, target);
          }
        }
      });
    }

    return true;
  }

  private handleChat(client: Client, data: { content: string; teamOnly: boolean }) {
    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const content = data.content.trim().slice(0, 500);
    if (!content) return;

    const message = new GameChatMessage();
    message.id = uuidv4();
    message.senderId = userData.userId;
    message.senderName = userData.player.displayName;
    message.senderTeam = userData.player.team; // Add sender's team for filtering
    message.content = content;
    message.timestamp = Date.now();
    message.teamOnly = data.teamOnly;

    this.state.messages.push(message);

    // Keep only last 50 messages
    while (this.state.messages.length > 50) {
      this.state.messages.shift();
    }
  }

  private handlePing(client: Client, data: { type: string; position: { x: number; y: number; z: number } }) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const validTypes = ['alert', 'danger', 'missing', 'on_my_way', 'attack', 'defend'];
    const pingType = validTypes.includes(data.type) ? data.type : 'alert';

    const ping = new MapPing();
    ping.id = uuidv4();
    ping.senderId = userData.userId;
    ping.senderName = userData.player.displayName;
    ping.team = userData.player.team;
    ping.type = pingType;
    ping.position.x = data.position.x;
    ping.position.y = data.position.y;
    ping.position.z = data.position.z;
    ping.timestamp = Date.now();
    ping.expiresAt = Date.now() + 3000; // 3 seconds

    this.state.pings.push(ping);

    // Remove expired pings
    const now = Date.now();
    for (let i = this.state.pings.length - 1; i >= 0; i--) {
      const p = this.state.pings[i];
      if (p && p.expiresAt < now) {
        this.state.pings.splice(i, 1);
      }
    }

    // Keep only last 10 pings
    while (this.state.pings.length > 10) {
      this.state.pings.shift();
    }
  }

  private handleMove(client: Client, target: { x: number; y: number; z: number }) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    if (!player.isAlive) return;

    // Clamp target position to map boundaries
    const halfMapWidth = BALANCE.mapWidth / 2;
    const halfMapHeight = BALANCE.mapHeight / 2;

    const targetX = Math.max(-halfMapWidth, Math.min(halfMapWidth, target.x));
    const targetZ = Math.max(-halfMapHeight, Math.min(halfMapHeight, target.z));

    const playerPos: Point2D = { x: player.position.x, z: player.position.z };
    const targetPos: Point2D = { x: targetX, z: targetZ };
    const playerRadius = 50;

    // Check if we have direct line of sight to target
    if (hasLineOfSight(playerPos, targetPos, playerRadius)) {
      // Direct path - no pathfinding needed
      this.playerPaths.delete(player.id);
      player.targetPosition.x = targetX;
      player.targetPosition.y = target.y;
      player.targetPosition.z = targetZ;
    } else {
      // Need to find a path around obstacles
      const path = findPath(playerPos, targetPos);
      if (path && path.length > 0) {
        // Simplify path to reduce waypoints
        const simplifiedPath = simplifyPath(path, playerRadius);
        this.playerPaths.set(player.id, simplifiedPath);

        // Set first waypoint as immediate target
        player.targetPosition.x = simplifiedPath[0].x;
        player.targetPosition.y = target.y;
        player.targetPosition.z = simplifiedPath[0].z;
      } else {
        // No path found, try to move as close as possible
        this.playerPaths.delete(player.id);
        player.targetPosition.x = targetX;
        player.targetPosition.y = target.y;
        player.targetPosition.z = targetZ;
      }
    }
  }

  private handleBuyItem(client: Client, itemId: string) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;
    const item = ITEMS[itemId];

    if (!item) {
      client.send('shop_error', { message: 'Item not found' });
      return;
    }

    // Check if player has enough gold
    if (player.gold < item.cost) {
      client.send('shop_error', { message: 'Not enough gold' });
      return;
    }

    // Check if player has inventory space
    const MAX_INVENTORY_SLOTS = 6;

    // For stackable items, check if we can stack
    if (item.maxStack > 1) {
      const existingItem = player.inventory.find(
        inv => inv.itemId === itemId && inv.stackCount < item.maxStack
      );
      if (existingItem) {
        // Stack on existing
        existingItem.stackCount++;
        player.gold -= item.cost;
        this.applyItemStats(player, item);
        client.send('item_bought', { itemId, slot: existingItem.slot });
        return;
      }
    }

    // Check for available slot
    if (player.inventory.length >= MAX_INVENTORY_SLOTS) {
      client.send('shop_error', { message: 'Inventory full' });
      return;
    }

    // Check if we can combine with existing components
    if (item.buildsFrom && item.buildsFrom.length > 0) {
      const ownedComponents: number[] = [];
      let componentValue = 0;

      for (const componentId of item.buildsFrom) {
        const componentIdx = player.inventory.findIndex(
          inv => inv.itemId === componentId && !ownedComponents.includes(player.inventory.indexOf(inv))
        );
        if (componentIdx !== -1) {
          ownedComponents.push(componentIdx);
          const component = ITEMS[componentId];
          if (component) {
            componentValue += component.cost;
          }
        }
      }

      // Calculate effective cost
      const effectiveCost = item.cost - componentValue;

      if (player.gold < effectiveCost) {
        client.send('shop_error', { message: 'Not enough gold' });
        return;
      }

      // Remove components (in reverse order to avoid index issues)
      ownedComponents.sort((a, b) => b - a);
      for (const idx of ownedComponents) {
        const componentItem = player.inventory[idx];
        if (componentItem) {
          this.removeItemStats(player, ITEMS[componentItem.itemId]);
        }
        player.inventory.splice(idx, 1);
      }

      player.gold -= effectiveCost;
    } else {
      player.gold -= item.cost;
    }

    // Find first available slot
    const usedSlots = new Set(player.inventory.map(inv => inv.slot));
    let newSlot = 0;
    while (usedSlots.has(newSlot)) newSlot++;

    // Add item to inventory
    const invItem = new InventoryItem();
    invItem.itemId = itemId;
    invItem.slot = newSlot;
    invItem.stackCount = 1;
    player.inventory.push(invItem);

    // Apply item stats
    this.applyItemStats(player, item);

    client.send('item_bought', { itemId, slot: newSlot });
  }

  private handleSellItem(client: Client, slot: number) {
    if (this.state.phase !== 'playing') return;

    const userData = client.userData as { userId: string; player: GamePlayer } | undefined;
    if (!userData) return;

    const player = userData.player;

    const invIdx = player.inventory.findIndex(inv => inv.slot === slot);
    if (invIdx === -1) {
      client.send('shop_error', { message: 'No item in that slot' });
      return;
    }

    const invItem = player.inventory[invIdx];
    if (!invItem) {
      client.send('shop_error', { message: 'Item not found' });
      return;
    }

    const itemId = invItem.itemId;
    const item = ITEMS[itemId];
    if (!item) {
      player.inventory.splice(invIdx, 1);
      return;
    }

    // Sell for 70% of cost
    const sellValue = item.sellValue;
    player.gold += sellValue;

    // Remove item stats
    this.removeItemStats(player, item);

    // Remove from inventory
    player.inventory.splice(invIdx, 1);

    client.send('item_sold', { itemId, slot, gold: sellValue });
  }

  private applyItemStats(player: GamePlayer, item: Item) {
    const stats = item.stats;
    if (stats.health) {
      player.maxHealth += stats.health;
      player.currentHealth = Math.min(player.currentHealth + stats.health, player.maxHealth);
    }
    if (stats.mana) {
      player.maxMana += stats.mana;
      player.currentMana = Math.min(player.currentMana + stats.mana, player.maxMana);
    }
    if (stats.attackDamage) player.attackDamage += stats.attackDamage;
    if (stats.armor) player.armor += stats.armor;
    if (stats.magicResist) player.magicResist += stats.magicResist;
    if (stats.attackSpeed) player.attackSpeed += stats.attackSpeed;
    if (stats.moveSpeed) player.moveSpeed += stats.moveSpeed;
  }

  private removeItemStats(player: GamePlayer, item: Item) {
    const stats = item.stats;
    if (stats.health) {
      player.maxHealth -= stats.health;
      player.currentHealth = Math.min(player.currentHealth, player.maxHealth);
    }
    if (stats.mana) {
      player.maxMana -= stats.mana;
      player.currentMana = Math.min(player.currentMana, player.maxMana);
    }
    if (stats.attackDamage) player.attackDamage -= stats.attackDamage;
    if (stats.armor) player.armor -= stats.armor;
    if (stats.magicResist) player.magicResist -= stats.magicResist;
    if (stats.attackSpeed) player.attackSpeed -= stats.attackSpeed;
    if (stats.moveSpeed) player.moveSpeed -= stats.moveSpeed;
  }
}
