import { Schema, MapSchema, ArraySchema, defineTypes } from '@colyseus/schema';

export class Vector3 extends Schema {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

defineTypes(Vector3, {
  x: 'number',
  y: 'number',
  z: 'number',
});

export class AbilityState extends Schema {
  abilityId: string = '';
  level: number = 0;
  currentCooldown: number = 0;
  isActive: boolean = false;
}

defineTypes(AbilityState, {
  abilityId: 'string',
  level: 'number',
  currentCooldown: 'number',
  isActive: 'boolean',
});

export class InventoryItem extends Schema {
  itemId: string = '';
  slot: number = 0;
  stackCount: number = 1;
}

defineTypes(InventoryItem, {
  itemId: 'string',
  slot: 'number',
  stackCount: 'number',
});

export class BuffState extends Schema {
  id: string = ''; // Unique instance ID
  buffId: string = ''; // Reference to buff definition
  type: string = ''; // BuffType
  sourceId: string = ''; // Who applied this buff
  remainingDuration: number = 0; // Seconds remaining
  value: number = 0; // Effect value (slow %, damage per tick, etc.)
  stacks: number = 1; // Current stack count
}

defineTypes(BuffState, {
  id: 'string',
  buffId: 'string',
  type: 'string',
  sourceId: 'string',
  remainingDuration: 'number',
  value: 'number',
  stacks: 'number',
});

export class TowerState extends Schema {
  id: string = '';
  team: string = 'radiant'; // 'radiant' | 'dire'
  lane: string = 'mid'; // 'top' | 'mid' | 'bot' | 'base'
  tier: number = 1; // 1, 2, 3, 4 (T4 = ancient defense)

  // Position
  position: Vector3 = new Vector3();

  // Stats
  currentHealth: number = 0;
  maxHealth: number = 0;
  armor: number = 0;
  attackDamage: number = 0;
  attackRange: number = 0;
  attackSpeed: number = 0; // Attacks per second
  attackCooldown: number = 0; // Time until next attack

  // State
  isAlive: boolean = true;
  targetId: string = ''; // Current target (player ID or creep ID)
  isUnderAttack: boolean = false; // Visual indicator
}

defineTypes(TowerState, {
  id: 'string',
  team: 'string',
  lane: 'string',
  tier: 'number',
  position: Vector3,
  currentHealth: 'number',
  maxHealth: 'number',
  armor: 'number',
  attackDamage: 'number',
  attackRange: 'number',
  attackSpeed: 'number',
  attackCooldown: 'number',
  isAlive: 'boolean',
  targetId: 'string',
  isUnderAttack: 'boolean',
});

export class CreepState extends Schema {
  id: string = '';
  team: string = 'radiant'; // 'radiant' | 'dire'
  type: string = 'melee'; // 'melee' | 'ranged' | 'siege'
  lane: string = 'mid'; // 'top' | 'mid' | 'bot'

  // Position
  position: Vector3 = new Vector3();
  rotation: number = 0;
  targetPosition: Vector3 = new Vector3();

  // Stats
  currentHealth: number = 0;
  maxHealth: number = 0;
  attackDamage: number = 0;
  attackSpeed: number = 0;
  attackRange: number = 0;
  moveSpeed: number = 0;
  armor: number = 0;
  attackCooldown: number = 0;

  // Rewards
  goldReward: number = 0;
  experienceReward: number = 0;

  // State
  isAlive: boolean = true;
  targetId: string = ''; // Current target (player ID, tower ID, or creep ID)
  targetType: string = ''; // 'player' | 'tower' | 'creep'
  isMoving: boolean = false;
  waypointIndex: number = 0; // Current waypoint in lane path

  // Vision / Fog of War
  visibleToRadiant: boolean = true;
  visibleToDire: boolean = true;
}

defineTypes(CreepState, {
  id: 'string',
  team: 'string',
  type: 'string',
  lane: 'string',
  position: Vector3,
  rotation: 'number',
  targetPosition: Vector3,
  currentHealth: 'number',
  maxHealth: 'number',
  attackDamage: 'number',
  attackSpeed: 'number',
  attackRange: 'number',
  moveSpeed: 'number',
  armor: 'number',
  attackCooldown: 'number',
  goldReward: 'number',
  experienceReward: 'number',
  isAlive: 'boolean',
  targetId: 'string',
  targetType: 'string',
  isMoving: 'boolean',
  waypointIndex: 'number',
  visibleToRadiant: 'boolean',
  visibleToDire: 'boolean',
});

export class JungleMonsterState extends Schema {
  id: string = '';
  campId: string = ''; // Reference to camp this monster belongs to
  monsterType: string = ''; // MonsterType from jungle.ts
  name: string = '';

