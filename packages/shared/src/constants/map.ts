/**
 * Map System - MOBA 3-Lane Map Configuration
 *
 * Map Layout (14000x14000 units):
 *
 *                     DIRE BASE (6000, 6000)
 *                          [D]
 *                         / | \
 *                    Top / Mid \ Bot
 *                   Lane/ Lane  \Lane
 *                     /    |     \
 *                    /     |      \
 *     [-6000,6000]  /      |       \  [6000,-6000]
 *                  /       |        \
 *                 /        |         \
 *                /    RIVER/JUNGLE    \
 *               /          |           \
 *              /           |            \
 *             /            |             \
 *            /             |              \
 *           [R]
 *     RADIANT BASE (-6000, -6000)
 */

import { BALANCE } from './config';
import type { Team } from '../types/game';

// ============================================
// Type Definitions
// ============================================

export type ObstacleShape = 'rectangle' | 'circle';
export type ObstacleType = 'wall' | 'rock' | 'tree' | 'building' | 'water';
export type RegionType = 'base' | 'lane' | 'jungle' | 'river';
export type MapTeam = Team | 'neutral';
export type LaneType = 'top' | 'mid' | 'bot';

export interface Point2D {
  x: number;
  z: number;
}

export interface Rectangle {
  x: number;
  z: number;
  width: number;
  height: number;
  rotation?: number; // degrees
}

export interface Circle {
  x: number;
  z: number;
  radius: number;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  shape: ObstacleShape;
  bounds: Rectangle | Circle;
  blocksMovement: boolean;
  blocksVision: boolean;
}

export interface Region {
  id: string;
  name: string;
  type: RegionType;
  team: MapTeam;
  bounds: Rectangle;
  color?: string; // for minimap/debug
}

export interface LaneWaypoint {
  x: number;
  z: number;
}

export interface Lane {
  id: string;
  name: string;
  type: LaneType;
  waypoints: {
    radiant: LaneWaypoint[]; // path from radiant to dire
    dire: LaneWaypoint[];    // path from dire to radiant
  };
  width: number;
}

export interface TowerPosition {
  id: string;
  team: MapTeam;
  lane: LaneType | 'base';
  tier: 1 | 2 | 3 | 4; // T1, T2, T3, T4 (ancient)
  position: Point2D;
}

export interface CampPosition {
  id: string;
  name: string;
  team: MapTeam; // neutral, radiant, or dire side
  position: Point2D;
  respawnTime: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'ancient';
}

export interface SpawnPoint {
  id: string;
  team: MapTeam;
  position: Point2D;
  radius: number; // random spawn within radius
}

export interface MapConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  regions: Region[];
  obstacles: Obstacle[];
  lanes: Lane[];
  towers: TowerPosition[];
  camps: CampPosition[];
  spawns: SpawnPoint[];
}

// ============================================
// Map Constants
// ============================================

const MAP_WIDTH = BALANCE.mapWidth;
const MAP_HEIGHT = BALANCE.mapHeight;
const HALF_MAP = MAP_WIDTH / 2;

// Base dimensions
const BASE_SIZE = 2000;

// Lane dimensions
const LANE_WIDTH = 800;

// Jungle tree cluster dimensions
const TREE_RADIUS = 150;
const ROCK_RADIUS = 200;

// ============================================
// Regions
// ============================================

