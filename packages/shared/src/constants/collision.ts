/**
 * Collision System Configuration
 *
 * Defines collision behavior for all entity types in the game.
 * Supports:
 * - Per-entity collision radius
 * - Collision layers for efficient detection
 * - Passthrough traits for abilities (ghost mode, flying, etc.)
 * - Configurable collision rules between entity types
 */

// ============================================
// Entity Types for Collision
// ============================================

export type CollisionEntityType =
  | 'player'
  | 'creep'
  | 'tower'
  | 'monster'
  | 'obstacle_tree'
  | 'obstacle_rock'
  | 'obstacle_wall'
  | 'obstacle_building'
  | 'obstacle_water';

// ============================================
// Collision Layers (Bitmask)
// ============================================

/**
 * Collision layers using bitmask for efficient collision filtering.
 * Each entity has a layer mask (what layer it's on) and a collision mask (what layers it collides with).
 */
export const COLLISION_LAYERS = {
  NONE: 0,
  PLAYERS: 1 << 0,      // 1
  CREEPS: 1 << 1,       // 2
  TOWERS: 1 << 2,       // 4
  MONSTERS: 1 << 3,     // 8
  TREES: 1 << 4,        // 16
  ROCKS: 1 << 5,        // 32
  WALLS: 1 << 6,        // 64
  BUILDINGS: 1 << 7,    // 128
  WATER: 1 << 8,        // 256
  // Combined masks
  ALL_UNITS: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),  // Players, Creeps, Towers, Monsters
  ALL_OBSTACLES: (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8),  // All terrain
  ALL: 0xFFFF,
} as const;

// ============================================
// Passthrough Traits
// ============================================

/**
 * Traits that modify collision behavior.
 * Applied through buffs or abilities.
 */
export type PassthroughTrait =
  | 'phase_units'       // Pass through players and creeps (e.g., ghost ability)
  | 'phase_creeps'      // Pass through creeps only
  | 'phase_monsters'    // Pass through jungle monsters
  | 'phase_trees'       // Pass through trees (e.g., timber chain)
  | 'phase_terrain'     // Pass through all terrain obstacles
  | 'phase_all'         // Pass through everything (ethereal form)
  | 'flying';           // Flying units ignore terrain but not other units

/**
 * Map traits to collision layers they allow passing through
 */
export const TRAIT_LAYER_BYPASS: Record<PassthroughTrait, number> = {
  phase_units: COLLISION_LAYERS.PLAYERS | COLLISION_LAYERS.CREEPS,
  phase_creeps: COLLISION_LAYERS.CREEPS,
  phase_monsters: COLLISION_LAYERS.MONSTERS,
  phase_trees: COLLISION_LAYERS.TREES,
  phase_terrain: COLLISION_LAYERS.ALL_OBSTACLES,
  phase_all: COLLISION_LAYERS.ALL,
  flying: COLLISION_LAYERS.TREES | COLLISION_LAYERS.ROCKS | COLLISION_LAYERS.WATER,
};

// ============================================
// Entity Collision Configuration
// ============================================

export interface CollisionConfig {
  /** Collision radius in game units */
  radius: number;
  /** Which layer this entity belongs to */
  layer: number;
  /** Which layers this entity collides with by default */
  collidesWith: number;
  /** Whether this entity can move (static obstacles don't need collision checks) */
  isStatic: boolean;
  /** Default separation force when pushing apart (0 = no separation, just block) */
  separationForce: number;
}

/**
 * Default collision configuration for each entity type
 */
export const ENTITY_COLLISION_CONFIG: Record<CollisionEntityType, CollisionConfig> = {
  // Moving units
  player: {
    radius: 50,
    layer: COLLISION_LAYERS.PLAYERS,
    collidesWith: COLLISION_LAYERS.PLAYERS | COLLISION_LAYERS.CREEPS | COLLISION_LAYERS.TOWERS |
                  COLLISION_LAYERS.MONSTERS | COLLISION_LAYERS.ALL_OBSTACLES,
    isStatic: false,
    separationForce: 0.5,
  },
  creep: {
    radius: 35,
    layer: COLLISION_LAYERS.CREEPS,
    collidesWith: COLLISION_LAYERS.PLAYERS | COLLISION_LAYERS.CREEPS | COLLISION_LAYERS.TOWERS |
                  COLLISION_LAYERS.MONSTERS | COLLISION_LAYERS.ALL_OBSTACLES,
    isStatic: false,
    separationForce: 0.3,
  },
  monster: {
    radius: 45,
    layer: COLLISION_LAYERS.MONSTERS,
    collidesWith: COLLISION_LAYERS.PLAYERS | COLLISION_LAYERS.CREEPS | COLLISION_LAYERS.MONSTERS |
                  COLLISION_LAYERS.ALL_OBSTACLES,
    isStatic: false,
    separationForce: 0.4,
  },

  // Static structures
  tower: {
    radius: 100,
    layer: COLLISION_LAYERS.TOWERS,
    collidesWith: COLLISION_LAYERS.NONE, // Towers don't check collisions, others check against towers
    isStatic: true,
    separationForce: 0,
  },

  // Terrain obstacles
  obstacle_tree: {
    radius: 80, // Default, actual radius from map config
    layer: COLLISION_LAYERS.TREES,
    collidesWith: COLLISION_LAYERS.NONE,
    isStatic: true,
    separationForce: 0,
  },
  obstacle_rock: {
    radius: 100,
    layer: COLLISION_LAYERS.ROCKS,
    collidesWith: COLLISION_LAYERS.NONE,
    isStatic: true,
    separationForce: 0,
  },
  obstacle_wall: {
    radius: 0, // Walls use rectangular collision
    layer: COLLISION_LAYERS.WALLS,
    collidesWith: COLLISION_LAYERS.NONE,
    isStatic: true,
    separationForce: 0,
  },
  obstacle_building: {
    radius: 150,
    layer: COLLISION_LAYERS.BUILDINGS,
    collidesWith: COLLISION_LAYERS.NONE,
    isStatic: true,
    separationForce: 0,
  },
  obstacle_water: {
    radius: 0, // Water uses rectangular collision
    layer: COLLISION_LAYERS.WATER,
    collidesWith: COLLISION_LAYERS.NONE,
    isStatic: true,
    separationForce: 0,
  },
};

