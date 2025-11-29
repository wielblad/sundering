# PUNCH MOBA - Comprehensive UI/UX Redesign Plan

**Created:** 2025-11-28
**Author:** Senior Frontend Designer
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Design Vision](#design-vision)
4. [Redesign Areas](#redesign-areas)
5. [Lore Integration Strategy](#lore-integration-strategy)
6. [Implementation Priorities](#implementation-priorities)
7. [Technical Recommendations](#technical-recommendations)
8. [Component Architecture](#component-architecture)

---

## Executive Summary

This document outlines a comprehensive UI/UX redesign for PUNCH MOBA, transforming the current functional interface into an immersive, lore-rich experience befitting a fantasy MOBA. The redesign leverages the extensive world-building in the lore workshop files (MASTER_LORE_PLAN.md, VOICE_LINES.md, ABILITY_TOOLTIPS.md, LEGENDARY_ITEMS.md) to create a cohesive visual and narrative experience.

### Key Objectives

1. **Immersive Fantasy Aesthetic** - Transform utilitarian UI into a world-consistent visual experience
2. **Lore Integration** - Surface rich character backstories, item legends, and world lore throughout the interface
3. **UX Excellence** - Improve information hierarchy, readability, and interaction feedback
4. **Visual Polish** - Add micro-interactions, animations, and visual effects that enhance engagement
5. **Accessibility** - Ensure WCAG compliance while maintaining fantasy aesthetic

---

## Current State Analysis

### What Exists

#### Landing Page (`/home/pwieladek/project/punch/packages/client/src/pages/LandingPage.tsx`)
- **Hero Section**: Basic gradient backgrounds, animated orbs, title with faction colors
- **Lore Section**: Two-column faction cards with basic descriptions
- **Hero Showcase**: Grid of hero cards with placeholder portraits (letter avatars)
- **Features Section**: Six feature cards with SVG icons
- **Newsletter & Footer**: Standard components

**Strengths:**
- Clean color system (mystical purple, human gold)
- Basic responsive design
- Custom Tailwind configuration with game-specific colors
- Font pairing (Cinzel display, Inter body)

**Weaknesses:**
- Hero portraits are placeholder letters, not actual art
- Lore section is generic, not using MASTER_LORE_PLAN content
- No visual storytelling or atmospheric elements
- Hero detail panel shows technical stats, not narrative content
- Coming soon section lists generic roles, not actual planned heroes
- No parallax, scroll animations, or visual depth

#### Lobby Page (`/home/pwieladek/project/punch/packages/client/src/pages/LobbyPage.tsx`)
- **Header**: Logo, online/queue counts, user info
- **Play Card**: Queue status, player stats grid
- **Chat**: Simple message list with input
- **Recent Matches**: Placeholder only

**Strengths:**
- Functional real-time updates
- Clear queue status feedback
- Reconnection modal for active games

**Weaknesses:**
- No hero showcase or selection preview
- No lore elements or atmospheric design
- Generic "card-game" styling
- No featured content, news, or seasonal elements
- Profile display is minimal (no hero stats, match history)

#### Hero Selection (`/home/pwieladek/project/punch/packages/client/src/pages/GamePage.tsx`)
- Grid of hero cards with emoji role icons
- Team composition display
- Lock-in button

**Strengths:**
- Clear team separation (Radiant/Dire)
- Timer prominently displayed
- Lock status indicators

**Weaknesses:**
- Emoji icons instead of proper hero art
- No hero preview panel with lore/abilities
- No ability preview during selection
- No voice line playback or character quotes
- No recommended heroes or synergy hints
- Generic gradient backgrounds, not faction-themed

#### In-Game HUD (`PlayingPhase` in GamePage.tsx)
- **Top Bar**: Score, timer
- **Bottom Bar**: Hero portrait (emoji), health/mana bars, ability bar, KDA/gold
- **Ability Bar**: Q/W/E/R buttons with cooldown overlay
- **Minimap**: 200x200 pixel map
- **Item Shop**: Modal with category tabs
- **Buff Bar**: Icon display above portrait

**Strengths:**
- Functional ability cooldown display
- Health/mana bars with percentages
- Shop with search and filtering

**Weaknesses:**
- **Ability Bar**: No tooltips showing damage values, cooldowns, descriptions
- **Health Bars**: No billboard effect (don't face camera)
- **Item Shop**: No lore descriptions, generic stat display
- Hero portraits are emojis
- No ability icons (just Q/W/E/R letters)
- Minimap is basic, no terrain features
- No team frames showing ally health/status
- No target frame showing enemy info
- Death screen is overlay text, not styled modal

#### End Game Screen (`GameEndScreen`)
- Victory/Defeat with team colors
- Stats table (KDA, gold, damage)
- Auto-return countdown

**Strengths:**
- Clear winner indication
- Comprehensive stat display
- Return to lobby flow

**Weaknesses:**
- No match highlights or MVP display
- No honor/commend system
- Generic styling, not celebratory
- No lore-appropriate victory/defeat messaging

### What's Missing

1. **Hero Art System** - Actual hero portraits, splash art, ability icons
2. **Ability Tooltips** - Rich tooltips with lore quotes from ABILITY_TOOLTIPS.md
3. **Item Lore Display** - Item legends from LEGENDARY_ITEMS.md
4. **Voice Line Integration** - Character quotes from VOICE_LINES.md
5. **World Lore Pages** - Dedicated lore browser using MASTER_LORE_PLAN.md
6. **Animated Transitions** - Page transitions, hero reveal animations
7. **Sound Design Integration** - UI sounds, ambient audio, voice lines
8. **Settings/Options Panel** - Graphics, audio, keybindings, accessibility
9. **Profile/Stats Page** - Player progression, hero mastery, match history
10. **Social Features** - Friends list, party system, spectator browser

---

## Design Vision

### Visual Language: "Arcane Elegance"

The visual design should feel like an ancient grimoire meets modern gaming interface - sophisticated, mystical, yet highly usable. Think illuminated manuscripts with glowing edges, parchment textures with digital precision.

### Core Visual Elements

1. **Background Treatments**
   - Deep slate/charcoal base (#0a0a0f to #12121a)
   - Subtle magical particle effects
   - Faction-colored accent glows
   - Parallax depth layers

2. **Card/Panel Design**
   - Beveled edges with metallic borders
   - Inner glow on hover/focus
   - Glass-morphism for overlays
   - Parchment texture for lore content

3. **Typography Hierarchy**
   - Cinzel for titles, hero names, epic moments
   - Inter for body text, stats, descriptions
   - JetBrains Mono for numbers, timers, technical data

4. **Color System Enhancement**
   ```
   Mystical Faction:
   - Primary: #8b5cf6 (purple-500)
   - Glow: rgba(139, 92, 246, 0.4)
   - Accent: #c4b5fd (light purple for text)

   Human Faction:
   - Primary: #f59e0b (amber-500)
   - Glow: rgba(251, 191, 36, 0.4)
   - Accent: #fcd34d (gold for text)

   Game State:
   - Health: #22c55e (green-500) with gradient to #14532d
   - Mana: #3b82f6 (blue-500) with gradient to #1e3a8a
   - Experience: #a855f7 (purple-500)
   - Gold: #fbbf24 (amber-400)
   - Danger/Enemy: #ef4444 (red-500)
   - Ally/Safe: #22c55e (green-500)
   ```

5. **Iconography**
   - Custom SVG icons for roles (tank shield, mage staff, etc.)
   - Ability icons with consistent style
   - Status effect icons
   - UI icons (settings, chat, etc.)

### Animation Principles

1. **Entrance/Exit**: 200-300ms ease-out for panels, modals
2. **State Changes**: 150ms for hover, active states
3. **Loading**: Pulsing glow, particle effects
4. **Celebration**: Particles, screen effects for victories
5. **Microinteractions**: Button press feedback, toggle switches

---

## Redesign Areas

### 1. Landing Page / Marketing Site

#### Current Issues
- Generic, could be any game
- Hero portraits are letters
- Lore is surface-level
- No immersion or atmosphere

#### Proposed Redesign

**Hero Section (Above the Fold)**
```
- Full-screen cinematic background with parallax layers:
  - Far: Nexus glowing in distance
  - Mid: Battlefield silhouettes
  - Near: Magical particles, ember effects
- Hero carousel showing actual hero art (when available)
- Animated logo with glow effect
- Tagline: "The Eternal Conflict Awaits"
- Dynamic faction color shift on hover between CTA buttons
- Voice line audio snippet on page load (toggleable)
```

**Lore Section - "The Eternal Conflict"**
```
- Interactive timeline visualization
- Era selector (First Dawn, Awakening, Schism, Fall, Silence, Present)
- Animated map showing Nexus, lanes, jungle regions
- Scrolling text with MASTER_LORE_PLAN excerpts
- Faction comparison cards with key quotes:
  - Mystical: "Magic Is Life" philosophy
  - Human: "The Future Belongs to Us" philosophy
- Hover reveals character silhouettes from each faction
```

**Hero Showcase - "Champions of the Conflict"**
```
- 3D carousel or grid with hero cards
- Hero card design:
  - Portrait area (splash art placeholder for now)
  - Name + Title (e.g., "Ironclad - The Unbreakable Shield")
  - Faction badge
  - Role icon
  - Difficulty indicator (1-3 pips)
  - Hover reveals signature quote from VOICE_LINES.md
- Hero detail panel:
  - Full lore from MASTER_LORE_PLAN.md (True Name, Age, Origin, History)
  - Personality traits
  - Key quote
  - Relationships teaser
  - Ability preview with names from ABILITY_TOOLTIPS.md
- Filter by: Faction, Role, Difficulty
- Search functionality
```

**Features Section**
```
- Redesign as "The Battlefield Awaits"
- Feature cards with animated icons
- Background: stylized map regions
- Each feature ties to lore:
  - "Three Paths to Victory" - Lane descriptions from lore
  - "Ancient Jungle" - Monster lore teaser
  - "Items of Legend" - Legendary item teaser
```

**Footer**
```
- World map background (faded)
- Lore quote: "The Nexus must fall. Which side will you choose?"
- Social links styled as faction emblems
- Newsletter with "Join the Alliance" / "Join the Council" toggles
```

### 2. Hero Showcase / Selection

#### Current Issues
- Emoji placeholders for portraits
- No ability preview
- No lore integration
- Generic team display

#### Proposed Redesign

**Pre-Game Hero Selection Screen**
```
Layout:
+------------------+------------------------+------------------+
|   RADIANT TEAM   |     HERO CAROUSEL      |    DIRE TEAM    |
|   (5 slots)      |                        |   (5 slots)     |
+------------------+                        +------------------+
|                  |     [HERO PREVIEW]     |                  |
|  Ally portraits  |  - Large portrait      |  Enemy portraits |
|  + selected hero |  - Name + Title        |  (hidden until   |
|  + lock status   |  - Lore excerpt        |   locked)        |
|                  |  - 4 ability previews  |                  |
+------------------+------------------------+------------------+
|                     HERO GRID (filtered)                     |
|  [Filter: Faction] [Filter: Role] [Search]                   |
|  +-------+ +-------+ +-------+ +-------+                     |
|  | Hero  | | Hero  | | Hero  | | Hero  |  ...               |
|  +-------+ +-------+ +-------+ +-------+                     |
+--------------------------------------------------------------+
|            [LOCK IN] Button    |    Timer: 45s              |
+--------------------------------------------------------------+
```

**Hero Card (In Grid)**
```
- Portrait image (with fallback to styled letter avatar)
- Faction-colored border glow
- Role icon (top-right)
- Difficulty (bottom-left, 3 pips)
- Name (bottom)
- TAKEN overlay if locked by other player
- Hover: Shows title + quote from VOICE_LINES.md selection lines
```

**Hero Preview Panel**
```
- Large portrait area
- Hero name + title in Cinzel font
- Faction badge with glow
- Short lore paragraph (from shortDescription or lore excerpt)
- Abilities row:
  +---+ +---+ +---+ +---+
  | Q | | W | | E | | R |
  +---+ +---+ +---+ +---+
  Each ability shows:
  - Icon placeholder (letter for now)
  - Name from ABILITIES constant
  - Tooltip on hover with ABILITY_TOOLTIPS.md content
- Base stats visualization (radar chart or bar graph)
- "Champion's Quote" - Random selection quote from VOICE_LINES.md
- Audio button to play selection voice line (when implemented)
```

**Team Composition Display**
```
- Vertical list of 5 slots per team
- Each slot shows:
  - Player name / "Selecting..." / "Not picked"
  - Mini hero portrait once selected
  - Lock indicator
  - Ready indicator
  - "YOU" badge on own slot
- Radiant side: Green accent (#22c55e)
- Dire side: Red accent (#ef4444)
```

### 3. Lobby and Matchmaking UI

#### Current Issues
- Basic card layout
- No hero/profile showcase
- Generic chat interface
- No recent match history display

#### Proposed Redesign

**Layout**
```
+----------------------------------------------------------+
|  HEADER: Logo | Online Count | Queue | Profile | Settings |
+----------------------------------------------------------+
|  SIDEBAR           |           MAIN CONTENT               |
|  +-------------+   |   +-------------------------------+  |
|  | PLAY        |   |   | FEATURED / NEWS               |  |
|  | Quick Match |   |   | Seasonal events, patch notes  |  |
|  | Ranked      |   |   +-------------------------------+  |
|  | Custom      |   |   | RECENT MATCHES                |  |
|  +-------------+   |   | Match card with hero played,  |  |
|  | PROFILE     |   |   | result, KDA, duration         |  |
|  | Stats       |   |   +-------------------------------+  |
|  | Heroes      |   |   | HERO MASTERY                  |  |
|  | History     |   |   | Top 3 most played heroes      |  |
|  +-------------+   |   +-------------------------------+  |
|  | SOCIAL      |   |                                     |
|  | Friends     |   +-------------------------------------+
|  | Party       |   | CHAT (collapsible)                  |
|  +-------------+   +-------------------------------------+
+----------------------------------------------------------+
```

**Play Card Redesign**
```
- Queue button with animated border
- Queue status with visual spinner
- Estimated wait time
- Cancel button
- Animated "Match Found!" modal with:
  - Sound effect
  - Pulsing border
  - Accept/Decline buttons
  - Auto-accept countdown
```

**Profile Preview**
```
- Avatar/portrait
- Display name with rank badge
- MMR display (styled as mystical number)
- Win rate percentage ring
- Total games played
- "View Full Profile" link
```

**Recent Matches**
```
- Card per match showing:
  - Hero portrait (small)
  - Result: VICTORY/DEFEAT with color
  - KDA: 5/2/8 format
  - Duration: 24:35
  - Date: "2 hours ago"
  - Click to expand for full stats
```

### 4. In-Game HUD

#### Current Issues
- Ability bar lacks tooltips
- No ability icons
- Health bars don't billboard
- Item shop missing lore
- Hero portraits are emojis

#### Proposed Redesign

**Top HUD Bar**
```
+----------------------------------------------------------+
| [RADIANT]      |  [SCORE]  |  [TIMER]  |      [DIRE]     |
|  5 mini icons  |   12:5    |  15:32    |  5 mini icons   |
+----------------------------------------------------------+

- Team hero icons (mini portraits or role icons)
- Health bar under each icon (thin)
- Score with kill icons
- Timer with subtle pulse animation
- Clicking hero icon: Show target frame
```

**Bottom HUD Bar**
```
+----------------------------------------------------------+
| PORTRAIT | HEALTH/MANA | ABILITIES | ITEMS | KDA | GOLD   |
+----------------------------------------------------------+

Portrait Panel:
- Hero portrait (or styled fallback)
- Level badge
- XP progress ring around portrait

Health/Mana:
- Health: Green gradient bar with value/max
- Mana: Blue gradient bar with value/max
- Animated damage/heal indicators

Abilities (Q/W/E/R):
- Square buttons with icon placeholders
- Cooldown sweep animation
- Mana cost badge (bottom)
- Level indicator (top-right)
- Hotkey (top-left)
- TOOLTIP ON HOVER (critical feature)

Items (6 slots):
- Grid of 6 slots
- Item icon with stack count
- Empty slots numbered
- Active item highlight

KDA:
- Kills/Deaths/Assists
- Styled with colors (green/red/blue)

Gold:
- Coin icon
- Animated on gold gain
```

**Ability Tooltips (PRIORITY FEATURE)**
```
Tooltip appears on hover, positioned above ability button.
Content from ABILITY_TOOLTIPS.md and abilities.ts:

+------------------------------------------+
| SHIELD BASH (Q)                          |
| "A shield is not a wall. It answers."    |
+------------------------------------------+
| Slams shield into target, dealing        |
| 60/100/140/180/220 (+60% AD) physical    |
| damage and stunning for 1 second.        |
|                                          |
| Target: Unit        Damage: Physical     |
| Mana: 40/45/50/55/60   CD: 8/7.5/7/6.5/6 |
| Range: 200                               |
+------------------------------------------+
| Level 2 / 5                              |
+------------------------------------------+

Styling:
- Dark semi-transparent background
- Faction-colored border
- Lore quote in italics
- Stat numbers color-coded
- Current level highlighted
```

**Item Shop Redesign**
```
Modal with two panels:

LEFT: Shop Items
- Category tabs (Basic, Advanced, Legendary, Consumable)
- Search bar
- Item grid with:
  - Item icon (letter fallback)
  - Name
  - Cost
  - Category border color
- Hover shows expanded tooltip

RIGHT: Item Detail + Inventory
- Selected item large view
- Full description
- Stats provided
- Build path visualization
- LORE from LEGENDARY_ITEMS.md:
  - "True Name" for legendary items
  - "History" excerpt
  - "Whisper" quote in italics
- Your inventory (6 slots)
- Total gold

Item Tooltip (from LEGENDARY_ITEMS.md):
+------------------------------------------+
| BLOODTHIRSTER                            |
| "Thirst" - Blade of Tyrant Valdor III    |
+------------------------------------------+
| +80 Attack Damage                        |
| +20% Lifesteal                           |
|                                          |
| Passive: Lifesteal can overheal,         |
| granting a shield for the excess.        |
+------------------------------------------+
| "Are you hungry? So am I. Feed me,       |
|  and I shall feed you."                  |
+------------------------------------------+
| Cost: 3400g                              |
+------------------------------------------+
```

**Minimap Enhancement**
```
- Terrain features visible
- Lane paths highlighted
- Tower icons
- Jungle camp icons
- River marker
- Player icons with health indicators
- Ping markers
- Fog of war visualization
- Click-to-move functionality
- Zoom toggle
```

**Target Frame**
```
When clicking enemy or pressing Tab:
+---------------------------+
| [Portrait] Enemy Name     |
| ROLE: Mage   LEVEL: 8     |
| HP: |||||||-----  650/1200|
| MP: ||||--------  200/500 |
+---------------------------+
- Shows selected enemy/ally info
- Updates in real-time
- Escape or click elsewhere to dismiss
```

**Death Screen**
```
Full-screen overlay:
+------------------------------------------+
|                                          |
|              YOU HAVE FALLEN             |
|                                          |
|     Slain by: PYRALIS                    |
|     "Fire does not hate the wood..."     |
|                                          |
|     Respawning in: 15 seconds            |
|          [||||||||||-----]               |
|                                          |
|     [View Battlefield]  [Shop]           |
+------------------------------------------+

- Killer's quote from VOICE_LINES.md kill lines
- Respawn progress bar
- Ability to view map and shop while dead
```

### 5. End-Game Screens

#### Current Issues
- Generic victory/defeat text
- Standard stat table
- No celebration effects

#### Proposed Redesign

**Victory Screen**
```
+----------------------------------------------------------+
|                                                          |
|     [Animated VICTORY banner with particles]             |
|                                                          |
|     "The [FACTION] prevails. The Nexus endures."         |
|                                                          |
|  +-------------------+        +-------------------+      |
|  | YOUR PERFORMANCE  |        | MATCH HIGHLIGHTS  |      |
|  | KDA: 12/3/15      |        | MVP: PlayerName   |      |
|  | Damage: 28,450    |        | First Blood: ...  |      |
|  | Gold: 14,200      |        | Most Kills: ...   |      |
|  | Hero: Ironclad    |        | Most Damage: ...  |      |
|  +-------------------+        +-------------------+      |
|                                                          |
|  +----------------------------------------------------+  |
|  |              TEAM SCOREBOARD                        |  |
|  | [Player rows with stats...]                        |  |
|  +----------------------------------------------------+  |
|                                                          |
|     [Honor Ally]    [Play Again]    [Return to Lobby]    |
|                                                          |
+----------------------------------------------------------+

- Faction-appropriate victory quote
- Particle effects
- Sound effect (from audio system)
- MVP calculation
```

**Defeat Screen**
```
Same layout but:
- Red/somber color scheme
- "The battle is lost, but the war continues..."
- Encouragement message
- Same stats display
```

---

## Lore Integration Strategy

### Content Sources

| File | Content Type | Integration Points |
|------|--------------|-------------------|
| MASTER_LORE_PLAN.md | World history, hero biographies, faction philosophies | Landing page lore section, hero detail panels, loading screens |
| ABILITY_TOOLTIPS.md | Ability descriptions with lore quotes | Ability tooltips, hero preview during selection |
| VOICE_LINES.md | 700+ voice lines for all heroes | Hero selection quotes, kill/death messages, taunts |
| LEGENDARY_ITEMS.md | Item histories, whispers, previous owners | Item shop tooltips, item lore browser |

### Integration Points by Screen

**Landing Page**
- Lore section uses "The Eternal Conflict" narrative
- Faction cards use philosophy descriptions
- Hero showcase uses True Names and key quotes
- Timeline uses "Ancient History" section

**Hero Selection**
- Hero preview shows lore excerpt
- Abilities show tooltips from ABILITY_TOOLTIPS.md
- Random selection quote from VOICE_LINES.md

**In-Game**
- Ability tooltips include lore quotes
- Item shop shows item legends
- Kill notifications can include killer's voice line
- Death screen shows killer's quote

**End Game**
- Victory/defeat messages faction-appropriate
- Could include relevant lore quotes

### Data Structure for Lore

```typescript
// packages/shared/src/constants/lore.ts
export interface HeroLore {
  trueName: string;
  age: string;
  origin: string;
  historyExcerpt: string; // First 2-3 paragraphs
  character: string[];    // Personality traits
  keyQuote: string;
  relationshipsTeaser: string;
}

export interface AbilityLore {
  narrativeName: string;  // e.g., "The Defender's Answer"
  loreQuote: string;      // From ABILITY_TOOLTIPS.md
}

export interface ItemLore {
  trueName: string;
  history: string;
  whisper: string;
  previousOwners?: string[];
}

export const HERO_LORE: Record<string, HeroLore> = {
  ironclad: {
    trueName: "Torvin Ironhorn",
    age: "47 years (appears 35)",
    origin: "The Northern Citadel",
    historyExcerpt: "Torvin was born the son of a blacksmith...",
    character: ["Silent but when he speaks, people listen", "Chronic pessimist", "Secretly writes poetry"],
    keyQuote: "A shield does not win battles. A shield buys time.",
    relationshipsTeaser: "Ironclad shares a brotherhood with Bladewarden..."
  },
  // ... more heroes
};
```

---

## Implementation Priorities

### Phase 1: Critical UX Fixes (PRIORITY 4 Tasks) - COMPLETE

**Week 1-2** ✅
| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| Ability Tooltips | Medium | High | ✅ Complete |
| Billboard Health Bars | Medium | Medium | ✅ Complete |
| Chat Input Context (ignore hotkeys) | Low | Medium | ✅ Complete |
| Hero Selection Ability Preview | Medium | High | ✅ Complete |

**Implementation Notes (2025-11-28):**
- `AbilityTooltip.tsx`: Rich tooltips with lore quotes, damage values, scaling info, cooldowns
- `BillboardHealthBar.tsx`: Three.js billboard effect using useFrame + camera lookAt
- `AbilityBar.tsx` & `GamePage.tsx`: Added isTyping check for document.activeElement
- `HeroAbilityPreview.tsx`: Full ability preview panel for hero selection phase
- `abilityLore.ts`: Lore data extracted from ABILITY_TOOLTIPS.md

### Phase 2: Visual Polish - COMPLETE

**Week 3-4** ✅
| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| Landing Page Redesign | High | High | ✅ Complete |
| Hero Card Visual Upgrade | Medium | High | ✅ Complete |
| Item Shop Lore Integration | Medium | Medium | ✅ Complete |
| Lobby Page Refresh | Medium | Medium | ✅ Complete |

**Implementation Notes (2025-11-28):**
- `ProfilePreview.tsx`: Player profile card with:
  - Animated faction glow avatar ring
  - MMR display with rank badge (Bronze through Diamond styling)
  - Win rate calculation and KDA stats grid
  - Hero Mastery section showing top 3 heroes with:
    - Mastery tier badges (Bronze/Silver/Gold/Platinum/Diamond)
    - Games played, win rate, visual progression bar
    - Hover tooltips showing hero quotes from lore
- `RecentMatches.tsx`: Match history component with:
  - Last 5 matches with mock data support
  - Victory/Defeat indicators with gradient backgrounds
  - Hero avatar with faction theming
  - KDA display with color coding
  - Game duration and "time ago" formatting
  - Performance indicator bar
- `QueueStatus.tsx`: Enhanced queue status with:
  - Animated circular progress ring with pulsing glow
  - Floating particle effects (mystical dots)
  - Typing animation for rotating search messages
  - Countdown timer with digit display
  - Match Found dramatic reveal animation
  - Intensity system (ambient glow increases with queue time)
- `LobbyPage.tsx`: Complete redesign with:
  - 3-column layout (Profile | Play+Matches | Chat)
  - Collapsible chat sidebar (floating button when minimized)
  - Enhanced PlayCard with faction symbols
  - Sticky header with backdrop blur
  - New reconnect modal styling
- `loreData.ts`: Centralized lore constants including:
  - FACTION_THEMES: Faction colors, philosophies, war objectives
  - WORLD_ERAS: 6 eras from First Dawn to Present Day
  - HERO_LORE: True names, origins, biographies, character traits, key quotes
  - ITEM_LORE: True names, histories, whispers, previous owners, narrative effects
  - ROLE_INFO: Role descriptions and playstyles
  - BATTLEFIELD_LOCATIONS: Map locations with lore
- `Lore.tsx`: Complete redesign with:
  - Interactive era timeline with clickable cards
  - Enhanced faction cards with philosophy quotes and war objectives
  - Interactive battlefield map with location markers and lore display
  - Decorative parallax-style backgrounds
- `HeroCard.tsx`: Reusable component with 3 variants:
  - grid: Standard card for landing page (shows portrait, role icon, difficulty)
  - compact: Smaller card for hero selection (locked state support)
  - detailed: Full info card with lore integration
  - All variants feature faction-colored glow effects and hover states
- `HeroShowcase.tsx`: Updated to use HeroCard with full lore integration
  - Hero detail panel shows true name, origin, age, character traits
  - Relationships teaser and key quotes from lore
  - Role playstyle descriptions
- `ItemShop.tsx`: Enhanced with lore integration:
  - 3-column layout (item grid, detail panel, inventory)
  - Tier-based styling with glow effects (basic/advanced/legendary)
  - True name display, whisper quotes, previous owners
  - Bearer's Burden narrative effects for legendary items
  - Glass-morphism effects and backdrop blur

### Phase 3: Lore Integration - PARTIALLY COMPLETE

**Week 5-6**
| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| Hero Lore Data Structure | Medium | High | ✅ Complete (loreData.ts) |
| Hero Detail Panel with Lore | Medium | High | ✅ Complete (HeroShowcase.tsx) |
| Item Lore Display | Medium | Medium | ✅ Complete (ItemShop.tsx) |
| Voice Line Integration | High | Medium | Pending |

**Notes:** The lore data structure was implemented as part of Phase 2. The main remaining task is audio integration for voice lines.

### Phase 4: Advanced Features

**Week 7-8**
| Task | Effort | Impact |
|------|--------|--------|
| Profile/Stats Page | High | Medium |
| Match History Display | Medium | Medium |
| Settings Panel | Medium | Medium |
| End-Game Screen Enhancement | Medium | Medium |

---

## Technical Recommendations

### Component Library

Consider adding:
- **Radix UI** for accessible primitives (Dialog, Tooltip, Dropdown)
- **Framer Motion** for animations
- **React-Three-Fiber** already in use for 3D

### Tooltip Implementation

```tsx
// Use Radix UI Tooltip for accessibility
import * as Tooltip from '@radix-ui/react-tooltip';

function AbilityTooltip({ ability, children }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="ability-tooltip"
            side="top"
            sideOffset={5}
          >
            <AbilityTooltipContent ability={ability} />
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
```

### Asset Placeholders

Until proper hero art is available:
```tsx
// Styled placeholder that looks intentional
function HeroPortraitPlaceholder({ hero }) {
  const isMystical = hero.faction === 'mystical';
  return (
    <div className={`
      w-full h-full rounded-lg
      bg-gradient-to-br
      ${isMystical ? 'from-purple-900 via-purple-800 to-indigo-900' : 'from-amber-900 via-orange-800 to-yellow-900'}
      flex items-center justify-center
      relative overflow-hidden
    `}>
      {/* Abstract pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg>...</svg>
      </div>
      {/* Role icon */}
      <RoleIcon role={hero.role} className="w-16 h-16 opacity-80" />
      {/* Initial */}
      <span className="absolute bottom-4 right-4 text-6xl font-display opacity-30">
        {hero.name.charAt(0)}
      </span>
    </div>
  );
}
```

### CSS Custom Properties for Theming

```css
:root {
  /* Faction colors as CSS variables for easy theming */
  --color-mystical-primary: 139 92 246;
  --color-mystical-glow: rgba(139, 92, 246, 0.4);
  --color-human-primary: 251 191 36;
  --color-human-glow: rgba(251, 191, 36, 0.4);

  /* Game state colors */
  --color-health: 34 197 94;
  --color-mana: 59 130 246;
  --color-gold: 251 191 36;

  /* Animation durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

---

## Component Architecture

### Proposed New Components

```
/src/components/
  /ui/
    Tooltip.tsx           # Radix-based tooltip
    Modal.tsx             # Accessible modal
    ProgressBar.tsx       # Health/mana/XP bars
    Badge.tsx             # Role, faction badges
    Card.tsx              # Base card component

  /hero/
    HeroPortrait.tsx      # Portrait with fallback
    HeroCard.tsx          # Grid card
    HeroPreview.tsx       # Detail panel
    HeroStats.tsx         # Stat visualization
    AbilityIcon.tsx       # Ability button with tooltip
    AbilityTooltip.tsx    # Rich tooltip content

  /lore/
    LoreSection.tsx       # Landing page lore
    Timeline.tsx          # History timeline
    FactionCard.tsx       # Faction display
    ItemLore.tsx          # Item legend display

  /game/
    TopHUD.tsx            # Score, timer, team icons
    BottomHUD.tsx         # Player stats, abilities
    AbilityBar.tsx        # (Existing, enhance)
    ItemShop.tsx          # (Existing, enhance)
    TargetFrame.tsx       # Enemy/ally info
    DeathScreen.tsx       # Death overlay
    Minimap.tsx           # (Existing, enhance)

  /match/
    HeroSelect.tsx        # Hero selection phase
    TeamComposition.tsx   # Team display
    EndGameScreen.tsx     # Victory/defeat
    MatchCard.tsx         # History card
```

---

## Summary

This redesign plan transforms PUNCH from a functional prototype into an immersive MOBA experience. Key priorities:

1. **Immediate (Week 1-2)**: Ability tooltips, billboard health bars, chat hotkey fix
2. **Short-term (Week 3-4)**: Visual polish, hero cards, item lore
3. **Medium-term (Week 5-6)**: Full lore integration, voice lines
4. **Long-term (Week 7+)**: Profile system, settings, advanced features

The rich lore content already created provides a massive opportunity for differentiation. By surfacing hero backstories, item legends, and faction philosophies throughout the interface, PUNCH can create an experience that feels both narratively deep and visually stunning.

---

*"The world stands upon the precipice. The Nexus pulses, and both armies gather for the final battle."*
*-- Chronicles of the Eternal Conflict*
