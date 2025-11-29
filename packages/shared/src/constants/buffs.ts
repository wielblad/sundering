/**
 * Buff/Debuff System
 *
 * Status effects that can be applied to heroes, towers, and creeps.
 * Buffs are positive effects, debuffs are negative effects.
 */

// ============================================
// Type Definitions
// ============================================

export type BuffType =
  | 'stun'        // Cannot move, attack, or cast abilities
  | 'slow'        // Reduced movement speed
  | 'root'        // Cannot move, but can attack/cast
  | 'silence'     // Cannot cast abilities
  | 'disarm'      // Cannot auto-attack
  | 'blind'       // Attacks have chance to miss
  | 'poison'      // Damage over time (physical)
  | 'burn'        // Damage over time (magical)
  | 'bleed'       // Damage over time (physical, based on AD)
  | 'shield'      // Absorbs damage
  | 'heal_over_time' // Heals over time
  | 'haste'       // Increased movement speed
  | 'attack_speed_buff' // Increased attack speed
  | 'attack_speed_debuff' // Decreased attack speed
  | 'damage_buff' // Increased damage dealt
  | 'damage_debuff' // Decreased damage dealt
  | 'armor_buff'  // Increased armor
  | 'armor_debuff' // Decreased armor (armor reduction)
  | 'magic_resist_buff' // Increased magic resist
  | 'magic_resist_debuff' // Decreased magic resist
  | 'invulnerable' // Cannot take damage
  | 'untargetable' // Cannot be targeted
  | 'stealth'     // Invisible to enemies
  | 'revealed';   // Cannot be invisible

export type BuffCategory = 'buff' | 'debuff' | 'crowd_control' | 'dot' | 'shield';

export interface BuffDefinition {
  id: string;
  name: string;
  type: BuffType;
  category: BuffCategory;
  description: string;
  icon?: string;

  // Effect values (can be overridden by individual applications)
  defaultDuration: number; // seconds
  defaultValue?: number; // e.g., slow percentage, DoT damage per tick
  tickInterval?: number; // seconds between ticks (for DoT/HoT)

  // Stacking behavior
  stackable: boolean;
  maxStacks?: number;
  refreshDuration: boolean; // Does reapplication refresh duration?

  // Visual/audio
  particleEffect?: string;
  soundEffect?: string;
}

export interface AppliedBuff {
  id: string; // Unique instance ID
  buffId: string; // Reference to BuffDefinition
  type: BuffType;
  sourceId: string; // Who applied this buff (player ID, tower ID, etc.)
  targetId: string; // Who has this buff
  startTime: number; // When buff was applied (timestamp)
  duration: number; // Total duration in seconds
  remainingDuration: number; // Updated each tick
  value: number; // Effect value (slow %, damage per tick, etc.)
  stacks: number; // Current stack count
  tickInterval?: number; // For DoT/HoT effects
  lastTickTime?: number; // Last time DoT/HoT ticked
}

// ============================================
// Buff Definitions
// ============================================

