export interface ItemStats {
  health?: number;
  mana?: number;
  healthRegen?: number;
  manaRegen?: number;
  attackDamage?: number;
  abilityPower?: number;
  armor?: number;
  magicResist?: number;
  attackSpeed?: number;
  moveSpeed?: number;
  critChance?: number;
  lifesteal?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
  sellValue: number;
  category: 'basic' | 'advanced' | 'legendary';
  stats: ItemStats;
  buildsFrom?: string[]; // IDs of components
  buildsInto?: string[]; // IDs of items this can build into
  maxStack: number;
  passive?: string;
  active?: {
    name: string;
    description: string;
    cooldown: number;
  };
}

// Basic items (tier 1)
export const BASIC_ITEMS: Record<string, Item> = {
  long_sword: {
    id: 'long_sword',
    name: 'Long Sword',
    description: 'A basic sword that increases attack damage.',
    cost: 350,
    sellValue: 245,
    category: 'basic',
    stats: { attackDamage: 10 },
    buildsInto: ['vampiric_scepter', 'serrated_dirk', 'phage'],
    maxStack: 1,
  },
  cloth_armor: {
    id: 'cloth_armor',
    name: 'Cloth Armor',
    description: 'Provides basic armor protection.',
    cost: 300,
    sellValue: 210,
    category: 'basic',
    stats: { armor: 15 },
    buildsInto: ['chain_vest', 'ninja_tabi'],
    maxStack: 1,
  },
  null_magic_mantle: {
    id: 'null_magic_mantle',
    name: 'Null-Magic Mantle',
    description: 'Provides basic magic resistance.',
    cost: 450,
    sellValue: 315,
    category: 'basic',
    stats: { magicResist: 25 },
    buildsInto: ['negatron_cloak', 'hexdrinker'],
    maxStack: 1,
  },
  ruby_crystal: {
    id: 'ruby_crystal',
    name: 'Ruby Crystal',
    description: 'Increases maximum health.',
    cost: 400,
    sellValue: 280,
    category: 'basic',
    stats: { health: 150 },
    buildsInto: ['giants_belt', 'phage', 'kindlegem'],
    maxStack: 1,
  },
  sapphire_crystal: {
    id: 'sapphire_crystal',
    name: 'Sapphire Crystal',
    description: 'Increases maximum mana.',
    cost: 350,
    sellValue: 245,
    category: 'basic',
    stats: { mana: 250 },
    buildsInto: ['sheen', 'glacial_shroud'],
    maxStack: 1,
  },
  amplifying_tome: {
    id: 'amplifying_tome',
    name: 'Amplifying Tome',
    description: 'Increases ability power.',
    cost: 435,
    sellValue: 304,
    category: 'basic',
    stats: { abilityPower: 20 },
    buildsInto: ['blasting_wand', 'fiendish_codex'],
    maxStack: 1,
  },
  boots: {
    id: 'boots',
    name: 'Boots',
    description: 'Slightly increases movement speed.',
    cost: 300,
    sellValue: 210,
    category: 'basic',
    stats: { moveSpeed: 25 },
    buildsInto: ['berserker_greaves', 'ninja_tabi', 'sorcerers_shoes', 'mercury_treads'],
    maxStack: 1,
  },
  dagger: {
    id: 'dagger',
    name: 'Dagger',
    description: 'Increases attack speed.',
    cost: 300,
    sellValue: 210,
    category: 'basic',
    stats: { attackSpeed: 0.12 },
    buildsInto: ['berserker_greaves', 'recurve_bow'],
    maxStack: 1,
  },
};