  // Position
  position: Vector3 = new Vector3();
  rotation: number = 0;
  spawnPosition: Vector3 = new Vector3(); // For leash/reset

  // Stats
  currentHealth: number = 0;
  maxHealth: number = 0;
  attackDamage: number = 0;
  attackSpeed: number = 0;
  attackRange: number = 0;
  moveSpeed: number = 0;
  armor: number = 0;
  magicResist: number = 0;
  attackCooldown: number = 0;

  // Rewards
  goldReward: number = 0;
  experienceReward: number = 0;

  // State
  isAlive: boolean = true;
  targetId: string = ''; // Current target player ID
  isAggro: boolean = false; // Currently attacking
  isResetting: boolean = false; // Returning to spawn

  // Vision / Fog of War
  visibleToRadiant: boolean = true;
  visibleToDire: boolean = true;
}

defineTypes(JungleMonsterState, {
  id: 'string',
  campId: 'string',
  monsterType: 'string',
  name: 'string',
  position: Vector3,
  rotation: 'number',
  spawnPosition: Vector3,
  currentHealth: 'number',
  maxHealth: 'number',
  attackDamage: 'number',
  attackSpeed: 'number',
  attackRange: 'number',
  moveSpeed: 'number',
  armor: 'number',
  magicResist: 'number',
  attackCooldown: 'number',
  goldReward: 'number',
  experienceReward: 'number',
  isAlive: 'boolean',
  targetId: 'string',
  isAggro: 'boolean',
  isResetting: 'boolean',
  visibleToRadiant: 'boolean',
  visibleToDire: 'boolean',
});

export class JungleCampState extends Schema {
  id: string = '';
  difficulty: string = 'easy'; // CampDifficulty
  team: string = 'neutral'; // 'radiant' | 'dire' | 'neutral'
  position: Vector3 = new Vector3();

  // State
  isCleared: boolean = false;
  respawnTimer: number = 0; // Seconds until respawn
  lastClearedBy: string = ''; // Player ID who cleared it
}

defineTypes(JungleCampState, {
  id: 'string',
  difficulty: 'string',
  team: 'string',
  position: Vector3,
  isCleared: 'boolean',
  respawnTimer: 'number',
  lastClearedBy: 'string',
});

export class GamePlayer extends Schema {
  id: string = '';
  userId: string = '';
  username: string = '';
  displayName: string = '';
  team: string = 'radiant';
  isBot: boolean = false;
  isConnected: boolean = true;
  isReady: boolean = false;

  // Hero selection
  selectedHeroId: string = '';
  lockedHeroId: string = '';

  // In-game stats
  heroId: string = '';
  level: number = 1;
  currentHealth: number = 0;
  maxHealth: number = 0;
  currentMana: number = 0;
  maxMana: number = 0;

  // Position
  position: Vector3 = new Vector3();
  rotation: number = 0;
  targetPosition: Vector3 = new Vector3();

  // Combat stats
  kills: number = 0;
  deaths: number = 0;
  assists: number = 0;
  creepScore: number = 0;
  gold: number = 600;
  experience: number = 0;
  damageDealt: number = 0;
  goldEarned: number = 0; // Total gold earned (kills + passive)

  // Status
  isAlive: boolean = true;
  respawnTime: number = 0;

  // Vision / Fog of War
  visionRange: number = 1800; // Hero base vision range
  visibleToRadiant: boolean = true; // Is visible to radiant team
  visibleToDire: boolean = true; // Is visible to dire team

  // Movement
  moveSpeed: number = 0;
  isMoving: boolean = false;

  // Combat
  attackDamage: number = 0;
  attackSpeed: number = 0;
  attackRange: number = 0;
  armor: number = 0;
  magicResist: number = 0;
  attackCooldown: number = 0; // Time until next attack (seconds)
  targetId: string = ''; // Current attack target player ID

  // Abilities
  abilities: ArraySchema<AbilityState> = new ArraySchema<AbilityState>();

  // Inventory (6 slots)
  inventory: ArraySchema<InventoryItem> = new ArraySchema<InventoryItem>();

