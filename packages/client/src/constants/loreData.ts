/**
 * Lore Data Constants
 *
 * Centralized lore content extracted from lore-workshop files:
 * - MASTER_LORE_PLAN.md - Hero biographies, world history, factions
 * - LEGENDARY_ITEMS.md - Item histories, whispers, previous owners
 *
 * Used across Landing Page, Hero Selection, Item Shop, and other UI components.
 */

// =============================================================================
// FACTION THEMING
// =============================================================================

export interface FactionTheme {
  name: string;
  philosophy: string;
  philosophyQuote: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
  tags: string[];
  description: string;
  tragedy: string;
  warObjective: string;
}

export const FACTION_THEMES: Record<string, FactionTheme> = {
  mystical: {
    name: 'Mystical Forces',
    philosophy: 'Magic Is Life',
    philosophyQuote:
      'For the Mystics, magic is not a tool - it is the very essence of existence. Without magic, the world will become an empty shell, a place where nothing blooms, nothing dreams, nothing truly lives.',
    primaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
    glowColor: 'rgba(79, 70, 229, 0.4)',
    gradientFrom: 'from-mystical-900',
    gradientTo: 'to-indigo-900',
    tags: ['Magic', 'Elements', 'Nature', 'Spirits'],
    description:
      'The Mystic Council protects primordial magic from annihilation. They are ancient beings of pure magical essence who once shaped the lands from chaos.',
    tragedy:
      'Many among the Mystics remember the times when humans and magic lived in harmony. Some believe this harmony can be restored. But they are in the minority.',
    warObjective:
      'Cleanse the Nexus, even if it requires the sacrifice of human civilization. In their eyes, this is not evil - it is surgical amputation to save the body.',
  },
  human: {
    name: 'Human Alliance',
    philosophy: 'The Future Belongs to Us',
    philosophyQuote:
      'Humans did not choose to be mortals. Did not choose to be weaker than the Ancients. But they chose not to go gently into that good night. If magic means their annihilation - they will destroy magic.',
    primaryColor: '#f59e0b',
    accentColor: '#d97706',
    glowColor: 'rgba(185, 28, 28, 0.4)',
    gradientFrom: 'from-human-900',
    gradientTo: 'to-orange-900',
    tags: ['Might', 'Technology', 'Will', 'Innovation'],
    description:
      'The Human Alliance defends the right of mortals to self-determination. From the first spark of steel against stone, humanity has carved its destiny through ingenuity and will.',
    tragedy:
      'Many humans hate magic because they lost loved ones to the Shadow Plague or the Reaping. But there are also those who remember that not all mystical beings are enemies.',
    warObjective:
      'Destroy or secure the Nexus from the Mystic Council. They believe a controlled Nexus can grant humanity immortality without annihilation.',
  },
};

// =============================================================================
// WORLD HISTORY - ERAS
// =============================================================================

export interface WorldEra {
  name: string;
  period: string;
  description: string;
  keyEvents: string[];
}

