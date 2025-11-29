/**
 * A* Pathfinding Algorithm for MOBA Map Navigation
 *
 * Uses a grid-based approach for pathfinding around obstacles.
 * The map is divided into a grid, and nodes are marked as walkable or blocked.
 */

import { Point2D, Rectangle, Circle, MAIN_MAP, Obstacle } from '../constants/map';
import { BALANCE } from '../constants/config';

// Grid configuration
const GRID_CELL_SIZE = 100; // Size of each cell in world units
const GRID_WIDTH = Math.ceil(BALANCE.mapWidth / GRID_CELL_SIZE);
const GRID_HEIGHT = Math.ceil(BALANCE.mapHeight / GRID_CELL_SIZE);

// Node for A* algorithm
interface PathNode {
  x: number;
  z: number;
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to goal)
  f: number; // Total cost (g + h)
  parent: PathNode | null;
  walkable: boolean;
}

// Direction offsets for 8-directional movement
const DIRECTIONS = [
  { dx: 0, dz: -1, cost: 1 },     // North
  { dx: 1, dz: -1, cost: 1.414 }, // NE
  { dx: 1, dz: 0, cost: 1 },      // East
  { dx: 1, dz: 1, cost: 1.414 },  // SE
  { dx: 0, dz: 1, cost: 1 },      // South
  { dx: -1, dz: 1, cost: 1.414 }, // SW
  { dx: -1, dz: 0, cost: 1 },     // West
  { dx: -1, dz: -1, cost: 1.414 }, // NW
];

/**
 * Convert world coordinates to grid coordinates
 */
export function worldToGrid(worldX: number, worldZ: number): { gx: number; gz: number } {
  // Map center is at (0, 0), so we need to offset
  const halfWidth = BALANCE.mapWidth / 2;
  const halfHeight = BALANCE.mapHeight / 2;

  const gx = Math.floor((worldX + halfWidth) / GRID_CELL_SIZE);
  const gz = Math.floor((worldZ + halfHeight) / GRID_CELL_SIZE);

  return {
    gx: Math.max(0, Math.min(GRID_WIDTH - 1, gx)),
    gz: Math.max(0, Math.min(GRID_HEIGHT - 1, gz)),
  };
}

/**
 * Convert grid coordinates to world coordinates (center of cell)
 */
export function gridToWorld(gx: number, gz: number): Point2D {
  const halfWidth = BALANCE.mapWidth / 2;
  const halfHeight = BALANCE.mapHeight / 2;

  return {
    x: (gx * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2) - halfWidth,
    z: (gz * GRID_CELL_SIZE) + (GRID_CELL_SIZE / 2) - halfHeight,
  };
}

/**
 * Check if a grid cell overlaps with an obstacle
 */
function cellOverlapsObstacle(gx: number, gz: number, obstacle: Obstacle, padding: number = 50): boolean {
  if (!obstacle.blocksMovement) return false;

  const cellWorld = gridToWorld(gx, gz);
  const halfCell = GRID_CELL_SIZE / 2;

  // Cell bounds (as a rectangle)
  const cellLeft = cellWorld.x - halfCell;
  const cellRight = cellWorld.x + halfCell;
  const cellTop = cellWorld.z - halfCell;
  const cellBottom = cellWorld.z + halfCell;

  if (obstacle.shape === 'circle') {
    const circle = obstacle.bounds as Circle;
    const expandedRadius = circle.radius + padding;

    // Find closest point on cell to circle center
    const closestX = Math.max(cellLeft, Math.min(circle.x, cellRight));
    const closestZ = Math.max(cellTop, Math.min(circle.z, cellBottom));

    const dx = circle.x - closestX;
    const dz = circle.z - closestZ;
    const distSq = dx * dx + dz * dz;

    return distSq < expandedRadius * expandedRadius;
  } else {
    // Rectangle obstacle
    const rect = obstacle.bounds as Rectangle;
    const expandedRect = {
      x: rect.x - padding,
      z: rect.z - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };

    // Check rectangle-rectangle overlap
    return !(cellRight < expandedRect.x ||
             cellLeft > expandedRect.x + expandedRect.width ||
             cellBottom < expandedRect.z ||
             cellTop > expandedRect.z + expandedRect.height);
  }
}

/**
 * Build the navigation grid from the map obstacles
 */
export function buildNavigationGrid(playerRadius: number = 50): boolean[][] {
  const grid: boolean[][] = [];

  for (let gz = 0; gz < GRID_HEIGHT; gz++) {
    grid[gz] = [];
    for (let gx = 0; gx < GRID_WIDTH; gx++) {
      let walkable = true;

      // Check against all obstacles
      for (const obstacle of MAIN_MAP.obstacles) {
        if (cellOverlapsObstacle(gx, gz, obstacle, playerRadius)) {
          walkable = false;
          break;
        }
      }

      grid[gz][gx] = walkable;
    }
  }

  return grid;
}

