import { create } from 'zustand';
import { colyseusService } from '../services/colyseus';
import { useAuthStore } from './authStore';

export type GamePhase = 'waiting' | 'hero_select' | 'loading' | 'playing' | 'paused' | 'ended';

export interface AbilityState {
  abilityId: string;
  level: number;
  currentCooldown: number;
  isActive: boolean;
}

export interface InventoryItem {
  itemId: string;
  slot: number;
  stackCount: number;
}

export interface BuffState {
  id: string;
  buffId: string;
  type: string;
  sourceId: string;
  remainingDuration: number;
  value: number;
  stacks: number;
}

export interface TowerState {
  id: string;
  team: 'radiant' | 'dire';
  lane: string;
  tier: number;
  position: { x: number; y: number; z: number };
  currentHealth: number;
  maxHealth: number;
  armor: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  attackCooldown: number;
  isAlive: boolean;
  targetId: string;
  isUnderAttack: boolean;
}

export interface CreepState {
  id: string;
  team: 'radiant' | 'dire';
  type: 'melee' | 'ranged' | 'siege';
  lane: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  targetPosition: { x: number; y: number; z: number };
  currentHealth: number;
  maxHealth: number;
  attackDamage: number;
  attackSpeed: number;
  attackRange: number;
  moveSpeed: number;
  armor: number;
  attackCooldown: number;
  goldReward: number;
  experienceReward: number;
  isAlive: boolean;
  targetId: string;
  targetType: string;
  isMoving: boolean;
  waypointIndex: number;
  // Vision / Fog of War
  visibleToRadiant: boolean;
  visibleToDire: boolean;
}

export interface JungleCampState {
  id: string;
  difficulty: string;
  team: string;
  position: { x: number; y: number; z: number };
  isCleared: boolean;
  respawnTimer: number;
  lastClearedBy: string;
}

export interface JungleMonsterState {
  id: string;
  campId: string;
  monsterType: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  spawnPosition: { x: number; y: number; z: number };
  currentHealth: number;
  maxHealth: number;
  attackDamage: number;
  attackSpeed: number;
  attackRange: number;
  moveSpeed: number;
  armor: number;
  magicResist: number;
  attackCooldown: number;
  goldReward: number;
  experienceReward: number;
  isAlive: boolean;
  targetId: string;
  isAggro: boolean;
  isResetting: boolean;
  // Vision / Fog of War
  visibleToRadiant: boolean;
  visibleToDire: boolean;
}

export interface GamePlayer {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  team: 'radiant' | 'dire';
  isBot: boolean;
  isConnected: boolean;
  isReady: boolean;
  selectedHeroId: string;
  lockedHeroId: string;
  heroId: string;
  level: number;
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
  position: { x: number; y: number; z: number };
  rotation: number;
  targetPosition: { x: number; y: number; z: number };
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  gold: number;
  experience: number;
  damageDealt: number;
  goldEarned: number;
  isAlive: boolean;
  respawnTime: number;
  moveSpeed: number;
  isMoving: boolean;
  attackDamage: number;
  attackSpeed: number;
  attackRange: number;
  armor: number;
  magicResist: number;
  attackCooldown: number;
  targetId: string;
  abilities: AbilityState[];
  inventory: InventoryItem[];
  buffs: BuffState[];
  // Vision / Fog of War
  visionRange: number;
  visibleToRadiant: boolean;
  visibleToDire: boolean;
}

export interface GameChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderTeam: 'radiant' | 'dire';
  content: string;
  timestamp: number;
  teamOnly: boolean;
}

export type PingType = 'alert' | 'danger' | 'missing' | 'on_my_way' | 'attack' | 'defend';

export interface MapPing {
  id: string;
  senderId: string;
  senderName: string;
  team: 'radiant' | 'dire';
  type: PingType;
  position: { x: number; y: number; z: number };
  timestamp: number;
  expiresAt: number;
}

