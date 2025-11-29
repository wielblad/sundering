/**
 * Jungle Camps System
 *
 * Neutral monster camps that spawn in the jungle areas.
 * Killing them provides gold, experience, and sometimes buffs.
 */

// ============================================
// Type Definitions
// ============================================

export type CampDifficulty = 'easy' | 'medium' | 'hard' | 'ancient';

export type MonsterType =
  | 'small_wolf'
  | 'wolf'
  | 'alpha_wolf'
  | 'small_golem'
  | 'golem'
  | 'ancient_golem'
  | 'harpy'
  | 'harpy_queen'
  | 'centaur'
  | 'centaur_khan'
  | 'dragon'
  | 'elder_dragon';

export interface MonsterDefinition {
  type: MonsterType;
  name: string;
  maxHealth: number;
  attackDamage: number;
  attackSpeed: number;
  attackRange: number;
  moveSpeed: number;
  armor: number;
  magicResist: number;
  goldReward: number;
  experienceReward: number;
  // Special abilities/effects
  abilities?: string[];
}

export interface CampComposition {
  difficulty: CampDifficulty;
  monsters: Array<{
    type: MonsterType;
    count: number;
    offset: { x: number; z: number }; // Offset from camp center
  }>;
  totalGoldReward: number;
  totalExperienceReward: number;
  respawnTime: number;
}

// ============================================
// Monster Stats
// ============================================

export const MONSTER_STATS: Record<MonsterType, MonsterDefinition> = {
  // Wolves - Easy camp
  small_wolf: {
    type: 'small_wolf',
    name: 'Small Wolf',
    maxHealth: 300,
    attackDamage: 15,
    attackSpeed: 1.0,
    attackRange: 100,
    moveSpeed: 300,
    armor: 0,
    magicResist: 0,
    goldReward: 20,
    experienceReward: 30,
  },
  wolf: {
    type: 'wolf',
    name: 'Wolf',
    maxHealth: 450,
    attackDamage: 25,
    attackSpeed: 1.0,
    attackRange: 100,
    moveSpeed: 320,
    armor: 2,
    magicResist: 0,
    goldReward: 35,
    experienceReward: 50,
  },
  alpha_wolf: {
    type: 'alpha_wolf',
    name: 'Alpha Wolf',
    maxHealth: 700,
    attackDamage: 35,
    attackSpeed: 1.2,
    attackRange: 100,
    moveSpeed: 340,
    armor: 5,
    magicResist: 0,
    goldReward: 55,
    experienceReward: 80,
    abilities: ['howl'], // Buff allies
  },

  // Golems - Medium camp
  small_golem: {
    type: 'small_golem',
    name: 'Small Golem',
    maxHealth: 500,
    attackDamage: 20,
    attackSpeed: 0.8,
    attackRange: 100,
    moveSpeed: 250,
    armor: 5,
    magicResist: 5,
    goldReward: 30,
    experienceReward: 45,
  },
  golem: {
    type: 'golem',
    name: 'Golem',
    maxHealth: 900,
    attackDamage: 40,
    attackSpeed: 0.7,
    attackRange: 100,
    moveSpeed: 270,
    armor: 10,
    magicResist: 10,
    goldReward: 60,
    experienceReward: 90,
  },
  ancient_golem: {
    type: 'ancient_golem',
    name: 'Ancient Golem',
    maxHealth: 1500,
    attackDamage: 60,
    attackSpeed: 0.6,
    attackRange: 150,
    moveSpeed: 280,
    armor: 15,
    magicResist: 15,
    goldReward: 100,
    experienceReward: 150,
    abilities: ['mana_regen'], // Grants mana buff on kill
  },

  // Harpies - Easy/Medium camp
  harpy: {
    type: 'harpy',
    name: 'Harpy',
    maxHealth: 350,
    attackDamage: 30,
    attackSpeed: 1.3,
    attackRange: 400,
    moveSpeed: 350,
    armor: 0,
    magicResist: 5,
    goldReward: 25,
    experienceReward: 40,
  },
  harpy_queen: {
    type: 'harpy_queen',
    name: 'Harpy Queen',
    maxHealth: 600,
    attackDamage: 45,
    attackSpeed: 1.2,
    attackRange: 450,
    moveSpeed: 360,
    armor: 2,
    magicResist: 10,
    goldReward: 50,
    experienceReward: 75,
    abilities: ['screech'], // AoE slow
  },

  // Centaurs - Hard camp
  centaur: {
    type: 'centaur',
    name: 'Centaur',
    maxHealth: 800,
    attackDamage: 45,
    attackSpeed: 1.0,
    attackRange: 100,
    moveSpeed: 330,
    armor: 8,
    magicResist: 5,
    goldReward: 55,
    experienceReward: 85,
  },
  centaur_khan: {
    type: 'centaur_khan',
    name: 'Centaur Khan',
    maxHealth: 1200,
    attackDamage: 70,
    attackSpeed: 0.9,
    attackRange: 100,
    moveSpeed: 340,
    armor: 12,
    magicResist: 8,
    goldReward: 90,
    experienceReward: 130,
    abilities: ['stomp'], // AoE stun
  },

  // Dragons - Ancient camp
  dragon: {
    type: 'dragon',
    name: 'Dragon',
    maxHealth: 1800,
    attackDamage: 80,
    attackSpeed: 0.8,
    attackRange: 200,
    moveSpeed: 300,
    armor: 15,
    magicResist: 20,
    goldReward: 120,
    experienceReward: 180,
    abilities: ['fire_breath'], // Cone AoE damage
  },
  elder_dragon: {
    type: 'elder_dragon',
    name: 'Elder Dragon',
    maxHealth: 3500,
    attackDamage: 120,
    attackSpeed: 0.7,
    attackRange: 250,
    moveSpeed: 280,
    armor: 25,
    magicResist: 30,
    goldReward: 300,
    experienceReward: 400,
    abilities: ['fire_breath', 'dragon_rage'], // Extra damage when low HP
  },
};