export const WORLD_ERAS: WorldEra[] = [
  {
    name: 'The Era of First Dawn',
    period: '10,000 years before the conflict',
    description:
      'When the world was young, the Ancients - beings of pure magical essence - shaped the lands from chaos. They forged mountains from frozen tears, oceans from spilled moonlight, and forests from the breath of wind. Magic was not a tool - it was the very fabric of reality.',
    keyEvents: [
      'The Ancients shaped the world from chaos',
      'Mountains forged from frozen tears',
      'The Nexus was created - the heart of the world',
      'Magic became the fabric of reality',
    ],
  },
  {
    name: 'The Era of Awakening',
    period: '8,000 years before the conflict',
    description:
      'From the dust of the earth arose the first humans. Initially they lived in harmony with magic, and the Ancients observed them with fascination. Humans were different - short-lived yet full of fire, weak yet unyielding.',
    keyEvents: [
      'First humans arose from the dust',
      'Humans and magic lived in harmony',
      'The Ancients observed with fascination',
      'Humans discovered their gift: Creation',
    ],
  },
  {
    name: 'The Era of First Schism',
    period: '5,000 years before the conflict',
    description:
      'The first conflict erupted when humans discovered how to extract magic from the earth. The first essence mines were established, and with them - the first wounds in the fabric of the world.',
    keyEvents: [
      'Humans discovered essence extraction',
      'First mines wounded the world',
      'The Mystic Council warned humanity',
      'The First Pact was established',
    ],
  },
  {
    name: 'The Era of the Fall',
    period: '1,000 years before the conflict',
    description:
      'Human civilization reached its zenith of power. The Solar Empire stretched across the world. But human ambition knew no bounds. Emperor Valdris III commanded: seize the Nexus.',
    keyEvents: [
      'The Solar Empire rose to power',
      'Discovery of the Ancient Truth',
      'The Battle for the Heart of the World',
      'Half the continent collapsed into the abyss',
    ],
  },
  {
    name: 'The Era of Silence',
    period: '1,000 years of stillness',
    description:
      'A thousand years passed in shadow. Humans rebuilt civilization from ashes. The Ancients withdrew to the depths. But in the darkness, within the Fracture of the Nexus, the Shadow Plague grew.',
    keyEvents: [
      'Humanity rebuilt from ashes',
      'The Ancients withdrew to heal',
      'The Shadow Plague began to grow',
      'The world slowly poisoned',
    ],
  },
  {
    name: 'The Era of Awakening',
    period: 'Present Day',
    description:
      'Three hundred years ago, the first signs of the Plague reached the surface. The Mystic Council made a desperate decision: awaken the slumbering Ancients. Humans call it the Reaping. Thus began the Eternal Conflict.',
    keyEvents: [
      'The Shadow Plague emerged',
      'The Mystic Council awakened champions',
      'Humans formed the Alliance',
      'The Eternal Conflict began',
    ],
  },
];

// =============================================================================
// HERO LORE - Extended biographies from MASTER_LORE_PLAN.md
// =============================================================================

export interface HeroLore {
  trueName: string;
  age: string;
  origin: string;
  historyExcerpt: string;
  character: string[];
  keyQuote: string;
  relationshipsTeaser: string;
}

