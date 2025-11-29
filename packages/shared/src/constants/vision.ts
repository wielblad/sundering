/**
 * Vision / Fog of War Configuration
 *
 * Defines vision ranges, fog settings, and visibility rules.
 */

// Vision ranges by entity type
export const VISION_CONFIG = {
  // Hero base vision (day/night would vary this in a full implementation)
  heroVisionRange: 1800,  // Standard hero vision radius
  heroVisionRangeReduced: 800,  // Vision range when blinded

  // Structure vision
  towerVisionRange: 1200,  // Tower provides vision around it
  ancientVisionRange: 1000, // Base structures

  // Creep/Monster vision
  creepVisionRange: 800,
  jungleMonsterVisionRange: 400,

  // Special vision
  wardVisionRange: 1600,  // If we add wards later
  trueSightRange: 900,    // Reveals invisible units

  // Ghost marker (last known position) duration
  ghostMarkerDuration: 5000, // 5 seconds

  // Update frequency
  visionUpdateInterval: 100, // ms between vision updates (10 times per second)
};

// Visibility states
export type VisibilityState = 'visible' | 'fog' | 'hidden';

/**
 * Calculates if a point is visible from another point
 */
export function isInVisionRange(
  viewerX: number,
  viewerZ: number,
  targetX: number,
  targetZ: number,
  visionRange: number
): boolean {
  const dx = targetX - viewerX;
  const dz = targetZ - viewerZ;
  const distanceSquared = dx * dx + dz * dz;
  return distanceSquared <= visionRange * visionRange;
}

/**
 * Calculate distance between two points for vision checks
 */
export function getVisionDistance(
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check if a target is visible to a team based on their vision providers
 */
export interface VisionProvider {
  x: number;
  z: number;
  visionRange: number;
  team: 'radiant' | 'dire';
  isAlive?: boolean;
}

export function isVisibleToTeam(
  targetX: number,
  targetZ: number,
  targetTeam: 'radiant' | 'dire',
  viewerTeam: 'radiant' | 'dire',
  visionProviders: VisionProvider[]
): boolean {
  // Same team is always visible
  if (targetTeam === viewerTeam) {
    return true;
  }

  // Check if any vision provider on the viewer's team can see the target
  for (const provider of visionProviders) {
    if (provider.team !== viewerTeam) continue;
    if (provider.isAlive === false) continue;

    if (isInVisionRange(provider.x, provider.z, targetX, targetZ, provider.visionRange)) {
      return true;
    }
  }

  return false;
}