// Advanced items (tier 2)
export const ADVANCED_ITEMS: Record<string, Item> = {
  vampiric_scepter: {
    id: 'vampiric_scepter',
    name: 'Vampiric Scepter',
    description: 'Provides attack damage and lifesteal.',
    cost: 900,
    sellValue: 630,
    category: 'advanced',
    stats: { attackDamage: 15, lifesteal: 0.1 },
    buildsFrom: ['long_sword'],
    buildsInto: ['bloodthirster'],
    maxStack: 1,
  },
  chain_vest: {
    id: 'chain_vest',
    name: 'Chain Vest',
    description: 'Greatly increases armor.',
    cost: 800,
    sellValue: 560,
    category: 'advanced',
    stats: { armor: 40 },
    buildsFrom: ['cloth_armor'],
    buildsInto: ['thornmail', 'guardian_angel'],
    maxStack: 1,
  },
  negatron_cloak: {
    id: 'negatron_cloak',
    name: 'Negatron Cloak',
    description: 'Greatly increases magic resistance.',
    cost: 900,
    sellValue: 630,
    category: 'advanced',
    stats: { magicResist: 50 },
    buildsFrom: ['null_magic_mantle'],
    buildsInto: ['spirit_visage', 'abyssal_mask'],
    maxStack: 1,
  },
  giants_belt: {
    id: 'giants_belt',
    name: 'Giant\'s Belt',
    description: 'Greatly increases maximum health.',
    cost: 900,
    sellValue: 630,
    category: 'advanced',
    stats: { health: 350 },
    buildsFrom: ['ruby_crystal'],
    buildsInto: ['warmogs_armor', 'sunfire_cape'],
    maxStack: 1,
  },
  blasting_wand: {
    id: 'blasting_wand',
    name: 'Blasting Wand',
    description: 'Greatly increases ability power.',
    cost: 850,
    sellValue: 595,
    category: 'advanced',
    stats: { abilityPower: 40 },
    buildsFrom: ['amplifying_tome'],
    buildsInto: ['rabadons_deathcap', 'void_staff'],
    maxStack: 1,
  },
  phage: {
    id: 'phage',
    name: 'Phage',
    description: 'Provides health and attack damage. Grants move speed on hit.',
    cost: 1100,
    sellValue: 770,
    category: 'advanced',
    stats: { health: 200, attackDamage: 15 },
    buildsFrom: ['long_sword', 'ruby_crystal'],
    buildsInto: ['trinity_force', 'black_cleaver'],
    maxStack: 1,
    passive: 'Rage: Basic attacks grant 20 move speed for 2s.',
  },
  sheen: {
    id: 'sheen',
    name: 'Sheen',
    description: 'Enhances abilities with bonus damage on next attack.',
    cost: 1050,
    sellValue: 735,
    category: 'advanced',
    stats: { mana: 250 },
    buildsFrom: ['sapphire_crystal'],
    buildsInto: ['trinity_force', 'lich_bane'],
    maxStack: 1,
    passive: 'Spellblade: After using an ability, next attack deals 100% base AD bonus damage.',
  },
};

// Legendary items (tier 3)
export const LEGENDARY_ITEMS: Record<string, Item> = {
  bloodthirster: {
    id: 'bloodthirster',
    name: 'Bloodthirster',
    description: 'The ultimate lifesteal weapon.',
    cost: 3400,
    sellValue: 2380,
    category: 'legendary',
    stats: { attackDamage: 80, lifesteal: 0.2 },
    buildsFrom: ['vampiric_scepter'],
    maxStack: 1,
    passive: 'Lifesteal can overheal, granting a shield for the excess.',
  },
  rabadons_deathcap: {
    id: 'rabadons_deathcap',
    name: 'Rabadon\'s Deathcap',
    description: 'Massively amplifies ability power.',
    cost: 3600,
    sellValue: 2520,
    category: 'legendary',
    stats: { abilityPower: 120 },
    buildsFrom: ['blasting_wand'],
    maxStack: 1,
    passive: 'Increases ability power by 35%.',
  },
  trinity_force: {
    id: 'trinity_force',
    name: 'Trinity Force',
    description: 'Tons of damage with versatile stats.',
    cost: 3333,
    sellValue: 2333,
    category: 'legendary',
    stats: { health: 200, mana: 250, attackDamage: 25, attackSpeed: 0.4, moveSpeed: 20 },
    buildsFrom: ['phage', 'sheen'],
    maxStack: 1,
    passive: 'Spellblade: After using an ability, next attack deals 200% base AD bonus damage.',
  },
  warmogs_armor: {
    id: 'warmogs_armor',
    name: 'Warmog\'s Armor',
    description: 'Provides massive health and regeneration.',
    cost: 3000,
    sellValue: 2100,
    category: 'legendary',
    stats: { health: 800, healthRegen: 200 },
    buildsFrom: ['giants_belt'],
    maxStack: 1,
    passive: 'Warmog\'s Heart: Rapidly regenerate health out of combat.',
  },
  thornmail: {
    id: 'thornmail',
    name: 'Thornmail',
    description: 'Returns damage to attackers.',
    cost: 2700,
    sellValue: 1890,
    category: 'legendary',
    stats: { armor: 80, health: 350 },
    buildsFrom: ['chain_vest'],
    maxStack: 1,
    passive: 'Thorns: When hit by basic attacks, reflect 25 + 10% of armor as magic damage.',
  },
  spirit_visage: {
    id: 'spirit_visage',
    name: 'Spirit Visage',
    description: 'Amplifies healing received.',
    cost: 2900,
    sellValue: 2030,
    category: 'legendary',
    stats: { health: 450, magicResist: 60, healthRegen: 100 },
    buildsFrom: ['negatron_cloak'],
    maxStack: 1,
    passive: 'Increases all healing received by 25%.',
  },
  // Boots upgrades
  berserker_greaves: {
    id: 'berserker_greaves',
    name: 'Berserker\'s Greaves',
    description: 'Attack speed boots.',
    cost: 1100,
    sellValue: 770,
    category: 'legendary',
    stats: { attackSpeed: 0.35, moveSpeed: 45 },
    buildsFrom: ['boots', 'dagger'],
    maxStack: 1,
  },
  ninja_tabi: {
    id: 'ninja_tabi',
    name: 'Ninja Tabi',
    description: 'Armor boots that reduce basic attack damage.',
    cost: 1100,
    sellValue: 770,
    category: 'legendary',
    stats: { armor: 20, moveSpeed: 45 },
    buildsFrom: ['boots', 'cloth_armor'],
    maxStack: 1,
    passive: 'Reduces incoming basic attack damage by 12%.',
  },
  sorcerers_shoes: {
    id: 'sorcerers_shoes',
    name: 'Sorcerer\'s Shoes',
    description: 'Magic penetration boots.',
    cost: 1100,
    sellValue: 770,
    category: 'legendary',
    stats: { moveSpeed: 45 },
    buildsFrom: ['boots'],
    maxStack: 1,
    passive: '+18 Magic Penetration.',
  },
  mercury_treads: {
    id: 'mercury_treads',
    name: 'Mercury\'s Treads',
    description: 'Magic resistance boots with tenacity.',
    cost: 1100,
    sellValue: 770,
    category: 'legendary',
    stats: { magicResist: 25, moveSpeed: 45 },
    buildsFrom: ['boots', 'null_magic_mantle'],
    maxStack: 1,
    passive: '+30% Tenacity (reduces crowd control duration).',
  },
};