export const HERO_LORE: Record<string, HeroLore> = {
  ironclad: {
    trueName: 'Torvin Ironhorn',
    age: '47 years (appears 35 - a side effect of the armor he wears)',
    origin: 'The Northern Citadel - a fortress forged into an icy peak',
    historyExcerpt:
      'Torvin was born the son of a blacksmith in the Northern Citadel. When he was twenty years old, the Citadel was attacked by the Shadow Horde. Torvin stood at the Northern Gate for three days and three nights. His armor absorbed so much demonic energy that it fused with his body. Now he cannot remove it. Nor can he die of old age.',
    character: [
      'Silent, but when he speaks - people listen',
      'Chronic pessimist ("We will all die. But not today.")',
      'Secretly writes poetry (poorly)',
      'Hates magic but respects magical warriors',
    ],
    keyQuote:
      'A shield does not win battles. A shield buys time. And sometimes time is all those behind you need.',
    relationshipsTeaser:
      'Shares a brotherhood with Bladewarden - the silent and the talkative make perfect complements.',
  },
  bladewarden: {
    trueName: 'Kael Two-Blades',
    age: '34 years',
    origin: 'The Free City of Argentum - capital of gladiators',
    historyExcerpt:
      'Kael was a child of the streets. At fourteen, he was sold to the arena. Over the next ten years, he won two hundred and forty-two duels. He earned the title of Blade Master, his freedom, and two swords forged from a meteorite - Grace and Vengeance. Then he discovered that the owner of the arena was his father.',
    character: [
      'Seemingly carefree and talkative',
      'Beneath the surface: immense guilt',
      'Never strikes first - waits for the opponent',
      'Has nightmares of defeated gladiators asking "why?"',
    ],
    keyQuote:
      'Two blades. One for grace, one for vengeance. I always offer a choice. They always choose vengeance.',
    relationshipsTeaser:
      'Recognizes the street rat in Vex. Tries to protect her from her own thirst for revenge.',
  },
  sylara: {
    trueName: 'Sylara of the Eternal Grove',
    age: 'Unknown (appears 25, but remembers the First Pact)',
    origin: 'The Eternal Grove - a forest that exists in no particular place',
    historyExcerpt:
      'Sylara is a paradox. A spirit of nature who fights alongside humans against her own kin. She was born when the first ray of sunlight touched the first leaf of the first tree. When the Mystic Council declared the Reaping, Sylara objected. For her defiance, she was exiled.',
    character: [
      'Patient as a forest (literally)',
      'Deeply sad, but does not show it',
      'Believes in the goodness of every being',
      'Has a tendency to speak in riddles',
    ],
    keyQuote:
      'Healing is not giving life. It is reminding the body that it wishes to live.',
    relationshipsTeaser:
      'Thornweaver was her former friend from the Grove. Now an enemy. This hurts most of all.',
  },
  vex: {
    trueName: 'Unknown (she abandoned it long ago)',
    age: '23 years',
    origin: 'The Slums of the Forsaken - the district beneath the Free City of Argentum',
    historyExcerpt:
      'Vex was born in a place where sunlight does not reach. Her mother was a healer who died to the Shadow Plague. Vex decided the world that allowed her mother to die would pay. Her specialty: poisons extracted from mushrooms growing on Plague victims.',
    character: [
      'Cold and calculating on the outside',
      'Inside: immense rage and sorrow',
      'Kills quickly and cleanly - dislikes suffering',
      'Has a weakness for street children',
    ],
    keyQuote:
      'Venom is an honest death. Swift. Silent. More than most victims ever received from life.',
    relationshipsTeaser:
      'Bladewarden tries to "save" her. Irritating. But... kind?',
  },
  magnus: {
    trueName: 'Magister Aurelius Graviton',
    age: '67 years (appears 40 - gravity slows aging)',
    origin: "The Academy of Seven Towers - humanity's highest institution of magic",
    historyExcerpt:
      'Aurelius was a genius. At twenty, he accidentally created a micro-black hole that consumed an entire wing of the Academy. Forty magisters perished, including his mentor. He spent forty years trying to reverse his mistake. He failed. But he became the most powerful gravity mage in history.',
    character: [
      'Painfully eccentric',
      'Talks to himself (and to gravity)',
      'Brilliant but socially awkward',
      'Haunted by visions of those he killed',
    ],
    keyQuote:
      'Gravity does not attract. Space bends. Everything merely falls into the pit it created for itself.',
    relationshipsTeaser:
      'The only one who understands him intellectually is Frostborne. They share theoretical discussions about the physics of magic.',
  },
  grimjaw: {
    trueName: 'Grok (no surname - barbarians do not use them)',
    age: '35 years (or 40, he does not remember)',
    origin: 'The Tribe of Blood Snow - nomads from the Frozen Wastes',
    historyExcerpt:
      'Grok was born during a storm that killed half the tribe. At sixteen, he killed his first demon with his bare hands, literally tore out its jaw and wears it to this day as a trophy. His blood is poisonous to himself, but in battle it releases hormones that make him nearly indestructible.',
    character: [
      'Simple as an axe',
      'Does not understand subtlety',
      'Surprisingly loyal to companions',
      'Deep down, fears dying alone',
    ],
    keyQuote: 'Talking too long. Fighting quick. Grok prefers fight.',
    relationshipsTeaser:
      'Ironclad is the only one who matches him in close combat. Warriors respect.',
  },
  valeria: {
    trueName: 'Dame Valeria of the Order of Dawn',
    age: '29 years',
    origin: 'The Monastery of Radiant Dawn - a fortress-temple upon the Hill of First Morning',
    historyExcerpt:
      'Valeria was an orphan abandoned at the gates of the monastery. At twenty, during the Rite of Purification, she experienced a vision - a future where the Shadow Plague consumes everything. And a voice that said: "Only a pure heart can close the Fracture."',
    character: [
      'Unwavering faith (sometimes blind)',
      'Strict but just',
      'Does not kill if she need not',
      'Battles doubts every night',
    ],
    keyQuote: 'Faith is not certainty. Faith is fighting despite the doubts.',
    relationshipsTeaser:
      'Her greatest secret: during the vision, she heard the word "daughter." Her mother lives. And she is on the side of the Mystics.',
  },
  hex: {
    trueName: 'Elara Thrice-Burned',
    age: 'Unknown (appears anywhere from 30-50 depending on her mood)',
    origin: 'The Village of Frost\'s Edge - burned by the Order of Dawn for "heresy"',
    historyExcerpt:
      'Elara was an ordinary herbalist. The Order of Dawn accused her of consorting with darkness. They burned her three times. The third time, they used holy fire. What rose from the ashes the third time was no longer Elara. It was Hex - a being of hatred and bitterness.',
    character: [
      'Sarcastic to a painful degree',
      'Hates everyone equally (almost)',
      'Has moments of strange tenderness - rescues animals',
      'Probably mad (but can one blame her?)',
    ],
    keyQuote:
      'Three times you burned me. Now I shall burn your world. Slowly. Curse by curse.',
    relationshipsTeaser:
      'Hatred for Valeria so pure it is almost beautiful. Valeria represents everything Hex lost.',
  },
  pyralis: {
    trueName: 'None. Fire needs no name.',
    age: 'Has existed since the first flame burst from the heart of the world.',
    origin: 'The Heart of the Volcano of First Fire',
    historyExcerpt:
      'Pyralis is an elemental - an essence of fire that gained consciousness. The Mystic Council awakened him when the Shadow Plague began extinguishing the fires of the world. For a being of fire, this was the apocalypse.',
    character: [
      'Impulsive (literally - he is a flame)',
      'Fascinated by humans - so fragile, yet so hot within',
      'Incapable of lying - fire does not lie',
      'Sometimes lonely - fire eventually consumes everything around it',
    ],
    keyQuote:
      'Fire does not hate the wood it burns. Such is its nature. Such is mine.',
    relationshipsTeaser:
      'Frostborne is his opposite. Hatred? No. Fascination. How can fire hate ice when without it, it would never know what warmth is?',
  },
  nightshade: {
    trueName: 'Unknown (they say speaking it aloud summons death)',
    age: 'Unknown (shadows do not measure time)',
    origin: 'The Realm of Shadows - a dimension between worlds',
    historyExcerpt:
      'Nightshade was not born. She was created - forged from shadow itself by the Lords of Darkness. During one mission, she saw a child crying over its mother\'s body. She hesitated. The Lords of Darkness do not tolerate hesitation.',
    character: [
      'Cold and impersonal on the outside',
      'Inside: chaos of questions without answers',
      'Kills quickly and cleanly - considers prolonging death to be cruelty',
      'Has a weakness for children (never kills them)',
    ],
    keyQuote:
      'Shadow is not the absence of light. Shadow is what light leaves behind.',
    relationshipsTeaser:
      'Bladewarden and she remember each other from the arena. Different paths.',
  },
  thornweaver: {
    trueName: 'Rowan of a Thousand Roots',
    age: '847 years',
    origin: 'The Primordial Grove - a forest older than human memory',
    historyExcerpt:
      'Rowan was once a human druid. When the Solar Empire marched upon the Nexus, the druids tried to stop them. Dying, Rowan embraced the oldest tree - the Great Oak - and begged for strength. Over eight centuries, Rowan and the Oak became one.',
    character: [
      'Stern and merciless',
      'Speaks slowly, as if every word must pass through ages',
      'Despises human "brevity of life"',
      'Deep within - infinitely weary, but too stubborn to cease',
    ],
    keyQuote:
      'Eight centuries. That was enough for the forest to forget human treachery. But I remember. And I will never forget.',
    relationshipsTeaser:
      'Sylara was his former friend. Now a traitor. Her choice pains him more than he will admit.',
  },
  frostborne: {
    trueName: 'Isira of the Eternal Glaciers',
    age: 'Unknown (ice does not measure time)',
    origin: 'The Glacier of First Frost',
    historyExcerpt:
      'Isira was once human. During the Great Winter, the elders offered her to the Spirit of Winter. She was bound to the glacier and left. But she did not die. The Spirit offered her a choice: death by warmth or life in cold. Isira chose the cold.',
    character: [
      'Calm as the surface of a frozen lake',
      'Speaks quietly, but every word carries weight',
      'Fascinated by emotions - she cannot fully feel them',
      'A mysterious longing for something she does not remember',
    ],
    keyQuote:
      'Ice is not the absence of warmth. Ice is patience frozen in waiting.',
    relationshipsTeaser:
      'Pyralis is her opposite. Attraction. Repulsion. A dance that has lasted for ages.',
  },
  zephyr: {
    trueName: 'Zephyr (the wind does not lie about its name)',
    age: 'As old as the first breath of the world, as young as the last breeze',
    origin: 'Nowhere and Everywhere - the wind has no home',
    historyExcerpt:
      'Zephyr is wind itself, which gained consciousness when the first mortal whispered a wish into a storm. Unlike other elementals, Zephyr does not wish to destroy. He prefers to whisper rather than scream. To lift rather than cast down.',
    character: [
      'Playful and light (literally)',
      'Incapable of staying in one place',
      'Collects stories - asks everyone he meets for a tale',
      'A secret romantic - believes in love more than in war',
    ],
    keyQuote:
      'The wind does not remember where it blows from. It remembers only where it carries.',
    relationshipsTeaser:
      'Close friends with Sylara. They meet in secret to dream of a world without war.',
  },
  scourge: {
    trueName: 'Malachar, the Third Evil',
    age: 'Older than sin, younger than redemption',
    origin: 'The Infernal Abyss - a dimension of destruction',
    historyExcerpt:
      'Malachar was a prince of the demon realm. He had everything - power, armies, an eternity of suffering to inflict. But he wanted something more. He wanted to feel. He began to experiment with mercy. His father exiled him.',
    character: [
      'Brutal yet strangely honorable',
      'Never lies (demons cannot)',
      'Fascinated by human emotions',
      'Deep within: desperate hope for redemption',
    ],
    keyQuote:
      'I betrayed the Abyss for this world. I will betray this world for answers. I will betray everything to feel something real.',
    relationshipsTeaser:
      'Grimjaw and he share mutual hatred. Grok kills demons. Scourge is a demon. Simple.',
  },
};