// Cache the navigation grid
let cachedGrid: boolean[][] | null = null;

/**
 * Get or build the navigation grid (cached)
 */
export function getNavigationGrid(): boolean[][] {
  if (!cachedGrid) {
    cachedGrid = buildNavigationGrid();
  }
  return cachedGrid;
}

/**
 * Clear the cached navigation grid (call when obstacles change)
 */
export function clearNavigationGridCache(): void {
  cachedGrid = null;
}

/**
 * Heuristic function for A* (Euclidean distance)
 */
function heuristic(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * A* Pathfinding algorithm
 * Returns an array of world coordinates representing the path, or null if no path found
 */
export function findPath(
  startWorld: Point2D,
  endWorld: Point2D,
  maxIterations: number = 1000
): Point2D[] | null {
  const grid = getNavigationGrid();

  const start = worldToGrid(startWorld.x, startWorld.z);
  const end = worldToGrid(endWorld.x, endWorld.z);

  // Early exit if start or end is not walkable
  if (!grid[start.gz]?.[start.gx]) {
    // Try to find nearest walkable cell to start
    const nearestStart = findNearestWalkable(start.gx, start.gz, grid);
    if (!nearestStart) return null;
    start.gx = nearestStart.gx;
    start.gz = nearestStart.gz;
  }

  if (!grid[end.gz]?.[end.gx]) {
    // Try to find nearest walkable cell to end
    const nearestEnd = findNearestWalkable(end.gx, end.gz, grid);
    if (!nearestEnd) return null;
    end.gx = nearestEnd.gx;
    end.gz = nearestEnd.gz;
  }

  // If start and end are the same, return direct path
  if (start.gx === end.gx && start.gz === end.gz) {
    return [endWorld];
  }

  // Initialize nodes
  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: start.gx,
    z: start.gz,
    g: 0,
    h: heuristic(start.gx, start.gz, end.gx, end.gz),
    f: 0,
    parent: null,
    walkable: true,
  };
  startNode.f = startNode.g + startNode.h;

  openList.push(startNode);

  let iterations = 0;

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f cost
    let lowestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = openList.splice(lowestIdx, 1)[0];
    const currentKey = `${current.x},${current.z}`;

    // Check if we reached the goal
    if (current.x === end.gx && current.z === end.gz) {
      return reconstructPath(current, endWorld);
    }

    closedSet.add(currentKey);

    // Explore neighbors
    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.dx;
      const nz = current.z + dir.dz;
      const neighborKey = `${nx},${nz}`;

      // Check bounds
      if (nx < 0 || nx >= GRID_WIDTH || nz < 0 || nz >= GRID_HEIGHT) {
        continue;
      }

      // Check if walkable
      if (!grid[nz][nx]) {
        continue;
      }

      // Check if already processed
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // For diagonal movement, check if both adjacent cells are walkable
      if (dir.dx !== 0 && dir.dz !== 0) {
        if (!grid[current.z][nx] || !grid[nz][current.x]) {
          continue; // Can't cut corners
        }
      }

      const tentativeG = current.g + dir.cost;

      // Check if neighbor is in open list
      const existingIdx = openList.findIndex(n => n.x === nx && n.z === nz);

      if (existingIdx === -1) {
        // New node
        const neighbor: PathNode = {
          x: nx,
          z: nz,
          g: tentativeG,
          h: heuristic(nx, nz, end.gx, end.gz),
          f: 0,
          parent: current,
          walkable: true,
        };
        neighbor.f = neighbor.g + neighbor.h;
        openList.push(neighbor);
      } else if (tentativeG < openList[existingIdx].g) {
        // Found a better path
        openList[existingIdx].g = tentativeG;
        openList[existingIdx].f = tentativeG + openList[existingIdx].h;
        openList[existingIdx].parent = current;
      }
    }
  }

  // No path found
  return null;
}

/**
 * Find the nearest walkable cell to a given position
 */
function findNearestWalkable(
  gx: number,
  gz: number,
  grid: boolean[][],
  maxRadius: number = 10
): { gx: number; gz: number } | null {
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue; // Only check perimeter

        const nx = gx + dx;
        const nz = gz + dz;

        if (nx >= 0 && nx < GRID_WIDTH && nz >= 0 && nz < GRID_HEIGHT && grid[nz][nx]) {
          return { gx: nx, gz: nz };
        }
      }
    }
  }
  return null;
}

/**
 * Reconstruct the path from goal to start
 */
function reconstructPath(endNode: PathNode, endWorld: Point2D): Point2D[] {
  const path: Point2D[] = [];
  let current: PathNode | null = endNode;

  while (current !== null) {
    const worldPos = gridToWorld(current.x, current.z);
    path.unshift(worldPos);
    current = current.parent;
  }

  // Remove the start position (player is already there)
  if (path.length > 0) {
    path.shift();
  }

  // Replace the last position with the exact end position
  if (path.length > 0) {
    path[path.length - 1] = endWorld;
  } else {
    path.push(endWorld);
  }

  return path;
}