// Consumables
export const CONSUMABLE_ITEMS: Record<string, Item> = {
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 150 health over 15 seconds.',
    cost: 50,
    sellValue: 20,
    category: 'basic',
    stats: {},
    maxStack: 5,
    active: {
      name: 'Consume',
      description: 'Drink to restore 150 health over 15 seconds.',
      cooldown: 0,
    },
  },
  mana_potion: {
    id: 'mana_potion',
    name: 'Mana Potion',
    description: 'Restores 100 mana over 15 seconds.',
    cost: 50,
    sellValue: 20,
    category: 'basic',
    stats: {},
    maxStack: 5,
    active: {
      name: 'Consume',
      description: 'Drink to restore 100 mana over 15 seconds.',
      cooldown: 0,
    },
  },
};

// All items combined
export const ITEMS: Record<string, Item> = {
  ...BASIC_ITEMS,
  ...ADVANCED_ITEMS,
  ...LEGENDARY_ITEMS,
  ...CONSUMABLE_ITEMS,
};

// Item IDs by category for shop UI
export const ITEM_IDS = {
  basic: Object.keys(BASIC_ITEMS),
  advanced: Object.keys(ADVANCED_ITEMS),
  legendary: Object.keys(LEGENDARY_ITEMS),
  consumable: Object.keys(CONSUMABLE_ITEMS),
  all: Object.keys(ITEMS),
};

// Get total cost of an item (including components)
export function getItemTotalCost(itemId: string): number {
  const item = ITEMS[itemId];
  if (!item) return 0;

  let totalCost = item.cost;
  if (item.buildsFrom) {
    // If it has components, the cost is the recipe cost + component costs
    // The item.cost already represents the recipe cost for advanced/legendary items
    // Actually in our case, item.cost IS the total cost, so just return it
  }
  return totalCost;
}

// Check if player can afford an item
export function canAffordItem(itemId: string, gold: number, ownedItems: string[]): boolean {
  const item = ITEMS[itemId];
  if (!item) return false;

  // Calculate effective cost (subtract value of owned components)
  let effectiveCost = item.cost;
  if (item.buildsFrom) {
    for (const componentId of item.buildsFrom) {
      if (ownedItems.includes(componentId)) {
        const component = ITEMS[componentId];
        if (component) {
          effectiveCost -= component.cost;
        }
      }
    }
  }

  return gold >= effectiveCost;
}