// =============================================================================
// ITEM LORE - From LEGENDARY_ITEMS.md
// =============================================================================

export interface ItemLore {
  trueName: string;
  history: string;
  whisper: string;
  previousOwners?: string[];
  narrativeEffect?: string;
}

export const ITEM_LORE: Record<string, ItemLore> = {
  // Basic Items
  long_sword: {
    trueName: 'The First Step',
    history:
      'In the forges of the Free Cities, every blacksmith\'s apprentice must craft their first sword. It cannot be too ornate, too large, too ambitious. It must simply be... functional. These humble swords find their way to the front lines of the Eternal Conflict.',
    whisper: 'I am the beginning. What grows from me - that depends on you.',
  },
  cloth_armor: {
    trueName: 'The Last Layer',
    history:
      'Warriors from the slums cannot afford steel. Instead, they wear armor of cloth - dozens of layers stitched so tightly together that they become nearly as hard as metal. They say each layer is a story.',
    whisper: 'I carry the stories of those who loved you. Fight for them.',
  },
  ruby_crystal: {
    trueName: 'Clot of the Nexus',
    history:
      'When the Nexus was wounded a thousand years ago, part of its essence congealed into crystals. Ruby crystals pulse with inner light and extend the lives of those who bear them. But there is a price.',
    whisper: 'Live longer. Fight harder. And then... return to me.',
  },
  sapphire_crystal: {
    trueName: 'Tear of the Council',
    history:
      'When the Mystical Council proclaimed the Harvest, one of the Ancients stood in opposition. His name was erased from history, but his tears - frozen into crystals - endured.',
    whisper: 'Power has a price. Mine was solitude. What will yours be?',
  },
  amplifying_tome: {
    trueName: 'Fragment of the Lost Library',
    history:
      'Before the Battle for the Heart of the World, there existed the Lost Library - a place where all the world\'s knowledge was preserved. It burned during the battle, but fragments of its tomes survived.',
    whisper: 'I was part of everything. Now I am part of you.',
  },
  dagger: {
    trueName: 'The Silent Friend',
    history:
      'In the slums, they say the dagger is the most honest weapon. It pretends to be nothing it is not. It promises no glory. It is sharp, short, and personal.',
    whisper: 'Close. Quiet. Effective. That is how I work. That is how you work.',
  },
  boots: {
    trueName: 'Gift of the Wanderer',
    history:
      'There is a legend of the Wanderer - a being who has walked the world since the dawn of time. They say it leaves boots behind. Worn, ordinary boots. But anyone who puts them on feels a surge of energy.',
    whisper:
      'The road is long. But with every step, you draw closer to your destination.',
  },

  // Advanced Items
  vampiric_scepter: {
    trueName: 'Legacy of Count Vornak',
    history:
      'Count Vornak was the last of the vampires. When the Order of Dawn slaughtered his bloodline, Vornak fled and changed. Instead of drinking blood, he learned to extract life essence through objects.',
    whisper: 'Blood for blood. Life for life. Such is the pact.',
    previousOwners: [
      'Count Vornak (creator) - vanished',
      'Dame Eliza the Bloody - slain by her own scepter',
      'Sir Mortis of Shadows - lost in the Northern Jungle',
    ],
  },
  chain_vest: {
    trueName: 'Chain of Brothers',
    history:
      'During the Siege of the Silver Gate, a company of twenty knights linked their chainmail into a single, colossal shield. For three days they held the gate. Eighteen perished. Two survived. And their chainmail fused into one.',
    whisper: 'You are not alone. You were never alone. We fight with you.',
  },
  phage: {
    trueName: 'Heart of the Berserker',
    history:
      'Somewhere in the north, there lived a berserker who could not stop. When at last he died (of old age, a miracle for a berserker), his heart still beat. Alchemists extracted its essence.',
    whisper: 'Standing still? MOVE! Resting? FIGHT! Alive? THEN RUN!',
  },

  // Legendary Items
  bloodthirster: {
    trueName: '"Thirst" - Blade of Tyrant Valdor III',
    history:
      'Tyrant Valdor III was the architect of the Battle for the Heart of the World. The sword was forged a year before the battle. A thousand prisoners gave their blood to temper the steel. Their souls still inhabit the blade.',
    whisper:
      'Are you hungry? So am I. Feed me, and I shall feed you. A fair exchange... is it not?',
    previousOwners: [
      'Tyrant Valdor III (creator) - slain by his own sword',
      'General Krios the Bloody - went mad, killed his own soldiers',
      'Unknown bounty hunter - found dead, smiling',
      'Dame Seria of the Order - the only one to abandon the sword and survive',
    ],
    narrativeEffect:
      'The bearer hears whispers in the night. Sometimes sees faces - a thousand prisoners who died so the blade could be born.',
  },
  trinity_force: {
    trueName: 'Fusion of Three Worlds',
    history:
      'Before the Eternal Conflict, in the days of the First Pact, three masters - one human, one mystical, one... other - created an artifact symbolizing unity. Trinity Force was meant to prove that cooperation was possible.',
    whisper: 'Three paths. One road. We were one. We could be again.',
    previousOwners: [
      'The Three First Masters (creators) - fate unknown',
      'Empress Lyanna the Unifier - united the continent, died alone',
      'King-Mage Eryndor - tried to restore the Pact, killed by his own',
    ],
    narrativeEffect:
      'The bearer sometimes sees visions - moments when humans and mystical beings lived in harmony.',
  },
  thornmail: {
    trueName: '"Vengeance of the Grove" - Armor of the First Druid',
    history:
      'After the massacre of the Ancient Grove, one druid survived. For a year he gathered thorns. Every thorn from every bush that perished. And then he bound them into armor. Thornmail remembers every wound.',
    whisper: 'We remember. Every axe. Every flame. Every wound. And we repay.',
    previousOwners: [
      'The First Druid (creator) - vanished, likely became a Thornweaver',
      'The Forest Mother - surrendered the armor when she ceased to fight',
      'Guardian Arlena - wore it for a hundred years before the forest absorbed her',
    ],
    narrativeEffect:
      'The bearer hears the whispers of trees. Feels pain at every tree felled, anywhere in the world.',
  },
  rabadons_deathcap: {
    trueName: 'Crown of the Madman',
    history:
      'Archmage Rabadon was a genius who saw the structure of magic as others see the color of the sky. The problem was that magic also saw him. He created a crown to control the flow of power. It worked. Too well. Rabadon went mad.',
    whisper:
      'Do you want to know more? I can show you. Do you want to see the truth? Open your eyes. OPEN. YOUR. EYES.',
    previousOwners: [
      'Archmage Rabadon (creator) - went mad',
      'Grand Mage Elyndra - went mad',
      'Master Illusionist Varen - went mad',
      'Everyone who wore the crown longer than a year - went mad',
    ],
    narrativeEffect:
      'The bearer sees more than they should. Lines of power. The structure of reality. The thoughts of others.',
  },
  warmogs_armor: {
    trueName: 'Plate of the Eternal March',
    history:
      'In the depths beneath the Northern Citadel lies an army. Thousands of soldiers who fell during the Siege of Demons. Their souls did not depart. They march in circles, day and night, for a thousand years.',
    whisper: 'March. March. March. We know not where. But we must go.',
    narrativeEffect:
      'The bearer cannot sleep peacefully. They dream of endless corridors, endless marching.',
  },
  spirit_visage: {
    trueName: 'Shield of the First Dawn',
    history:
      'When the world was young, the first sun did not shine. The First Hero climbed into the sky and embraced the sun. When they returned to earth, their skin blazed with eternal fire. They left their armor - a fragment of the sun sealed in metal.',
    whisper:
      'Burn. Not for yourself - for them. This is the burden we bear. This is the price we pay.',
    narrativeEffect:
      'The bearer is warm. Always warm. Even on the coldest night. But also lonely.',
  },

  // Consumables
  health_potion: {
    trueName: 'Tear of Life',
    history:
      'Every health potion contains a drop of essence from the Tree of Life - a legendary plant growing at the heart of the Eternal Grove. Sylara taught alchemists how to extract this essence without harming the tree.',
    whisper: '',
    narrativeEffect:
      'The drinker feels a moment of warmth - as if someone were holding them.',
  },
  mana_potion: {
    trueName: 'Echo of the Nexus',
    history:
      'When the Nexus bleeds, part of its essence seeps into the earth. Alchemists have learned to collect this essence and condense it into potions. Every mana potion is a fragment of the very heart of the world.',
    whisper: '',
    narrativeEffect:
      'The drinker hears a whisper - an echo of the Nexus, pleading for healing.',
  },
};