export const BUFFS: Record<string, BuffDefinition> = {
  // Crowd Control
  stun: {
    id: 'stun',
    name: 'Stunned',
    type: 'stun',
    category: 'crowd_control',
    description: 'Cannot move, attack, or use abilities',
    defaultDuration: 1.5,
    stackable: false,
    refreshDuration: true,
  },
  slow: {
    id: 'slow',
    name: 'Slowed',
    type: 'slow',
    category: 'crowd_control',
    description: 'Movement speed reduced by {value}%',
    defaultDuration: 2,
    defaultValue: 30, // 30% slow
    stackable: false, // Strongest slow takes precedence
    refreshDuration: true,
  },
  root: {
    id: 'root',
    name: 'Rooted',
    type: 'root',
    category: 'crowd_control',
    description: 'Cannot move',
    defaultDuration: 1.5,
    stackable: false,
    refreshDuration: true,
  },
  silence: {
    id: 'silence',
    name: 'Silenced',
    type: 'silence',
    category: 'crowd_control',
    description: 'Cannot use abilities',
    defaultDuration: 2,
    stackable: false,
    refreshDuration: true,
  },
  disarm: {
    id: 'disarm',
    name: 'Disarmed',
    type: 'disarm',
    category: 'crowd_control',
    description: 'Cannot auto-attack',
    defaultDuration: 2,
    stackable: false,
    refreshDuration: true,
  },

  // Damage Over Time
  poison: {
    id: 'poison',
    name: 'Poisoned',
    type: 'poison',
    category: 'dot',
    description: 'Taking {value} physical damage every second',
    defaultDuration: 5,
    defaultValue: 20, // damage per tick
    tickInterval: 1,
    stackable: true,
    maxStacks: 3,
    refreshDuration: true,
  },
  burn: {
    id: 'burn',
    name: 'Burning',
    type: 'burn',
    category: 'dot',
    description: 'Taking {value} magical damage every second',
    defaultDuration: 3,
    defaultValue: 30, // damage per tick
    tickInterval: 1,
    stackable: true,
    maxStacks: 3,
    refreshDuration: true,
  },
  bleed: {
    id: 'bleed',
    name: 'Bleeding',
    type: 'bleed',
    category: 'dot',
    description: 'Taking physical damage over time',
    defaultDuration: 4,
    defaultValue: 15, // base damage per tick
    tickInterval: 0.5,
    stackable: true,
    maxStacks: 5,
    refreshDuration: true,
  },

  // Shields and Heals
  shield: {
    id: 'shield',
    name: 'Shielded',
    type: 'shield',
    category: 'shield',
    description: 'Absorbing up to {value} damage',
    defaultDuration: 4,
    defaultValue: 200, // shield amount
    stackable: false, // Shields don't stack, highest takes precedence
    refreshDuration: false,
  },
  heal_over_time: {
    id: 'heal_over_time',
    name: 'Regenerating',
    type: 'heal_over_time',
    category: 'buff',
    description: 'Restoring {value} health every second',
    defaultDuration: 5,
    defaultValue: 25, // heal per tick
    tickInterval: 1,
    stackable: false,
    refreshDuration: true,
  },

  // Stat Buffs
  haste: {
    id: 'haste',
    name: 'Haste',
    type: 'haste',
    category: 'buff',
    description: 'Movement speed increased by {value}%',
    defaultDuration: 3,
    defaultValue: 30, // 30% speed boost
    stackable: false,
    refreshDuration: true,
  },
  attack_speed_buff: {
    id: 'attack_speed_buff',
    name: 'Attack Speed Up',
    type: 'attack_speed_buff',
    category: 'buff',
    description: 'Attack speed increased by {value}%',
    defaultDuration: 5,
    defaultValue: 25,
    stackable: false,
    refreshDuration: true,
  },
  attack_speed_debuff: {
    id: 'attack_speed_debuff',
    name: 'Attack Speed Down',
    type: 'attack_speed_debuff',
    category: 'debuff',
    description: 'Attack speed decreased by {value}%',
    defaultDuration: 3,
    defaultValue: 25,
    stackable: false,
    refreshDuration: true,
  },
  damage_buff: {
    id: 'damage_buff',
    name: 'Damage Up',
    type: 'damage_buff',
    category: 'buff',
    description: 'Damage dealt increased by {value}%',
    defaultDuration: 5,
    defaultValue: 20,
    stackable: false,
    refreshDuration: true,
  },
  damage_debuff: {
    id: 'damage_debuff',
    name: 'Damage Down',
    type: 'damage_debuff',
    category: 'debuff',
    description: 'Damage dealt decreased by {value}%',
    defaultDuration: 3,
    defaultValue: 20,
    stackable: false,
    refreshDuration: true,
  },
  armor_buff: {
    id: 'armor_buff',
    name: 'Armor Up',
    type: 'armor_buff',
    category: 'buff',
    description: 'Armor increased by {value}',
    defaultDuration: 5,
    defaultValue: 30,
    stackable: false,
    refreshDuration: true,
  },
  armor_debuff: {
    id: 'armor_debuff',
    name: 'Armor Shred',
    type: 'armor_debuff',
    category: 'debuff',
    description: 'Armor reduced by {value}',
    defaultDuration: 4,
    defaultValue: 20,
    stackable: true,
    maxStacks: 3,
    refreshDuration: true,
  },
  magic_resist_debuff: {
    id: 'magic_resist_debuff',
    name: 'Magic Resist Down',
    type: 'magic_resist_debuff',
    category: 'debuff',
    description: 'Magic resist reduced by {value}',
    defaultDuration: 4,
    defaultValue: 15,
    stackable: true,
    maxStacks: 3,
    refreshDuration: true,
  },

  // Special States
  invulnerable: {
    id: 'invulnerable',
    name: 'Invulnerable',
    type: 'invulnerable',
    category: 'buff',
    description: 'Cannot take damage',
    defaultDuration: 2,
    stackable: false,
    refreshDuration: false,
  },
  untargetable: {
    id: 'untargetable',
    name: 'Untargetable',
    type: 'untargetable',
    category: 'buff',
    description: 'Cannot be targeted by enemies',
    defaultDuration: 1.5,
    stackable: false,
    refreshDuration: false,
  },
  stealth: {
    id: 'stealth',
    name: 'Invisible',
    type: 'stealth',
    category: 'buff',
    description: 'Invisible to enemies',
    defaultDuration: 5,
    stackable: false,
    refreshDuration: false,
  },
  revealed: {
    id: 'revealed',
    name: 'Revealed',
    type: 'revealed',
    category: 'debuff',
    description: 'Cannot become invisible',
    defaultDuration: 3,
    stackable: false,
    refreshDuration: true,
  },
};