// ============================================
// Collision Utility Functions
// ============================================

/**
 * Get collision config for an entity type
 */
export function getCollisionConfig(entityType: CollisionEntityType): CollisionConfig {
  return ENTITY_COLLISION_CONFIG[entityType];
}

/**
 * Check if two layers can collide based on their masks
 */
export function canLayersCollide(
  _sourceLayer: number,
  sourceCollidesWith: number,
  targetLayer: number
): boolean {
  return (sourceCollidesWith & targetLayer) !== 0;
}

/**
 * Calculate effective collision mask after applying passthrough traits
 */
export function getEffectiveCollisionMask(
  baseCollidesWith: number,
  activeTraits: PassthroughTrait[]
): number {
  let mask = baseCollidesWith;

  for (const trait of activeTraits) {
    const bypassLayers = TRAIT_LAYER_BYPASS[trait];
    if (bypassLayers !== undefined) {
      mask &= ~bypassLayers; // Remove bypassed layers from collision mask
    }
  }

  return mask;
}

/**
 * Check if entity A should collide with entity B
 */
export function shouldEntitiesCollide(
  entityAType: CollisionEntityType,
  entityATraits: PassthroughTrait[],
  entityBType: CollisionEntityType,
  entityBTraits: PassthroughTrait[]
): boolean {
  const configA = ENTITY_COLLISION_CONFIG[entityAType];
  const configB = ENTITY_COLLISION_CONFIG[entityBType];

  // Get effective collision masks
  const effectiveMaskA = getEffectiveCollisionMask(configA.collidesWith, entityATraits);
  const effectiveMaskB = getEffectiveCollisionMask(configB.collidesWith, entityBTraits);

  // Check if A collides with B's layer
  const aCollidesWithB = (effectiveMaskA & configB.layer) !== 0;
  // Check if B collides with A's layer
  const bCollidesWithA = (effectiveMaskB & configA.layer) !== 0;

  // Both need to "agree" on collision for it to happen
  // This allows one-way passthrough (e.g., ghost can pass through units but units still block each other)
  return aCollidesWithB && bCollidesWithA;
}

/**
 * Check circle-circle collision
 */
export function checkCircleCollision(
  x1: number,
  z1: number,
  radius1: number,
  x2: number,
  z2: number,
  radius2: number
): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const distSq = dx * dx + dz * dz;
  const minDist = radius1 + radius2;
  return distSq < minDist * minDist;
}

/**
 * Get penetration depth and direction for circle-circle collision
 */
export function getCircleCollisionPenetration(
  x1: number,
  z1: number,
  radius1: number,
  x2: number,
  z2: number,
  radius2: number
): { depth: number; normalX: number; normalZ: number } | null {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const minDist = radius1 + radius2;

  if (dist >= minDist) {
    return null; // No collision
  }

  // Prevent division by zero when entities are at same position
  if (dist < 0.001) {
    return { depth: minDist, normalX: 1, normalZ: 0 };
  }

  return {
    depth: minDist - dist,
    normalX: dx / dist,
    normalZ: dz / dist,
  };
}

/**
 * Check circle-rectangle collision
 */
export function checkCircleRectCollision(
  circleX: number,
  circleZ: number,
  circleRadius: number,
  rectX: number,
  rectZ: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  // Find the closest point on the rectangle to the circle center
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestZ = Math.max(rectZ, Math.min(circleZ, rectZ + rectHeight));

  // Calculate distance from circle center to closest point
  const dx = circleX - closestX;
  const dz = circleZ - closestZ;
  const distSq = dx * dx + dz * dz;

  return distSq < circleRadius * circleRadius;
}

// ============================================
// Creep-specific collision radii
// ============================================

export const CREEP_COLLISION_RADIUS = {
  melee: 35,
  ranged: 30,
  siege: 45,
} as const;

// ============================================
// Monster-specific collision radii
// ============================================

export const MONSTER_COLLISION_RADIUS: Record<string, number> = {
  small_wolf: 25,
  wolf: 35,
  alpha_wolf: 45,
  small_golem: 40,
  golem: 55,
  ancient_golem: 70,
  harpy: 30,
  harpy_queen: 45,
  centaur: 50,
  centaur_khan: 65,
  dragon: 80,
  elder_dragon: 120,
};