const REGIONS: Region[] = [
  // Bases
  {
    id: 'radiant_base',
    name: 'Radiant Base',
    type: 'base',
    team: 'radiant',
    bounds: { x: -HALF_MAP, z: -HALF_MAP, width: BASE_SIZE, height: BASE_SIZE },
    color: '#22c55e',
  },
  {
    id: 'dire_base',
    name: 'Dire Base',
    type: 'base',
    team: 'dire',
    bounds: { x: HALF_MAP - BASE_SIZE, z: HALF_MAP - BASE_SIZE, width: BASE_SIZE, height: BASE_SIZE },
    color: '#ef4444',
  },

  // Jungle regions
  {
    id: 'radiant_jungle',
    name: 'Radiant Jungle',
    type: 'jungle',
    team: 'radiant',
    bounds: { x: -4000, z: -3000, width: 3500, height: 4000 },
    color: '#166534',
  },
  {
    id: 'dire_jungle',
    name: 'Dire Jungle',
    type: 'jungle',
    team: 'dire',
    bounds: { x: 500, z: -1000, width: 3500, height: 4000 },
    color: '#7f1d1d',
  },

  // River
  {
    id: 'river',
    name: 'River',
    type: 'river',
    team: 'neutral',
    bounds: { x: -3000, z: -1000, width: 6000, height: 2000, rotation: 45 },
    color: '#0ea5e9',
  },
];

// ============================================
// Obstacles
// ============================================

// Helper to create tree clusters
function createTreeCluster(baseId: string, centerX: number, centerZ: number, count: number): Obstacle[] {
  const trees: Obstacle[] = [];
  const angleStep = (Math.PI * 2) / count;
  const clusterRadius = 300;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i + (Math.random() * 0.3);
    const distance = clusterRadius * (0.5 + Math.random() * 0.5);
    trees.push({
      id: `${baseId}_tree_${i}`,
      type: 'tree',
      shape: 'circle',
      bounds: {
        x: centerX + Math.cos(angle) * distance,
        z: centerZ + Math.sin(angle) * distance,
        radius: TREE_RADIUS * (0.8 + Math.random() * 0.4),
      },
      blocksMovement: true,
      blocksVision: true,
    });
  }
  return trees;
}

// Helper to create rock formations
function createRock(id: string, x: number, z: number, radius: number = ROCK_RADIUS): Obstacle {
  return {
    id,
    type: 'rock',
    shape: 'circle',
    bounds: { x, z, radius },
    blocksMovement: true,
    blocksVision: true,
  };
}

// Helper to create wall segments
function createWall(id: string, x: number, z: number, width: number, height: number, rotation: number = 0): Obstacle {
  return {
    id,
    type: 'wall',
    shape: 'rectangle',
    bounds: { x, z, width, height, rotation },
    blocksMovement: true,
    blocksVision: true,
  };
}

const OBSTACLES: Obstacle[] = [
  // Map boundary walls (already handled by game logic, but good to have)
  createWall('boundary_north', -HALF_MAP, HALF_MAP - 100, MAP_WIDTH, 200),
  createWall('boundary_south', -HALF_MAP, -HALF_MAP - 100, MAP_WIDTH, 200),
  createWall('boundary_east', HALF_MAP - 100, -HALF_MAP, 200, MAP_HEIGHT),
  createWall('boundary_west', -HALF_MAP - 100, -HALF_MAP, 200, MAP_HEIGHT),

  // Base walls - Radiant
  createWall('radiant_wall_1', -HALF_MAP + BASE_SIZE, -HALF_MAP, 300, 1500),
  createWall('radiant_wall_2', -HALF_MAP, -HALF_MAP + BASE_SIZE, 1500, 300),

  // Base walls - Dire
  createWall('dire_wall_1', HALF_MAP - BASE_SIZE - 300, HALF_MAP - 1500, 300, 1500),
  createWall('dire_wall_2', HALF_MAP - 1500, HALF_MAP - BASE_SIZE - 300, 1500, 300),

  // Mid lane obstacles (cliffs on both sides)
  createRock('mid_rock_1', -1500, -1500, 400),
  createRock('mid_rock_2', 1500, 1500, 400),
  createRock('mid_rock_3', -800, 800, 300),
  createRock('mid_rock_4', 800, -800, 300),

  // Jungle tree clusters - Radiant side
  ...createTreeCluster('radiant_jungle_1', -3500, -1500, 5),
  ...createTreeCluster('radiant_jungle_2', -2500, -500, 4),
  ...createTreeCluster('radiant_jungle_3', -3000, 500, 5),
  ...createTreeCluster('radiant_jungle_4', -4500, 1000, 4),

  // Jungle tree clusters - Dire side
  ...createTreeCluster('dire_jungle_1', 3500, 1500, 5),
  ...createTreeCluster('dire_jungle_2', 2500, 500, 4),
  ...createTreeCluster('dire_jungle_3', 3000, -500, 5),
  ...createTreeCluster('dire_jungle_4', 4500, -1000, 4),

  // River crossing rocks
  createRock('river_rock_1', -500, 500, 250),
  createRock('river_rock_2', 500, -500, 250),
  createRock('river_rock_3', 0, 0, 200),

  // Top lane obstacles
  ...createTreeCluster('top_trees_1', -4000, 3000, 3),
  ...createTreeCluster('top_trees_2', 0, 5000, 4),
  ...createTreeCluster('top_trees_3', 3000, 4000, 3),

  // Bot lane obstacles
  ...createTreeCluster('bot_trees_1', 4000, -3000, 3),
  ...createTreeCluster('bot_trees_2', 0, -5000, 4),
  ...createTreeCluster('bot_trees_3', -3000, -4000, 3),
];