// ============================================
// Camp Compositions
// ============================================

export const CAMP_COMPOSITIONS: Record<CampDifficulty, CampComposition> = {
  easy: {
    difficulty: 'easy',
    monsters: [
      { type: 'wolf', count: 1, offset: { x: 0, z: 0 } },
      { type: 'small_wolf', count: 2, offset: { x: -80, z: 60 } },
    ],
    totalGoldReward: 75,
    totalExperienceReward: 110,
    respawnTime: 60,
  },
  medium: {
    difficulty: 'medium',
    monsters: [
      { type: 'golem', count: 1, offset: { x: 0, z: 0 } },
      { type: 'small_golem', count: 2, offset: { x: -100, z: 80 } },
    ],
    totalGoldReward: 120,
    totalExperienceReward: 180,
    respawnTime: 60,
  },
  hard: {
    difficulty: 'hard',
    monsters: [
      { type: 'centaur_khan', count: 1, offset: { x: 0, z: 0 } },
      { type: 'centaur', count: 2, offset: { x: -120, z: 100 } },
    ],
    totalGoldReward: 200,
    totalExperienceReward: 300,
    respawnTime: 60,
  },
  ancient: {
    difficulty: 'ancient',
    monsters: [
      { type: 'dragon', count: 1, offset: { x: 0, z: 0 } },
      { type: 'dragon', count: 1, offset: { x: 150, z: 0 } },
    ],
    totalGoldReward: 240,
    totalExperienceReward: 360,
    respawnTime: 120,
  },
};

// Special boss camp (River Boss)
export const RIVER_BOSS_COMPOSITION: CampComposition = {
  difficulty: 'ancient',
  monsters: [
    { type: 'elder_dragon', count: 1, offset: { x: 0, z: 0 } },
  ],
  totalGoldReward: 300,
  totalExperienceReward: 400,
  respawnTime: 300, // 5 minutes
};

// ============================================
// Jungle AI Configuration
// ============================================

export const JUNGLE_AI_CONFIG = {
  // Range at which monsters detect players
  aggroRange: 400,

  // Range at which monsters will chase players
  chaseRange: 600,

  // Range at which monsters return to camp (leash)
  leashRange: 800,

  // Time before monsters reset if not attacked
  resetTime: 5,

  // Patience - time between changing targets
  targetSwitchCooldown: 2,
};

// ============================================
// Jungle Scaling
// ============================================

export const JUNGLE_SCALING = {
  // Health increase per minute
  healthPerMinute: 15,

  // Attack damage increase per minute
  damagePerMinute: 2,

  // Gold reward increase per minute
  goldPerMinute: 2,

  // Experience reward increase per minute
  experiencePerMinute: 3,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get scaled monster stats based on game time
 */
export function getScaledMonsterStats(
  baseStats: MonsterDefinition,
  gameTimeSeconds: number
): MonsterDefinition {
  const minutes = gameTimeSeconds / 60;

  return {
    ...baseStats,
    maxHealth: Math.floor(baseStats.maxHealth + JUNGLE_SCALING.healthPerMinute * minutes),
    attackDamage: Math.floor(baseStats.attackDamage + JUNGLE_SCALING.damagePerMinute * minutes),
    goldReward: Math.floor(baseStats.goldReward + JUNGLE_SCALING.goldPerMinute * minutes),
    experienceReward: Math.floor(baseStats.experienceReward + JUNGLE_SCALING.experiencePerMinute * minutes),
  };
}

/**
 * Get monster spawn positions for a camp
 */
export function getMonsterSpawnPositions(
  campPosition: { x: number; z: number },
  composition: CampComposition
): Array<{ type: MonsterType; position: { x: number; z: number } }> {
  const positions: Array<{ type: MonsterType; position: { x: number; z: number } }> = [];

  for (const entry of composition.monsters) {
    for (let i = 0; i < entry.count; i++) {
      // Spread multiple monsters of same type
      const spreadX = i > 0 ? (i % 2 === 0 ? 1 : -1) * 60 * Math.ceil(i / 2) : 0;
      const spreadZ = i > 0 ? (i % 2 === 0 ? 1 : -1) * 40 * Math.ceil(i / 2) : 0;

      positions.push({
        type: entry.type,
        position: {
          x: campPosition.x + entry.offset.x + spreadX,
          z: campPosition.z + entry.offset.z + spreadZ,
        },
      });
    }
  }

  return positions;
}
