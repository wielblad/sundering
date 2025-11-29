import type { GameConfig } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  maxPlayers: 10,
  teamSize: 5,
  heroSelectTime: 60,
  respawnTimeBase: 5,
  respawnTimePerLevel: 2,
  goldPerSecond: 1,
  startingGold: 600,
  experienceRange: 1200,
  killsToWin: 20,
  maxGameTime: 1200, // 20 minutes
};

export const BALANCE = {
  // Damage Calculations
  armorPenetrationBase: 0,
  magicPenetrationBase: 0,

  // Level Scaling
  maxLevel: 25,
  experiencePerLevel: [
    0, 200, 480, 840, 1280, 1800, 2400, 3080, 3840, 4680,
    5600, 6600, 7680, 8840, 10080, 11400, 12800, 14280, 15840, 17480,
    19200, 21000, 22880, 24840, 26880,
  ],

  // Gold Values
  heroKillGoldBase: 300,
  heroKillGoldPerLevel: 15,
  assistGold: 150,
  minionGoldMelee: 20,
  minionGoldRanged: 15,
  minionGoldSiege: 45,
  towerGold: 500,

  // Combat
  criticalStrikeMultiplier: 2.0,
  lifestealEffectiveness: 1.0,

  // Map
  mapWidth: 14000,
  mapHeight: 14000,
  laneWidth: 800,
};

export const TIMING = {
  tickRate: 20,                // Server ticks per second
  clientTickRate: 60,          // Client updates per second
  inputBufferMs: 100,          // Input buffer for lag compensation
  maxLatencyMs: 300,           // Maximum acceptable latency
  reconnectWindowMs: 60000,    // Time to reconnect before abandon
};

// Tower Stats by Tier
export const TOWER_STATS = {
  tier1: {
    health: 1800,
    armor: 15,
    attackDamage: 100,
    attackRange: 800,
    attackSpeed: 1.0, // 1 attack per second
  },
  tier2: {
    health: 2200,
    armor: 20,
    attackDamage: 130,
    attackRange: 800,
    attackSpeed: 1.0,
  },
  tier3: {
    health: 2800,
    armor: 25,
    attackDamage: 160,
    attackRange: 900,
    attackSpeed: 1.0,
  },
  tier4: {
    health: 3500,
    armor: 30,
    attackDamage: 200,
    attackRange: 1000,
    attackSpeed: 1.2,
  },
};

export const TOWER_CONFIG = {
  // Targeting priority
  targetPriorities: ['creep', 'player'] as const,

  // Protection rules
  backdoorProtection: true, // Towers take reduced damage without nearby creeps
  backdoorDamageReduction: 0.5, // 50% damage reduction when protected

  // Gold rewards
  destroyGoldGlobal: 200, // Gold to all team members
  destroyGoldLastHit: 300, // Bonus to player who gets last hit

  // True sight radius (reveals invisible enemies)
  trueSightRadius: 900,
};