// ============================================
// Lanes
// ============================================

const LANES: Lane[] = [
  {
    id: 'top_lane',
    name: 'Top Lane',
    type: 'top',
    width: LANE_WIDTH,
    waypoints: {
      radiant: [
        { x: -5500, z: -5500 }, // Start from radiant base
        { x: -5500, z: 0 },     // Go up
        { x: -5500, z: 4000 },  // Continue up
        { x: -2000, z: 5500 },  // Turn toward dire
        { x: 2000, z: 5500 },   // Continue
        { x: 5500, z: 5500 },   // Reach dire base
      ],
      dire: [
        { x: 5500, z: 5500 },
        { x: 2000, z: 5500 },
        { x: -2000, z: 5500 },
        { x: -5500, z: 4000 },
        { x: -5500, z: 0 },
        { x: -5500, z: -5500 },
      ],
    },
  },
  {
    id: 'mid_lane',
    name: 'Mid Lane',
    type: 'mid',
    width: LANE_WIDTH,
    waypoints: {
      radiant: [
        { x: -5000, z: -5000 },
        { x: -3000, z: -3000 },
        { x: 0, z: 0 },
        { x: 3000, z: 3000 },
        { x: 5000, z: 5000 },
      ],
      dire: [
        { x: 5000, z: 5000 },
        { x: 3000, z: 3000 },
        { x: 0, z: 0 },
        { x: -3000, z: -3000 },
        { x: -5000, z: -5000 },
      ],
    },
  },
  {
    id: 'bot_lane',
    name: 'Bot Lane',
    type: 'bot',
    width: LANE_WIDTH,
    waypoints: {
      radiant: [
        { x: -5500, z: -5500 },
        { x: 0, z: -5500 },
        { x: 4000, z: -5500 },
        { x: 5500, z: -2000 },
        { x: 5500, z: 2000 },
        { x: 5500, z: 5500 },
      ],
      dire: [
        { x: 5500, z: 5500 },
        { x: 5500, z: 2000 },
        { x: 5500, z: -2000 },
        { x: 4000, z: -5500 },
        { x: 0, z: -5500 },
        { x: -5500, z: -5500 },
      ],
    },
  },
];

// ============================================
// Tower Positions
// ============================================

