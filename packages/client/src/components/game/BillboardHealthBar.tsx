/**
 * BillboardHealthBar Component
 *
 * A 3D health bar that always faces the camera (billboard effect).
 * Uses Three.js useFrame hook to continuously update rotation.
 *
 * Features:
 * - Always faces the camera regardless of entity rotation
 * - Player name display
 * - Health bar with gradient coloring
 * - Mana bar for ALL units (teammates and enemies)
 * - Team-colored styling
 * - Larger, more visible bars
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { Html } from '@react-three/drei';

// Note: useRef, useFrame, useThree, Group, Vector3 are still used by BillboardHealthBar3D below

interface BillboardHealthBarProps {
  position: [number, number, number];
  currentHealth: number;
  maxHealth: number;
  currentMana?: number;
  maxMana?: number;
  name?: string;
  team: 'radiant' | 'dire';
  isAlive: boolean;
  showMana?: boolean; // Now defaults to true for all units
  isMe?: boolean;
  level?: number;
}

export default function BillboardHealthBar({
  position,
  currentHealth,
  maxHealth,
  currentMana = 0,
  maxMana = 0,
  name,
  team,
  isAlive,
  showMana = true, // Now shows mana for ALL units by default
  isMe = false,
  level,
}: BillboardHealthBarProps) {
  if (!isAlive) return null;

  const healthPercent = maxHealth > 0 ? Math.max(0, Math.min(1, currentHealth / maxHealth)) : 0;
  const manaPercent = maxMana > 0 ? Math.max(0, Math.min(1, currentMana / maxMana)) : 0;

  // Health bar color based on percentage
  const getHealthColor = () => {
    if (healthPercent > 0.6) return '#22c55e'; // Green
    if (healthPercent > 0.3) return '#f59e0b'; // Amber/yellow
    return '#ef4444'; // Red
  };

  // Team colors
  const teamBorderColor = team === 'radiant' ? 'border-green-500' : 'border-red-500';
  const teamTextColor = team === 'radiant' ? 'text-green-400' : 'text-red-400';

  return (
    <group position={position}>
      {/* HTML overlay - sprite mode: always faces camera, fixed screen size */}
      <Html
        center
        occlude={false}
        sprite
        zIndexRange={[0, 0]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'scale(0.5) translate(-200px, -200px)',
        }}
      >
        <div className="flex flex-col items-center gap-1.5 min-w-[200px]">
          {/* Player name and level */}
          {name && (
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded
              bg-slate-900/90 backdrop-blur-sm
              ${isMe ? 'border-2 border-human-500/70' : 'border border-slate-600/50'}
            `}>
              {level !== undefined && (
                <span className="text-base font-bold text-human-400 bg-slate-800 px-2 py-0.5 rounded">
                  {level}
                </span>
              )}
              <span className={`text-base font-semibold ${isMe ? 'text-human-400' : teamTextColor}`}>
                {name}
              </span>
            </div>
          )}

          {/* Health bar container - MUCH LARGER */}
          <div className={`
            w-48 h-6 bg-slate-900/95 rounded overflow-hidden
            border-2 ${teamBorderColor} border-opacity-70
            shadow-lg
          `}>
            {/* Health fill */}
            <div
              className="h-full transition-all duration-200 ease-out"
              style={{
                width: `${healthPercent * 100}%`,
                background: `linear-gradient(90deg, ${getHealthColor()}dd, ${getHealthColor()})`,
                boxShadow: `0 0 10px ${getHealthColor()}66`,
              }}
            />
          </div>

          {/* Mana bar - MUCH LARGER and shown for ALL units */}
          {showMana && maxMana > 0 && (
            <div className="w-48 h-4 bg-slate-900/95 rounded overflow-hidden border border-blue-500/50 shadow-md">
              <div
                className="h-full transition-all duration-200 ease-out"
                style={{
                  width: `${manaPercent * 100}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  boxShadow: '0 0 8px #3b82f666',
                }}
              />
            </div>
          )}

          {/* Health/Mana numbers for current player */}
          {isMe && (
            <div className="flex gap-4 text-sm font-mono">
              <span className="text-green-400">
                {Math.floor(currentHealth)}/{maxHealth}
              </span>
              {maxMana > 0 && (
                <span className="text-blue-400">
                  {Math.floor(currentMana)}/{maxMana}
                </span>
              )}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

/**
 * CreepHealthBar - Small health-only bar for creeps
 * Much smaller than player health bars, no name/mana
 */
interface CreepHealthBarProps {
  position: [number, number, number];
  currentHealth: number;
  maxHealth: number;
  team: 'radiant' | 'dire';
  isAlive: boolean;
}

export function CreepHealthBar({
  position,
  currentHealth,
  maxHealth,
  team,
  isAlive,
}: CreepHealthBarProps) {
  if (!isAlive) return null;

  const healthPercent = maxHealth > 0 ? Math.max(0, Math.min(1, currentHealth / maxHealth)) : 0;

  // Team colors - health bar always matches team color
  const teamColor = team === 'radiant' ? '#22c55e' : '#ef4444';
  const teamBorderColor = team === 'radiant' ? 'border-green-500/50' : 'border-red-500/50';

  return (
    <group position={position}>
      <Html
        center
        occlude={false}
        sprite
        zIndexRange={[0, 0]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'scale(0.35) translate(-100px, -50px)',
        }}
      >
        {/* Health bar only - small and compact */}
        <div className={`
          w-20 h-2 bg-slate-900/90 rounded-sm overflow-hidden
          border ${teamBorderColor}
        `}>
          <div
            className="h-full transition-all duration-150 ease-out"
            style={{
              width: `${healthPercent * 100}%`,
              background: teamColor,
            }}
          />
        </div>
      </Html>
    </group>
  );
}

/**
 * Simple 3D mesh-based billboard health bar (alternative without HTML)
 * Uses actual 3D geometry for better performance with many entities
 */
export function BillboardHealthBar3D({
  position,
  currentHealth,
  maxHealth,
  team,
  isAlive,
}: Omit<BillboardHealthBarProps, 'currentMana' | 'maxMana' | 'name' | 'showMana' | 'isMe' | 'level'>) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();

  // Billboard effect
  useFrame(() => {
    if (groupRef.current) {
      const cameraPos = new Vector3();
      camera.getWorldPosition(cameraPos);
      groupRef.current.lookAt(cameraPos);
    }
  });

  if (!isAlive) return null;

  const healthPercent = maxHealth > 0 ? Math.max(0, Math.min(1, currentHealth / maxHealth)) : 0;
  const barWidth = 80;
  const barHeight = 10;

  // Health color
  const healthColor = healthPercent > 0.6
    ? '#22c55e'
    : healthPercent > 0.3
      ? '#f59e0b'
      : '#ef4444';

  const teamColor = team === 'radiant' ? '#22c55e' : '#ef4444';

  return (
    <group ref={groupRef} position={position}>
      {/* Background bar */}
      <mesh>
        <boxGeometry args={[barWidth, barHeight, 4]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>

      {/* Health fill */}
      <mesh position={[(healthPercent - 1) * barWidth / 2, 0, 1]}>
        <boxGeometry args={[barWidth * healthPercent, barHeight - 2, 4]} />
        <meshBasicMaterial color={healthColor} />
      </mesh>

      {/* Team indicator border */}
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[barWidth + 4, barHeight + 4, 2]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