/**
 * Simplify a path by removing unnecessary waypoints (line-of-sight optimization)
 */
export function simplifyPath(path: Point2D[], playerRadius: number = 50): Point2D[] {
  if (path.length <= 2) return path;

  const simplified: Point2D[] = [path[0]];
  let currentIdx = 0;

  while (currentIdx < path.length - 1) {
    // Try to skip waypoints
    let furthestVisible = currentIdx + 1;

    for (let i = currentIdx + 2; i < path.length; i++) {
      if (hasLineOfSight(path[currentIdx], path[i], playerRadius)) {
        furthestVisible = i;
      } else {
        break;
      }
    }

    simplified.push(path[furthestVisible]);
    currentIdx = furthestVisible;
  }

  return simplified;
}

/**
 * Check if there's a clear line of sight between two points
 */
export function hasLineOfSight(from: Point2D, to: Point2D, playerRadius: number = 50): boolean {
  const grid = getNavigationGrid();

  // Sample points along the line
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.ceil(distance / (GRID_CELL_SIZE / 2));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const z = from.z + dz * t;

    const gridPos = worldToGrid(x, z);
    if (!grid[gridPos.gz]?.[gridPos.gx]) {
      return false;
    }
  }

  // Also check with player radius
  for (const obstacle of MAIN_MAP.obstacles) {
    if (!obstacle.blocksMovement) continue;

    if (lineIntersectsObstacle(from, to, obstacle, playerRadius)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a line segment intersects with an obstacle (including player radius)
 */
function lineIntersectsObstacle(from: Point2D, to: Point2D, obstacle: Obstacle, playerRadius: number): boolean {
  if (obstacle.shape === 'circle') {
    const circle = obstacle.bounds as Circle;
    const expandedRadius = circle.radius + playerRadius;

    // Line-circle intersection
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const fx = from.x - circle.x;
    const fz = from.z - circle.z;

    const a = dx * dx + dz * dz;
    const b = 2 * (fx * dx + fz * dz);
    const c = fx * fx + fz * fz - expandedRadius * expandedRadius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return false;

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  } else {
    // Rectangle - expand by player radius
    const rect = obstacle.bounds as Rectangle;
    const expanded = {
      x: rect.x - playerRadius,
      z: rect.z - playerRadius,
      width: rect.width + playerRadius * 2,
      height: rect.height + playerRadius * 2,
    };

    // Line-rectangle intersection using parametric clipping
    return lineIntersectsRect(from, to, expanded);
  }
}

/**
 * Check if a line segment intersects with a rectangle
 */
function lineIntersectsRect(
  from: Point2D,
  to: Point2D,
  rect: { x: number; z: number; width: number; height: number }
): boolean {
  // Check if either endpoint is inside
  if (pointInRect(from, rect) || pointInRect(to, rect)) return true;

  // Check intersection with each edge
  const rectRight = rect.x + rect.width;
  const rectBottom = rect.z + rect.height;

  // Check left edge
  if (lineIntersectsLine(from, to, { x: rect.x, z: rect.z }, { x: rect.x, z: rectBottom })) return true;
  // Check right edge
  if (lineIntersectsLine(from, to, { x: rectRight, z: rect.z }, { x: rectRight, z: rectBottom })) return true;
  // Check top edge
  if (lineIntersectsLine(from, to, { x: rect.x, z: rect.z }, { x: rectRight, z: rect.z })) return true;
  // Check bottom edge
  if (lineIntersectsLine(from, to, { x: rect.x, z: rectBottom }, { x: rectRight, z: rectBottom })) return true;

  return false;
}

function pointInRect(p: Point2D, rect: { x: number; z: number; width: number; height: number }): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width &&
         p.z >= rect.z && p.z <= rect.z + rect.height;
}

function lineIntersectsLine(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(b1, b2, a1)) return true;
  if (d2 === 0 && onSegment(b1, b2, a2)) return true;
  if (d3 === 0 && onSegment(a1, a2, b1)) return true;
  if (d4 === 0 && onSegment(a1, a2, b2)) return true;

  return false;
}

function direction(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p3.x - p1.x) * (p2.z - p1.z) - (p2.x - p1.x) * (p3.z - p1.z);
}

function onSegment(p1: Point2D, p2: Point2D, p: Point2D): boolean {
  return Math.min(p1.x, p2.x) <= p.x && p.x <= Math.max(p1.x, p2.x) &&
         Math.min(p1.z, p2.z) <= p.z && p.z <= Math.max(p1.z, p2.z);
}

// Export grid configuration for debugging/visualization
export const PATHFINDING_CONFIG = {
  GRID_CELL_SIZE,
  GRID_WIDTH,
  GRID_HEIGHT,
};