interface MatchFoundData {
  matchId: string;
  roomId: string;
  team: 'radiant' | 'dire';
}

export interface GameEndPlayerStats {
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
}

export interface GameEndData {
  winner: 'radiant' | 'dire';
  radiantScore: number;
  direScore: number;
  gameTime: number;
  playerStats: GameEndPlayerStats[];
}

interface GameState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  matchId: string;
  roomId: string;
  myTeam: 'radiant' | 'dire';
  phase: GamePhase;
  gameTime: number;
  heroSelectTimer: number;

  radiantScore: number;
  direScore: number;
  winner: string;

  players: Map<string, GamePlayer>;
  towers: Map<string, TowerState>;
  creeps: Map<string, CreepState>;
  jungleCamps: Map<string, JungleCampState>;
  jungleMonsters: Map<string, JungleMonsterState>;
  messages: GameChatMessage[];
  pings: MapPing[];

  isPaused: boolean;
  pauseTimeRemaining: number;

  // Game end data
  gameEndData: GameEndData | null;

  // Target selection
  selectedTargetId: string | null;

  // Ability hover state for range indicator
  hoveredAbilityId: string | null;
  hoveredAbilityRange: number | null;

  // Actions
  setSelectedTarget: (targetId: string | null) => void;
  setHoveredAbility: (abilityId: string | null, range: number | null) => void;
  setMatchFound: (data: MatchFoundData) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  selectHero: (heroId: string) => void;
  lockHero: () => void;
  sendChat: (content: string, teamOnly: boolean) => void;
  sendPing: (type: PingType, position: { x: number; y: number; z: number }) => void;
  move: (target: { x: number; y: number; z: number }) => void;
  attack: (targetId: string) => void;
  stop: () => void;
  useAbility: (slot: string, targetId?: string, targetPoint?: { x: number; y: number; z: number }) => void;
  buyItem: (itemId: string) => void;
  sellItem: (slot: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,

  matchId: '',
  roomId: '',
  myTeam: 'radiant',
  phase: 'waiting',
  gameTime: 0,
  heroSelectTimer: 60,

  radiantScore: 0,
  direScore: 0,
  winner: '',

  players: new Map(),
  towers: new Map(),
  creeps: new Map(),
  jungleCamps: new Map(),
  jungleMonsters: new Map(),
  messages: [],
  pings: [],

  isPaused: false,
  pauseTimeRemaining: 0,

  gameEndData: null,

  selectedTargetId: null,

  hoveredAbilityId: null,
  hoveredAbilityRange: null,

  setSelectedTarget: (targetId: string | null) => {
    set({ selectedTargetId: targetId });
  },

  setHoveredAbility: (abilityId: string | null, range: number | null) => {
    set({ hoveredAbilityId: abilityId, hoveredAbilityRange: range });
  },

  setMatchFound: (data: MatchFoundData) => {
    set({
      matchId: data.matchId,
      roomId: data.roomId,
      myTeam: data.team,
    });
  },

  connect: async () => {
    const { roomId, matchId } = get();
    if (!roomId || !matchId) {
      set({ error: 'No match to connect to' });
      return;
    }

    if (get().isConnected || get().isConnecting) return;

    set({ isConnecting: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const room = await colyseusService.joinGame(roomId, matchId, token);

      // Listen for state changes
      room.state.listen('phase', (value: string) => {
        set({ phase: value as GamePhase });
      });

      room.state.listen('gameTime', (value: number) => {
        set({ gameTime: value });
      });

      room.state.listen('heroSelectTimer', (value: number) => {
        set({ heroSelectTimer: value });
      });

      room.state.listen('radiantScore', (value: number) => {
        set({ radiantScore: value });
      });

      room.state.listen('direScore', (value: number) => {
        set({ direScore: value });
      });

      room.state.listen('winner', (value: string) => {
        set({ winner: value });
      });

      room.state.listen('isPaused', (value: boolean) => {
        set({ isPaused: value });
      });

      room.state.listen('pauseTimeRemaining', (value: number) => {
        set({ pauseTimeRemaining: value });
      });

      // Listen for player changes
      room.state.players.onAdd((player: any, key: string) => {
        const players = new Map(get().players);
        players.set(key, createPlayerFromSchema(player));
        set({ players });

        // Listen for player property changes
        player.onChange(() => {
          const players = new Map(get().players);
          players.set(key, createPlayerFromSchema(player));
          set({ players });
        });

        // Listen for position changes
        player.position?.onChange(() => {
          const players = new Map(get().players);
          players.set(key, createPlayerFromSchema(player));
          set({ players });
        });

        player.targetPosition?.onChange(() => {
          const players = new Map(get().players);
          players.set(key, createPlayerFromSchema(player));
          set({ players });
        });
      });

      room.state.players.onRemove((_player: any, key: string) => {
        const players = new Map(get().players);
        players.delete(key);
        set({ players });
      });

      // Listen for tower changes
      room.state.towers.onAdd((tower: any, key: string) => {
        const towers = new Map(get().towers);
        towers.set(key, createTowerFromSchema(tower));
        set({ towers });

        // Listen for tower property changes
        tower.onChange(() => {
          const towers = new Map(get().towers);
          towers.set(key, createTowerFromSchema(tower));
          set({ towers });
        });

        // Listen for position changes
        tower.position?.onChange(() => {
          const towers = new Map(get().towers);
          towers.set(key, createTowerFromSchema(tower));
          set({ towers });
        });
      });

      room.state.towers.onRemove((_tower: any, key: string) => {
        const towers = new Map(get().towers);
        towers.delete(key);
        set({ towers });
      });

      // Listen for creep changes
      room.state.creeps.onAdd((creep: any, key: string) => {
        const creeps = new Map(get().creeps);
        creeps.set(key, createCreepFromSchema(creep));
        set({ creeps });

        // Listen for creep property changes
        creep.onChange(() => {
          const creeps = new Map(get().creeps);
          creeps.set(key, createCreepFromSchema(creep));
          set({ creeps });
        });

        // Listen for position changes
        creep.position?.onChange(() => {
          const creeps = new Map(get().creeps);
          creeps.set(key, createCreepFromSchema(creep));
          set({ creeps });
        });

        creep.targetPosition?.onChange(() => {
          const creeps = new Map(get().creeps);
          creeps.set(key, createCreepFromSchema(creep));
          set({ creeps });
        });
      });

      room.state.creeps.onRemove((_creep: any, key: string) => {
        const creeps = new Map(get().creeps);
        creeps.delete(key);
        set({ creeps });
      });

      // Listen for jungle camp changes
      room.state.jungleCamps.onAdd((camp: any, key: string) => {
        const jungleCamps = new Map(get().jungleCamps);
        jungleCamps.set(key, createJungleCampFromSchema(camp));
        set({ jungleCamps });

        camp.onChange(() => {
          const jungleCamps = new Map(get().jungleCamps);
          jungleCamps.set(key, createJungleCampFromSchema(camp));
          set({ jungleCamps });
        });

        camp.position?.onChange(() => {
          const jungleCamps = new Map(get().jungleCamps);
          jungleCamps.set(key, createJungleCampFromSchema(camp));
          set({ jungleCamps });
        });
      });

      room.state.jungleCamps.onRemove((_camp: any, key: string) => {
        const jungleCamps = new Map(get().jungleCamps);
        jungleCamps.delete(key);
        set({ jungleCamps });
      });

      // Listen for jungle monster changes
      room.state.jungleMonsters.onAdd((monster: any, key: string) => {
        const jungleMonsters = new Map(get().jungleMonsters);
        jungleMonsters.set(key, createJungleMonsterFromSchema(monster));
        set({ jungleMonsters });

        monster.onChange(() => {
          const jungleMonsters = new Map(get().jungleMonsters);
          jungleMonsters.set(key, createJungleMonsterFromSchema(monster));
          set({ jungleMonsters });
        });

        monster.position?.onChange(() => {
          const jungleMonsters = new Map(get().jungleMonsters);
          jungleMonsters.set(key, createJungleMonsterFromSchema(monster));
          set({ jungleMonsters });
        });

        monster.spawnPosition?.onChange(() => {
          const jungleMonsters = new Map(get().jungleMonsters);
          jungleMonsters.set(key, createJungleMonsterFromSchema(monster));
          set({ jungleMonsters });
        });
      });

      room.state.jungleMonsters.onRemove((_monster: any, key: string) => {
        const jungleMonsters = new Map(get().jungleMonsters);
        jungleMonsters.delete(key);
        set({ jungleMonsters });
      });

      // Listen for messages
      room.state.messages.onAdd((message: any) => {
        const messages = [...get().messages];
        messages.push({
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName,
          senderTeam: message.senderTeam,
          content: message.content,
          timestamp: message.timestamp,
          teamOnly: message.teamOnly,
        });
        if (messages.length > 50) {
          messages.shift();
        }
        set({ messages });
      });

      // Listen for pings
      room.state.pings.onAdd((ping: any) => {
        const pings = [...get().pings];
        pings.push({
          id: ping.id,
          senderId: ping.senderId,
          senderName: ping.senderName,
          team: ping.team,
          type: ping.type,
          position: {
            x: ping.position?.x || 0,
            y: ping.position?.y || 0,
            z: ping.position?.z || 0,
          },
          timestamp: ping.timestamp,
          expiresAt: ping.expiresAt,
        });
        // Keep only last 10 pings
        while (pings.length > 10) {
          pings.shift();
        }
        set({ pings });
      });

      room.state.pings.onRemove((ping: any) => {
        const pings = get().pings.filter(p => p.id !== ping.id);
        set({ pings });
      });

      // Listen for game events
      room.onMessage('hero_unavailable', (data: { heroId: string }) => {
        console.log('Hero unavailable:', data.heroId);
      });

      room.onMessage('game_start', (data: { matchId: string }) => {
        console.log('Game starting:', data.matchId);
      });

      room.onMessage('game_end', (data: GameEndData) => {
        console.log('Game ended:', data);
        set({ gameEndData: data });
      });

      room.onMessage('player_disconnected', (data: { oddsUserId: string; oddsDisplayName: string; reconnectTimeout: number }) => {
        console.log('Player disconnected:', data);
        // Could show a notification here
      });

      room.onMessage('player_abandoned', (data: { oddsUserId: string; oddsDisplayName: string }) => {
        console.log('Player abandoned:', data);
        // Could show a notification here
      });

      // Handle disconnection
      room.onLeave(() => {
        set({
          isConnected: false,
          players: new Map(),
          towers: new Map(),
          creeps: new Map(),
          jungleCamps: new Map(),
          jungleMonsters: new Map(),
          messages: [],
          pings: [],
          phase: 'waiting',
          selectedTargetId: null,
        });
      });

      set({ isConnected: true, isConnecting: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      set({ isConnecting: false, error: message });
    }
  },

  disconnect: async () => {
    await colyseusService.leaveGame();
    set({
      isConnected: false,
      matchId: '',
      roomId: '',
      players: new Map(),
      towers: new Map(),
      creeps: new Map(),
      jungleCamps: new Map(),
      jungleMonsters: new Map(),
      messages: [],
      pings: [],
      phase: 'waiting',
      gameEndData: null,
      selectedTargetId: null,
    });
  },

  selectHero: (heroId: string) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('select_hero', heroId);
    }
  },

  lockHero: () => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('lock_hero');
    }
  },

  sendChat: (content: string, teamOnly: boolean) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('chat', { content, teamOnly });
    }
  },

  sendPing: (type: PingType, position: { x: number; y: number; z: number }) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('ping', { type, position });
    }
  },

  move: (target: { x: number; y: number; z: number }) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('move', target);
    }
  },

  attack: (targetId: string) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('attack', targetId);
    }
  },

  stop: () => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('stop');
    }
  },

  useAbility: (slot: string, targetId?: string, targetPoint?: { x: number; y: number; z: number }) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('use_ability', { slot, targetId, targetPoint });
    }
  },

  buyItem: (itemId: string) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('buy_item', itemId);
    }
  },

  sellItem: (slot: number) => {
    const room = colyseusService.getGameRoom();
    if (room) {
      room.send('sell_item', slot);
    }
  },
}));