const TOWERS: TowerPosition[] = [
  // Radiant towers
  { id: 'radiant_top_t1', team: 'radiant', lane: 'top', tier: 1, position: { x: -5500, z: 1500 } },
  { id: 'radiant_top_t2', team: 'radiant', lane: 'top', tier: 2, position: { x: -5500, z: -1500 } },
  { id: 'radiant_top_t3', team: 'radiant', lane: 'top', tier: 3, position: { x: -5000, z: -4000 } },

  { id: 'radiant_mid_t1', team: 'radiant', lane: 'mid', tier: 1, position: { x: -2000, z: -2000 } },
  { id: 'radiant_mid_t2', team: 'radiant', lane: 'mid', tier: 2, position: { x: -3500, z: -3500 } },
  { id: 'radiant_mid_t3', team: 'radiant', lane: 'mid', tier: 3, position: { x: -4500, z: -4500 } },

  { id: 'radiant_bot_t1', team: 'radiant', lane: 'bot', tier: 1, position: { x: 1500, z: -5500 } },
  { id: 'radiant_bot_t2', team: 'radiant', lane: 'bot', tier: 2, position: { x: -1500, z: -5500 } },
  { id: 'radiant_bot_t3', team: 'radiant', lane: 'bot', tier: 3, position: { x: -4000, z: -5000 } },

  { id: 'radiant_base_t4_1', team: 'radiant', lane: 'base', tier: 4, position: { x: -5500, z: -5000 } },
  { id: 'radiant_base_t4_2', team: 'radiant', lane: 'base', tier: 4, position: { x: -5000, z: -5500 } },

  // Dire towers
  { id: 'dire_top_t1', team: 'dire', lane: 'top', tier: 1, position: { x: -1500, z: 5500 } },
  { id: 'dire_top_t2', team: 'dire', lane: 'top', tier: 2, position: { x: 1500, z: 5500 } },
  { id: 'dire_top_t3', team: 'dire', lane: 'top', tier: 3, position: { x: 4000, z: 5000 } },

  { id: 'dire_mid_t1', team: 'dire', lane: 'mid', tier: 1, position: { x: 2000, z: 2000 } },
  { id: 'dire_mid_t2', team: 'dire', lane: 'mid', tier: 2, position: { x: 3500, z: 3500 } },
  { id: 'dire_mid_t3', team: 'dire', lane: 'mid', tier: 3, position: { x: 4500, z: 4500 } },

  { id: 'dire_bot_t1', team: 'dire', lane: 'bot', tier: 1, position: { x: 5500, z: -1500 } },
  { id: 'dire_bot_t2', team: 'dire', lane: 'bot', tier: 2, position: { x: 5500, z: 1500 } },
  { id: 'dire_bot_t3', team: 'dire', lane: 'bot', tier: 3, position: { x: 5000, z: 4000 } },

  { id: 'dire_base_t4_1', team: 'dire', lane: 'base', tier: 4, position: { x: 5500, z: 5000 } },
  { id: 'dire_base_t4_2', team: 'dire', lane: 'base', tier: 4, position: { x: 5000, z: 5500 } },
];

// ============================================
// Jungle Camp Positions
// ============================================

const CAMPS: CampPosition[] = [
  // Radiant jungle camps
  { id: 'radiant_easy_1', name: 'Small Camp', team: 'radiant', position: { x: -3000, z: -2000 }, respawnTime: 60, difficulty: 'easy' },
  { id: 'radiant_medium_1', name: 'Medium Camp', team: 'radiant', position: { x: -4000, z: -500 }, respawnTime: 60, difficulty: 'medium' },
  { id: 'radiant_hard_1', name: 'Large Camp', team: 'radiant', position: { x: -2500, z: 1000 }, respawnTime: 60, difficulty: 'hard' },
  { id: 'radiant_ancient', name: 'Ancient Camp', team: 'radiant', position: { x: -4500, z: 2000 }, respawnTime: 120, difficulty: 'ancient' },

  // Dire jungle camps
  { id: 'dire_easy_1', name: 'Small Camp', team: 'dire', position: { x: 3000, z: 2000 }, respawnTime: 60, difficulty: 'easy' },
  { id: 'dire_medium_1', name: 'Medium Camp', team: 'dire', position: { x: 4000, z: 500 }, respawnTime: 60, difficulty: 'medium' },
  { id: 'dire_hard_1', name: 'Large Camp', team: 'dire', position: { x: 2500, z: -1000 }, respawnTime: 60, difficulty: 'hard' },
  { id: 'dire_ancient', name: 'Ancient Camp', team: 'dire', position: { x: 4500, z: -2000 }, respawnTime: 120, difficulty: 'ancient' },

  // River objectives
  { id: 'river_boss', name: 'River Boss', team: 'neutral', position: { x: 0, z: 0 }, respawnTime: 300, difficulty: 'ancient' },
];

