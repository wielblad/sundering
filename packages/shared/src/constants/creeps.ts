/**
 * Creep/Minion System
 *
 * Lane creeps that spawn periodically and push toward enemy base.
 * Three types: melee, ranged, and siege (cannon).
 */

import type { Team } from '../types/game';

// ============================================
// Type Definitions
// ============================================

export type CreepType = 'melee' | 'ranged' | 'siege';

export interface CreepDefinition {
  type: CreepType;
  name: string;
  maxHealth: number;
  attackDamage: number;
  attackSpeed: number; // Attacks per second
  attackRange: number;
  moveSpeed: number;
  armor: number;
  magicResist: number;
  goldReward: number;
  experienceReward: number;
}

export interface CreepWaveConfig {
  meleeCount: number;
  rangedCount: number;
  siegeCount: number; // Only spawns every N waves
  siegeWaveInterval: number; // Every Nth wave includes siege
}

// ============================================
// Creep Stats
// ============================================

export const CREEP_STATS: Record<CreepType, CreepDefinition> = {
  melee: {
    type: 'melee',
    name: 'Melee Creep',
    maxHealth: 550,
    attackDamage: 20,
    attackSpeed: 1.0,
    attackRange: 100,
    moveSpeed: 325,
    armor: 2,
    magicResist: 0,
    goldReward: 38,
    experienceReward: 57,
  },
  ranged: {
    type: 'ranged',
    name: 'Ranged Creep',
    maxHealth: 300,
    attackDamage: 25,
    attackSpeed: 1.0,
    attackRange: 500,
    moveSpeed: 325,
    armor: 0,
    magicResist: 0,
    goldReward: 43,
    experienceReward: 69,
  },
  siege: {
    type: 'siege',
    name: 'Siege Creep',
    maxHealth: 1300,
    attackDamage: 40,
    attackSpeed: 0.7,
    attackRange: 550,
    moveSpeed: 325,
    armor: 0,
    magicResist: 0,
    goldReward: 66,
    experienceReward: 88,
  },
};

// ============================================
// Wave Configuration
// ============================================

export const CREEP_WAVE_CONFIG: CreepWaveConfig = {
  meleeCount: 3,
  rangedCount: 1,
  siegeCount: 1,
  siegeWaveInterval: 3, // Every 3rd wave includes siege creep
};

export const CREEP_SPAWN_CONFIG = {
  // Time before first wave spawns (seconds)
  initialSpawnDelay: 30,

  // Time between waves (seconds)
  waveInterval: 30,

  // Time between individual creep spawns in a wave (ms)
  creepSpawnDelay: 200,

  // Distance between creeps when spawning
  spawnSpread: 100,

  // How far from spawn point creeps appear
  spawnOffset: 300,
};

// ============================================
// Creep Scaling (per minute of game time)
// ============================================

export const CREEP_SCALING = {
  // Health increase per minute
  healthPerMinute: 10,

  // Attack damage increase per minute
  damagePerMinute: 1,

  // Gold reward increase per minute
  goldPerMinute: 1,

  // Experience reward increase per minute
  experiencePerMinute: 2,
};

// ============================================
// AI Configuration
// ============================================

export const CREEP_AI_CONFIG = {
  // Range at which creeps detect enemies
  aggroRange: 500,

  // Range at which creeps will chase enemies
  chaseRange: 700,

  // Range at which creeps return to lane if pulled too far
  leashRange: 1000,

  // How close to waypoint before moving to next
  waypointThreshold: 100,

  // Priority: 1 = highest
  targetPriority: {
    enemyCreepAttackingAlly: 1, // Enemy creep attacking an allied creep
    enemyCreep: 2,              // Any enemy creep in range
    enemyTower: 3,              // Enemy tower (only if no creeps)
    enemyHero: 4,               // Enemy hero attacking an ally
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get scaled creep stats based on game time
 */
export function getScaledCreepStats(
  baseStats: CreepDefinition,
  gameTimeSeconds: number
): CreepDefinition {
  const minutes = gameTimeSeconds / 60;

  return {
    ...baseStats,
    maxHealth: Math.floor(baseStats.maxHealth + CREEP_SCALING.healthPerMinute * minutes),
    attackDamage: Math.floor(baseStats.attackDamage + CREEP_SCALING.damagePerMinute * minutes),
    goldReward: Math.floor(baseStats.goldReward + CREEP_SCALING.goldPerMinute * minutes),
    experienceReward: Math.floor(baseStats.experienceReward + CREEP_SCALING.experiencePerMinute * minutes),
  };
}

/**
 * Calculate how many creeps should be in a wave
 */
export function getWaveComposition(waveNumber: number): { melee: number; ranged: number; siege: number } {
  const hasSiege = waveNumber % CREEP_WAVE_CONFIG.siegeWaveInterval === 0;

  return {
    melee: CREEP_WAVE_CONFIG.meleeCount,
    ranged: CREEP_WAVE_CONFIG.rangedCount,
    siege: hasSiege ? CREEP_WAVE_CONFIG.siegeCount : 0,
  };
}

/**
 * Get spawn positions for a lane
 */
export function getCreepSpawnPosition(
  team: Team,
  laneType: 'top' | 'mid' | 'bot',
  index: number
): { x: number; z: number } {
  // Base spawn positions (same as player spawns but offset for lanes)
  const baseX = team === 'radiant' ? -5500 : 5500;
  const baseZ = team === 'radiant' ? -5500 : 5500;

  // Offset based on lane
  const laneOffsets: Record<string, { x: number; z: number }> = {
    top: { x: team === 'radiant' ? 0 : 0, z: team === 'radiant' ? 500 : -500 },
    mid: { x: 0, z: 0 },
    bot: { x: team === 'radiant' ? 500 : -500, z: team === 'radiant' ? 0 : 0 },
  };

  const offset = laneOffsets[laneType];

  // Spread creeps slightly
  const spreadX = (index % 3 - 1) * CREEP_SPAWN_CONFIG.spawnSpread;
  const spreadZ = Math.floor(index / 3) * CREEP_SPAWN_CONFIG.spawnSpread;

  return {
    x: baseX + offset.x + spreadX,
    z: baseZ + offset.z + spreadZ,
  };
}
