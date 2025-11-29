/**
 * Ability Lore Data
 *
 * Contains lore quotes from ABILITY_TOOLTIPS.md for display in ability tooltips.
 * These flavor texts add narrative depth to each ability.
 */

export interface AbilityLoreEntry {
  flavorText: string;
}

export const ABILITY_LORE: Record<string, AbilityLoreEntry> = {
  // =============================================================================
  // IRONCLAD - The Unbreakable Shield
  // =============================================================================
  ironclad_q: {
    flavorText: '"A shield is not a wall. A wall blocks. A shield answers."',
  },
  ironclad_w: {
    flavorText: '"Steel shall not fail me. Steel never betrays."',
  },
  ironclad_e: {
    flavorText: '"Out of my way. Or through you."',
  },
  ironclad_r: {
    flavorText: '"You may slay me. But I shall not move from this place."',
  },

  // =============================================================================
  // BLADEWARDEN - The Storm of Steel
  // =============================================================================
  bladewarden_q: {
    flavorText: '"Grace or Vengeance? It matters not - both are swifter than you."',
  },
  bladewarden_w: {
    flavorText: '"Do you hear it? This is the song you have awaited all your life."',
  },
  bladewarden_e: {
    flavorText: '"Your strength? Now mine."',
  },
  bladewarden_r: {
    flavorText: '"For all who fell for your amusement... HERE IS YOUR REWARD!"',
  },

  // =============================================================================
  // SYLARA - The Lifebringer
  // =============================================================================
  sylara_q: {
    flavorText: '"Remember... who you were, before the world wounded you."',
  },
  sylara_w: {
    flavorText: '"I breathe for you. I breathe with you. I breathe through you."',
  },
  sylara_e: {
    flavorText: '"The forest remembers. The forest protects. The forest... does not release."',
  },
  sylara_r: {
    flavorText: '"Greatmother, lend me your light. Let those who fight for life know not death this day!"',
  },

  // =============================================================================
  // VEX - The Venomous Hunter
  // =============================================================================
  vex_q: {
    flavorText: '"From my mother I learned to heal. From the world - to kill."',
  },
  vex_w: {
    flavorText: '"You cannot see me. No one ever has."',
  },
  vex_e: {
    flavorText: '"Feel that tingling? That is the last thing you will ever feel."',
  },
  vex_r: {
    flavorText: '"I chased you through hell itself. Do you think I will stop here?"',
  },

  // =============================================================================
  // MAGNUS - The Gravity Mage
  // =============================================================================
  magnus_q: {
    flavorText: '"I see you. I always see you. And I shall never cease my apology."',
  },
  magnus_w: {
    flavorText: '"The law decrees: all things fall. The law does not specify where."',
  },
  magnus_e: {
    flavorText: '"Gravity is a suggestion. And I am very persuasive."',
  },
  magnus_r: {
    flavorText: '"I have seen the end of the world. It was black. And silent. And very, very close."',
  },

  // =============================================================================
  // GRIMJAW - The Berserker
  // =============================================================================
  grimjaw_q: {
    flavorText: '"BLOOD! MORE BLOOD!"',
  },
  grimjaw_w: {
    flavorText: '"GROK KNOWS NO FEAR! GROK IS FEAR!"',
  },
  grimjaw_e: {
    flavorText: '"DEMON TRIED TO EAT GROK. GROK ATE DEMON!"',
  },
  grimjaw_r: {
    flavorText: '"GROK DOES NOT DIE! GROK KILLS! AND KILLS! AND KILLS UNTIL NOTHING STANDS!"',
  },

  // =============================================================================
  // VALERIA - The Radiant Shield
  // =============================================================================
  valeria_q: {
    flavorText: '"Through light. For light. In light."',
  },
  valeria_w: {
    flavorText: '"Faith is my shield. Faith shall not fail me."',
  },
  valeria_e: {
    flavorText: '"I see what you are. And the light shall judge you."',
  },
  valeria_r: {
    flavorText: '"HEAVENS, HEAR MY PRAYER! LET LIGHT PURIFY THIS WORLD!"',
  },

  // =============================================================================
  // HEX - The Curse Weaver
  // =============================================================================
  hex_q: {
    flavorText: '"I burned. Now it is your turn."',
  },
  hex_w: {
    flavorText: '"Your loved ones. Your friends. Where are they now? Nowhere. Like mine."',
  },
  hex_e: {
    flavorText: '"This is where I died. Three times. Join me."',
  },
  hex_r: {
    flavorText: '"THREE TIMES YOU SLEW ME. AND THREE TIMES I RETURNED. NOW YOU SHALL SEE WHAT CAME BACK WITH ME."',
  },

  // =============================================================================
  // PYRALIS - The Flame Incarnate
  // =============================================================================
  pyralis_q: {
    flavorText: '"The sun dreams of touching the world. I am its dream."',
  },
  pyralis_w: {
    flavorText: '"I breathe. The world burns. I am sorry. And I am not sorry."',
  },
  pyralis_e: {
    flavorText: '"Catch me. Catch the wind. Catch a thought. Impossible? Yes."',
  },
  pyralis_r: {
    flavorText: '"FOR ONE MOMENT... I AM THE SUN!"',
  },

  // =============================================================================
  // NIGHTSHADE - The Shadow Reaper
  // =============================================================================
  nightshade_q: {
    flavorText: '"..."',
  },
  nightshade_w: {
    flavorText: '"Home..."',
  },
  nightshade_e: {
    flavorText: '"I do not want to. But I must."',
  },
  nightshade_r: {
    flavorText: '"You have been chosen. I am sorry."',
  },

  // =============================================================================
  // THORNWEAVER - The Living Fortress
  // =============================================================================
  thornweaver_q: {
    flavorText: '"Every thorn. Every wound. Remembered."',
  },
  thornweaver_w: {
    flavorText: '"A thousand years. A thousand winters. A thousand storms. And still I stand."',
  },
  thornweaver_e: {
    flavorText: '"The earth remembers. And the earth does not release."',
  },
  thornweaver_r: {
    flavorText: '"THE GREATMOTHER AWAKENS! TREMBLE, YOU WHO HAVE HARMED HER CHILDREN!"',
  },

  // =============================================================================
  // FROSTBORNE - The Frozen Heart
  // =============================================================================
  frostborne_q: {
    flavorText: '"Cold? It is merely the memory of warmth."',
  },
  frostborne_w: {
    flavorText: '"Stay there. There it is warm. Here there is only cold."',
  },
  frostborne_e: {
    flavorText: '"Sleep. Dreams are warmer than the world you know."',
  },
  frostborne_r: {
    flavorText: '"ENOUGH. ENOUGH OF WARMTH. ENOUGH OF PAIN. NOW THERE SHALL BE ONLY SILENCE."',
  },

  // =============================================================================
  // ZEPHYR - The Wind Spirit
  // =============================================================================
  zephyr_q: {
    flavorText: '"It blows! It always blows! And it shall never cease!"',
  },
  zephyr_w: {
    flavorText: '"Go! Run! Fly! The wind is with you!"',
  },
  zephyr_e: {
    flavorText: '"Wings that I have carried! Aid me now!"',
  },
  zephyr_r: {
    flavorText: '"I AM SORRY! TRULY SORRY! BUT YOU MUST FEEL WHAT THE WIND CAN DO WHEN IT GROWS ANGRY!"',
  },

  // =============================================================================
  // SCOURGE - The Demon Prince
  // =============================================================================
  scourge_q: {
    flavorText: '"The Abyss remembers. So do I."',
  },
  scourge_w: {
    flavorText: '"You tried to kill me. You made me stronger."',
  },
  scourge_e: {
    flavorText: '"DO YOU HEAR THAT? THAT IS THE SOUND OF FREEDOM! AND IT HURTS!"',
  },
  scourge_r: {
    flavorText: '"LOOK UPON ME! LOOK UPON WHAT I WAS! LOOK UPON WHAT... I STILL AM."',
  },
};

/**
 * Get lore for an ability by its ID
 */
export function getAbilityLore(abilityId: string): AbilityLoreEntry | undefined {
  return ABILITY_LORE[abilityId];
}