// =============================================================================
// ROLE ICONS AND DESCRIPTIONS
// =============================================================================

export interface RoleInfo {
  name: string;
  description: string;
  playstyle: string;
}

export const ROLE_INFO: Record<string, RoleInfo> = {
  tank: {
    name: 'Tank',
    description: 'Frontline defenders with high durability',
    playstyle: 'Absorb damage and protect your team. Initiate fights and peel for carries.',
  },
  warrior: {
    name: 'Warrior',
    description: 'Versatile fighters with damage and durability',
    playstyle:
      'Deal sustained damage while surviving in the thick of battle. Dominate the front line.',
  },
  mage: {
    name: 'Mage',
    description: 'Spell casters with devastating magical damage',
    playstyle:
      'Unleash powerful abilities from range. Control team fights with area effects.',
  },
  healer: {
    name: 'Healer',
    description: 'Support champions who sustain allies',
    playstyle:
      'Keep your team alive with healing and protective abilities. Enable aggressive plays.',
  },
  assassin: {
    name: 'Assassin',
    description: 'High mobility killers who eliminate priority targets',
    playstyle:
      'Pick off isolated enemies. Strike from the shadows and escape before retaliation.',
  },
};

// =============================================================================
// BATTLEFIELD LOCATIONS
// =============================================================================

