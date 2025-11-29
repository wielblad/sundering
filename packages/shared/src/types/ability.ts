import type { DamageType } from './hero';

export type AbilityTargetType =
  | 'self'
  | 'point'
  | 'unit'
  | 'direction'
  | 'area'
  | 'passive';

export type AbilitySlot = 'Q' | 'W' | 'E' | 'R' | 'passive';

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  slot: AbilitySlot;
  targetType: AbilityTargetType;
  damageType: DamageType | null;

  // Costs & Cooldowns
  manaCost: number[];       // Per level [1, 2, 3, 4, 5]
  cooldown: number[];       // Per level in seconds
  castTime: number;         // Seconds (0 for instant)

  // Range & Area
  range: number;
  radius?: number;          // For AoE abilities

  // Damage/Healing values per level
  baseDamage?: number[];
  scalingAD?: number;       // % of Attack Damage
  scalingAP?: number;       // % of Spell Power

  // Visual
  iconPath: string;
  effectPath?: string;      // VFX asset path
}

export interface AbilityState {
  abilityId: string;
  level: number;            // 0 = not learned
  currentCooldown: number;  // 0 = ready
  isActive: boolean;        // For toggles/channels
}