// ============================================
// Spawn Points
// ============================================

const SPAWNS: SpawnPoint[] = [
  {
    id: 'radiant_spawn',
    team: 'radiant',
    position: { x: -6000, z: -6000 },
    radius: 500,
  },
  {
    id: 'dire_spawn',
    team: 'dire',
    position: { x: 6000, z: 6000 },
    radius: 500,
  },
];

// ============================================
// Main Map Configuration
// ============================================

export const MAIN_MAP: MapConfig = {
  id: 'main',
  name: 'Battlefield',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  regions: REGIONS,
  obstacles: OBSTACLES,
  lanes: LANES,
  towers: TOWERS,
  camps: CAMPS,
  spawns: SPAWNS,
};

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRectangle(point: Point2D, rect: Rectangle): boolean {
  // For rotated rectangles, we'd need more complex math
  // For now, assume axis-aligned
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.z >= rect.z &&
    point.z <= rect.z + rect.height
  );
}

/**
 * Check if a point is inside a circle
 */
export function isPointInCircle(point: Point2D, circle: Circle): boolean {
  const dx = point.x - circle.x;
  const dz = point.z - circle.z;
  return dx * dx + dz * dz <= circle.radius * circle.radius;
}

/**
 * Check if a point collides with an obstacle
 */
export function collidesWithObstacle(point: Point2D, obstacle: Obstacle): boolean {
  if (!obstacle.blocksMovement) return false;

  if (obstacle.shape === 'circle') {
    return isPointInCircle(point, obstacle.bounds as Circle);
  } else {
    return isPointInRectangle(point, obstacle.bounds as Rectangle);
  }
}

/**
 * Check if a point collides with any obstacle in the map
 */
export function collidesWithAnyObstacle(point: Point2D, obstacles: Obstacle[]): Obstacle | null {
  for (const obstacle of obstacles) {
    if (collidesWithObstacle(point, obstacle)) {
      return obstacle;
    }
  }
  return null;
}

/**
 * Get the region at a given point
 */
export function getRegionAtPoint(point: Point2D, regions: Region[]): Region | null {
  for (const region of regions) {
    if (isPointInRectangle(point, region.bounds)) {
      return region;
    }
  }
  return null;
}

/**
 * Get spawn position for a team with random offset
 */
export function getSpawnPosition(team: MapTeam, spawns: SpawnPoint[]): Point2D {
  const spawn = spawns.find(s => s.team === team);
  if (!spawn) {
    return { x: 0, z: 0 };
  }

  // Add random offset within spawn radius
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * spawn.radius;

  return {
    x: spawn.position.x + Math.cos(angle) * distance,
    z: spawn.position.z + Math.sin(angle) * distance,
  };
}

/**
 * Get distance between two points
 */
export function getDistance(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check if line segment intersects with circle
 */
export function lineIntersectsCircle(
  start: Point2D,
  end: Point2D,
  circle: Circle
): boolean {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const fx = start.x - circle.x;
  const fz = start.z - circle.z;

  const a = dx * dx + dz * dz;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - circle.radius * circle.radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

/**
 * Get nearest point on lane to a given position
 */
export function getNearestLaneWaypoint(
  position: Point2D,
  lane: Lane,
  team: MapTeam
): LaneWaypoint | null {
  const waypoints = team === 'radiant' ? lane.waypoints.radiant : lane.waypoints.dire;
  let nearestWaypoint: LaneWaypoint | null = null;
  let nearestDistance = Infinity;

  for (const waypoint of waypoints) {
    const distance = getDistance(position, waypoint);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestWaypoint = waypoint;
    }
  }

  return nearestWaypoint;
}