export interface BattlefieldLocation {
  name: string;
  description: string;
  lore: string;
}

export const BATTLEFIELD_LOCATIONS: Record<string, BattlefieldLocation> = {
  nexus: {
    name: 'The Nexus',
    description: 'The pulsing heart of the world',
    lore: 'A crystalline tower rising toward the heavens, entwined with veins of pure energy. At its base - the Fracture - the wound inflicted a thousand years ago, from which the Shadow Plague seeps.',
  },
  upper_lane: {
    name: 'The Iron Trail',
    description: 'Ruins of the ancient Imperial forge',
    lore: 'Here, anti-magic blades were wrought. The earth is dead, marked with metallic streaks. The ghosts of smiths still forge invisible blades.',
  },
  mid_lane: {
    name: 'The Road of Bones',
    description: 'The most direct route to the Nexus',
    lore: 'Here lie the bones of millions who fell in the Battle for the Heart of the World. They say that at night, the bones whisper.',
  },
  lower_lane: {
    name: 'The Drowning Mire',
    description: 'Once forests, now submerged in toxic swamp',
    lore: 'The Shadow Plague corrupted the waters here. Mushrooms grow here, glowing with pale light - the only source of orientation in the eternal fog.',
  },
  river: {
    name: 'The River of Souls',
    description: 'Flows through the center of the battlefield',
    lore: 'Its waters glow with a pale, bluish light - the souls of the fallen who cannot find peace. Drinking from it grants visions of past and future... and madness.',
  },
  dragon_lair: {
    name: "The Dragon's Lair",
    description: 'Home of the Elder Dragon',
    lore: 'Deep within the southern jungle. The only being who remembers the times before the Ancients. Whoever defeats it gains its blessing.',
  },
};