function createPlayerFromSchema(player: any): GamePlayer {
  // Convert abilities ArraySchema to plain array
  const abilities: AbilityState[] = [];
  if (player.abilities) {
    player.abilities.forEach((ability: any) => {
      abilities.push({
        abilityId: ability.abilityId,
        level: ability.level,
        currentCooldown: ability.currentCooldown,
        isActive: ability.isActive,
      });
    });
  }

  // Convert inventory ArraySchema to plain array
  const inventory: InventoryItem[] = [];
  if (player.inventory) {
    player.inventory.forEach((item: any) => {
      inventory.push({
        itemId: item.itemId,
        slot: item.slot,
        stackCount: item.stackCount,
      });
    });
  }

  // Convert buffs ArraySchema to plain array
  const buffs: BuffState[] = [];
  if (player.buffs) {
    player.buffs.forEach((buff: any) => {
      buffs.push({
        id: buff.id,
        buffId: buff.buffId,
        type: buff.type,
        sourceId: buff.sourceId,
        remainingDuration: buff.remainingDuration,
        value: buff.value,
        stacks: buff.stacks,
      });
    });
  }

  return {
    id: player.id,
    userId: player.userId,
    username: player.username,
    displayName: player.displayName,
    team: player.team as 'radiant' | 'dire',
    isBot: player.isBot,
    isConnected: player.isConnected,
    isReady: player.isReady,
    selectedHeroId: player.selectedHeroId,
    lockedHeroId: player.lockedHeroId,
    heroId: player.heroId,
    level: player.level,
    currentHealth: player.currentHealth,
    maxHealth: player.maxHealth,
    currentMana: player.currentMana,
    maxMana: player.maxMana,
    position: {
      x: player.position?.x || 0,
      y: player.position?.y || 0,
      z: player.position?.z || 0,
    },
    rotation: player.rotation,
    targetPosition: {
      x: player.targetPosition?.x || 0,
      y: player.targetPosition?.y || 0,
      z: player.targetPosition?.z || 0,
    },
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    creepScore: player.creepScore,
    gold: player.gold,
    experience: player.experience,
    damageDealt: player.damageDealt || 0,
    goldEarned: player.goldEarned || 0,
    isAlive: player.isAlive,
    respawnTime: player.respawnTime,
    moveSpeed: player.moveSpeed || 0,
    isMoving: player.isMoving || false,
    attackDamage: player.attackDamage || 0,
    attackSpeed: player.attackSpeed || 0,
    attackRange: player.attackRange || 0,
    armor: player.armor || 0,
    magicResist: player.magicResist || 0,
    attackCooldown: player.attackCooldown || 0,
    targetId: player.targetId || '',
    abilities,
    inventory,
    buffs,
    // Vision / Fog of War
    visionRange: player.visionRange || 1800,
    visibleToRadiant: player.visibleToRadiant !== undefined ? player.visibleToRadiant : true,
    visibleToDire: player.visibleToDire !== undefined ? player.visibleToDire : true,
  };
}