// ============================================
// Buff Helper Functions
// ============================================

/**
 * Check if a buff type is crowd control
 */
export function isCrowdControl(type: BuffType): boolean {
  return ['stun', 'slow', 'root', 'silence', 'disarm', 'blind'].includes(type);
}

/**
 * Check if a buff prevents movement
 */
export function preventsMovement(type: BuffType): boolean {
  return ['stun', 'root'].includes(type);
}

/**
 * Check if a buff prevents attacking
 */
export function preventsAttacking(type: BuffType): boolean {
  return ['stun', 'disarm'].includes(type);
}

/**
 * Check if a buff prevents ability usage
 */
export function preventsAbilities(type: BuffType): boolean {
  return ['stun', 'silence'].includes(type);
}

/**
 * Check if a buff is a damage over time effect
 */
export function isDamageOverTime(type: BuffType): boolean {
  return ['poison', 'burn', 'bleed'].includes(type);
}

/**
 * Check if a buff is a heal over time effect
 */
export function isHealOverTime(type: BuffType): boolean {
  return type === 'heal_over_time';
}

/**
 * Get all buff types that affect movement speed
 */
export function affectsMovementSpeed(type: BuffType): boolean {
  return ['slow', 'haste'].includes(type);
}

/**
 * Create an applied buff instance
 */
export function createAppliedBuff(
  buffId: string,
  sourceId: string,
  targetId: string,
  overrides?: Partial<{ duration: number; value: number }>
): AppliedBuff | null {
  const definition = BUFFS[buffId];
  if (!definition) return null;

  const now = Date.now();
  const duration = overrides?.duration ?? definition.defaultDuration;
  const value = overrides?.value ?? definition.defaultValue ?? 0;

  return {
    id: `${buffId}_${sourceId}_${now}`,
    buffId,
    type: definition.type,
    sourceId,
    targetId,
    startTime: now,
    duration,
    remainingDuration: duration,
    value,
    stacks: 1,
    tickInterval: definition.tickInterval,
    lastTickTime: definition.tickInterval ? now : undefined,
  };
}

/**
 * Calculate total movement speed modifier from buffs
 * Returns a multiplier (e.g., 0.7 for 30% slow, 1.3 for 30% haste)
 */
export function calculateMoveSpeedModifier(buffs: AppliedBuff[]): number {
  let modifier = 1.0;

  for (const buff of buffs) {
    if (buff.type === 'slow') {
      // Slows are multiplicative (multiple slows stack diminishingly)
      modifier *= (1 - buff.value / 100);
    } else if (buff.type === 'haste') {
      // Hastes are additive
      modifier += buff.value / 100;
    }
  }

  // Cap minimum at 10% speed (hard slow cap)
  return Math.max(0.1, modifier);
}

/**
 * Calculate total attack speed modifier from buffs
 */
export function calculateAttackSpeedModifier(buffs: AppliedBuff[]): number {
  let modifier = 1.0;

  for (const buff of buffs) {
    if (buff.type === 'attack_speed_buff') {
      modifier += buff.value / 100;
    } else if (buff.type === 'attack_speed_debuff') {
      modifier *= (1 - buff.value / 100);
    }
  }

  // Cap between 20% and 300% attack speed
  return Math.max(0.2, Math.min(3.0, modifier));
}

/**
 * Calculate total armor modifier from buffs
 */
export function calculateArmorModifier(buffs: AppliedBuff[]): number {
  let modifier = 0;

  for (const buff of buffs) {
    if (buff.type === 'armor_buff') {
      modifier += buff.value * buff.stacks;
    } else if (buff.type === 'armor_debuff') {
      modifier -= buff.value * buff.stacks;
    }
  }

  return modifier;
}

/**
 * Calculate total magic resist modifier from buffs
 */
export function calculateMagicResistModifier(buffs: AppliedBuff[]): number {
  let modifier = 0;

  for (const buff of buffs) {
    if (buff.type === 'magic_resist_buff') {
      modifier += buff.value * buff.stacks;
    } else if (buff.type === 'magic_resist_debuff') {
      modifier -= buff.value * buff.stacks;
    }
  }

  return modifier;
}

/**
 * Calculate damage modifier from buffs
 */
export function calculateDamageModifier(buffs: AppliedBuff[]): number {
  let modifier = 1.0;

  for (const buff of buffs) {
    if (buff.type === 'damage_buff') {
      modifier += buff.value / 100;
    } else if (buff.type === 'damage_debuff') {
      modifier *= (1 - buff.value / 100);
    }
  }

  return Math.max(0.1, modifier);
}
