export type Faction = 'mystical' | 'human';
export type HeroRole = 'tank' | 'mage' | 'warrior' | 'healer' | 'assassin';
export type AttackType = 'melee' | 'ranged';
export type DamageType = 'physical' | 'magical' | 'pure';

export interface HeroStats {
  // Base Stats
  maxHealth: number;
  maxMana: number;
  healthRegen: number;      // per second
  manaRegen: number;        // per second

  // Offense
  attackDamage: number;
  attackSpeed: number;      // attacks per second
  attackRange: number;      // units
  spellPower: number;       // magic damage multiplier (1.0 = 100%)

  // Defense
  armor: number;            // physical damage reduction
  magicResist: number;      // magic damage reduction

  // Mobility
  moveSpeed: number;        // units per second
}

export interface HeroScaling {
  healthPerLevel: number;
  manaPerLevel: number;
  healthRegenPerLevel: number;
  manaRegenPerLevel: number;
  attackDamagePerLevel: number;
  armorPerLevel: number;
  magicResistPerLevel: number;
}

export interface HeroDefinition {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  role: HeroRole;
  attackType: AttackType;
  difficulty: 1 | 2 | 3;    // 1 = Easy, 3 = Hard
  baseStats: HeroStats;
  scaling: HeroScaling;
  abilities: string[];      // Ability IDs
  lore: string;
  shortDescription: string;
  splashArt: string;        // Asset path
  modelPath: string;        // 3D model path
}

export interface HeroState {
  heroId: string;
  level: number;
  currentHealth: number;
  currentMana: number;
  position: { x: number; y: number; z: number };
  rotation: number;
  isAlive: boolean;
  respawnTime: number;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  gold: number;
  experience: number;
}