function createTowerFromSchema(tower: any): TowerState {
  return {
    id: tower.id,
    team: tower.team as 'radiant' | 'dire',
    lane: tower.lane,
    tier: tower.tier,
    position: {
      x: tower.position?.x || 0,
      y: tower.position?.y || 0,
      z: tower.position?.z || 0,
    },
    currentHealth: tower.currentHealth,
    maxHealth: tower.maxHealth,
    armor: tower.armor || 0,
    attackDamage: tower.attackDamage || 0,
    attackRange: tower.attackRange || 0,
    attackSpeed: tower.attackSpeed || 0,
    attackCooldown: tower.attackCooldown || 0,
    isAlive: tower.isAlive,
    targetId: tower.targetId || '',
    isUnderAttack: tower.isUnderAttack || false,
  };
}

function createCreepFromSchema(creep: any): CreepState {
  return {
    id: creep.id,
    team: creep.team as 'radiant' | 'dire',
    type: creep.type as 'melee' | 'ranged' | 'siege',
    lane: creep.lane,
    position: {
      x: creep.position?.x || 0,
      y: creep.position?.y || 0,
      z: creep.position?.z || 0,
    },
    rotation: creep.rotation || 0,
    targetPosition: {
      x: creep.targetPosition?.x || 0,
      y: creep.targetPosition?.y || 0,
      z: creep.targetPosition?.z || 0,
    },
    currentHealth: creep.currentHealth,
    maxHealth: creep.maxHealth,
    attackDamage: creep.attackDamage || 0,
    attackSpeed: creep.attackSpeed || 0,
    attackRange: creep.attackRange || 0,
    moveSpeed: creep.moveSpeed || 0,
    armor: creep.armor || 0,
    attackCooldown: creep.attackCooldown || 0,
    goldReward: creep.goldReward || 0,
    experienceReward: creep.experienceReward || 0,
    isAlive: creep.isAlive,
    targetId: creep.targetId || '',
    targetType: creep.targetType || '',
    isMoving: creep.isMoving || false,
    waypointIndex: creep.waypointIndex || 0,
    // Vision / Fog of War
    visibleToRadiant: creep.visibleToRadiant !== undefined ? creep.visibleToRadiant : true,
    visibleToDire: creep.visibleToDire !== undefined ? creep.visibleToDire : true,
  };
}