  // Active buffs/debuffs
  buffs: ArraySchema<BuffState> = new ArraySchema<BuffState>();
}

defineTypes(GamePlayer, {
  id: 'string',
  userId: 'string',
  username: 'string',
  displayName: 'string',
  team: 'string',
  isBot: 'boolean',
  isConnected: 'boolean',
  isReady: 'boolean',
  selectedHeroId: 'string',
  lockedHeroId: 'string',
  heroId: 'string',
  level: 'number',
  currentHealth: 'number',
  maxHealth: 'number',
  currentMana: 'number',
  maxMana: 'number',
  position: Vector3,
  rotation: 'number',
  targetPosition: Vector3,
  kills: 'number',
  deaths: 'number',
  assists: 'number',
  creepScore: 'number',
  gold: 'number',
  experience: 'number',
  damageDealt: 'number',
  goldEarned: 'number',
  isAlive: 'boolean',
  respawnTime: 'number',
  visionRange: 'number',
  visibleToRadiant: 'boolean',
  visibleToDire: 'boolean',
  moveSpeed: 'number',
  isMoving: 'boolean',
  attackDamage: 'number',
  attackSpeed: 'number',
  attackRange: 'number',
  armor: 'number',
  magicResist: 'number',
  attackCooldown: 'number',
  targetId: 'string',
  abilities: [AbilityState],
  inventory: [InventoryItem],
  buffs: [BuffState],
});

export class GameChatMessage extends Schema {
  id: string = '';
  senderId: string = '';
  senderName: string = '';
  senderTeam: string = ''; // 'radiant' | 'dire' - needed for team chat filtering
  content: string = '';
  timestamp: number = 0;
  teamOnly: boolean = false;
}

defineTypes(GameChatMessage, {
  id: 'string',
  senderId: 'string',
  senderName: 'string',
  senderTeam: 'string',
  content: 'string',
  timestamp: 'number',
  teamOnly: 'boolean',
});

export type PingType = 'alert' | 'danger' | 'missing' | 'on_my_way' | 'attack' | 'defend';

export class MapPing extends Schema {
  id: string = '';
  senderId: string = '';
  senderName: string = '';
  team: string = 'radiant';
  type: string = 'alert';
  position: Vector3 = new Vector3();
  timestamp: number = 0;
  expiresAt: number = 0;
}

defineTypes(MapPing, {
  id: 'string',
  senderId: 'string',
  senderName: 'string',
  team: 'string',
  type: 'string',
  position: Vector3,
  timestamp: 'number',
  expiresAt: 'number',
});

export type GamePhase = 'waiting' | 'hero_select' | 'loading' | 'playing' | 'paused' | 'ended';

export class GameState extends Schema {
  matchId: string = '';
  phase: string = 'waiting';
  gameTime: number = 0;
  heroSelectTimer: number = 60;

  // Teams
  radiantScore: number = 0;
  direScore: number = 0;
  winner: string = '';

  // Players
  players: MapSchema<GamePlayer> = new MapSchema<GamePlayer>();

  // Towers
  towers: MapSchema<TowerState> = new MapSchema<TowerState>();

  // Creeps
  creeps: MapSchema<CreepState> = new MapSchema<CreepState>();

  // Wave tracking
  currentWave: number = 0;

  // Jungle
  jungleCamps: MapSchema<JungleCampState> = new MapSchema<JungleCampState>();
  jungleMonsters: MapSchema<JungleMonsterState> = new MapSchema<JungleMonsterState>();

  // Chat
  messages: ArraySchema<GameChatMessage> = new ArraySchema<GameChatMessage>();

  // Map pings
  pings: ArraySchema<MapPing> = new ArraySchema<MapPing>();

  // Game settings
  isPaused: boolean = false;
  pauseTimeRemaining: number = 0;
}

defineTypes(GameState, {
  matchId: 'string',
  phase: 'string',
  gameTime: 'number',
  heroSelectTimer: 'number',
  radiantScore: 'number',
  direScore: 'number',
  winner: 'string',
  players: { map: GamePlayer },
  towers: { map: TowerState },
  creeps: { map: CreepState },
  currentWave: 'number',
  jungleCamps: { map: JungleCampState },
  jungleMonsters: { map: JungleMonsterState },
  messages: [GameChatMessage],
  pings: [MapPing],
  isPaused: 'boolean',
  pauseTimeRemaining: 'number',
});