function createJungleCampFromSchema(camp: any): JungleCampState {
  return {
    id: camp.id,
    difficulty: camp.difficulty,
    team: camp.team,
    position: {
      x: camp.position?.x || 0,
      y: camp.position?.y || 0,
      z: camp.position?.z || 0,
    },
    isCleared: camp.isCleared || false,
    respawnTimer: camp.respawnTimer || 0,
    lastClearedBy: camp.lastClearedBy || '',
  };
}

function createJungleMonsterFromSchema(monster: any): JungleMonsterState {
  return {
    id: monster.id,
    campId: monster.campId,
    monsterType: monster.monsterType,
    name: monster.name,
    position: {
      x: monster.position?.x || 0,
      y: monster.position?.y || 0,
      z: monster.position?.z || 0,
    },
    rotation: monster.rotation || 0,
    spawnPosition: {
      x: monster.spawnPosition?.x || 0,
      y: monster.spawnPosition?.y || 0,
      z: monster.spawnPosition?.z || 0,
    },
    currentHealth: monster.currentHealth,
    maxHealth: monster.maxHealth,
    attackDamage: monster.attackDamage || 0,
    attackSpeed: monster.attackSpeed || 0,
    attackRange: monster.attackRange || 0,
    moveSpeed: monster.moveSpeed || 0,
    armor: monster.armor || 0,
    magicResist: monster.magicResist || 0,
    attackCooldown: monster.attackCooldown || 0,
    goldReward: monster.goldReward || 0,
    experienceReward: monster.experienceReward || 0,
    isAlive: monster.isAlive,
    targetId: monster.targetId || '',
    isAggro: monster.isAggro || false,
    isResetting: monster.isResetting || false,
    // Vision / Fog of War
    visibleToRadiant: monster.visibleToRadiant !== undefined ? monster.visibleToRadiant : true,
    visibleToDire: monster.visibleToDire !== undefined ? monster.visibleToDire : true,
  };
}
