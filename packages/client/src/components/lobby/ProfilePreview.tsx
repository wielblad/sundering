import { useMemo } from 'react';
import { HERO_LORE } from '../../constants/loreData';

// =============================================================================
// TYPES
// =============================================================================

interface HeroMasteryData {
  heroId: string;
  gamesPlayed: number;
  gamesWon: number;
}

interface ProfileStats {
  mmr: number;
  rank_tier: string;
  games_played: number;
  games_won: number;
  total_kills: number;
  total_assists: number;
  total_deaths: number;
}

interface ProfilePreviewProps {
  displayName: string;
  stats?: ProfileStats;
  heroMastery?: HeroMasteryData[];
}

// =============================================================================
// MOCK DATA - Hero Mastery (until backend supports it)
// =============================================================================

const MOCK_HERO_MASTERY: HeroMasteryData[] = [
  { heroId: 'bladewarden', gamesPlayed: 147, gamesWon: 89 },
  { heroId: 'sylara', gamesPlayed: 98, gamesWon: 52 },
  { heroId: 'pyralis', gamesPlayed: 76, gamesWon: 41 },
  { heroId: 'ironclad', gamesPlayed: 45, gamesWon: 28 },
  { heroId: 'vex', gamesPlayed: 32, gamesWon: 18 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getMasteryTier(gamesPlayed: number): {
  tier: string;
  color: string;
  bgColor: string;
  borderColor: string;
  progress: number;
  nextTier: number;
} {
  if (gamesPlayed >= 200) {
    return {
      tier: 'Diamond',
      color: 'text-cyan-300',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/50',
      progress: 100,
      nextTier: 200,
    };
  }
  if (gamesPlayed >= 100) {
    return {
      tier: 'Platinum',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50',
      progress: ((gamesPlayed - 100) / 100) * 100,
      nextTier: 200,
    };
  }
  if (gamesPlayed >= 50) {
    return {
      tier: 'Gold',
      color: 'text-yellow-300',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      progress: ((gamesPlayed - 50) / 50) * 100,
      nextTier: 100,
    };
  }
  if (gamesPlayed >= 25) {
    return {
      tier: 'Silver',
      color: 'text-gray-300',
      bgColor: 'bg-gray-400/20',
      borderColor: 'border-gray-400/50',
      progress: ((gamesPlayed - 25) / 25) * 100,
      nextTier: 50,
    };
  }
  return {
    tier: 'Bronze',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    progress: (gamesPlayed / 25) * 100,
    nextTier: 25,
  };
}

function getRankBadgeStyle(rankTier: string): {
  gradient: string;
  glow: string;
  icon: string;
} {
  const tier = rankTier.toLowerCase();
  if (tier.includes('diamond') || tier.includes('master') || tier.includes('grandmaster')) {
    return {
      gradient: 'from-cyan-400 via-blue-400 to-mystical-400',
      glow: 'shadow-cyan-500/50',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    };
  }
  if (tier.includes('platinum')) {
    return {
      gradient: 'from-emerald-400 to-teal-400',
      glow: 'shadow-emerald-500/50',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    };
  }
  if (tier.includes('gold')) {
    return {
      gradient: 'from-yellow-400 to-human-500',
      glow: 'shadow-yellow-500/50',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    };
  }
  if (tier.includes('silver')) {
    return {
      gradient: 'from-gray-300 to-gray-400',
      glow: 'shadow-gray-400/50',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    };
  }
  if (tier.includes('bronze')) {
    return {
      gradient: 'from-orange-400 to-orange-600',
      glow: 'shadow-orange-500/50',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    };
  }
  // Unranked
  return {
    gradient: 'from-gray-500 to-gray-600',
    glow: 'shadow-gray-500/30',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  };
}

function getHeroFaction(heroId: string): 'mystical' | 'human' {
  const mysticalHeroes = ['sylara', 'pyralis', 'nightshade', 'thornweaver', 'frostborne', 'zephyr', 'scourge'];
  return mysticalHeroes.includes(heroId) ? 'mystical' : 'human';
}

function getHeroName(heroId: string): string {
  const heroNames: Record<string, string> = {
    ironclad: 'Ironclad',
    bladewarden: 'Bladewarden',
    sylara: 'Sylara',
    vex: 'Vex',
    magnus: 'Magnus',
    grimjaw: 'Grimjaw',
    valeria: 'Valeria',
    hex: 'Hex',
    pyralis: 'Pyralis',
    nightshade: 'Nightshade',
    thornweaver: 'Thornweaver',
    frostborne: 'Frostborne',
    zephyr: 'Zephyr',
    scourge: 'Scourge',
  };
  return heroNames[heroId] || heroId;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function HeroMasteryCard({ heroId, gamesPlayed, gamesWon }: HeroMasteryData) {
  const faction = getHeroFaction(heroId);
  const heroName = getHeroName(heroId);
  const heroLore = HERO_LORE[heroId];
  const mastery = getMasteryTier(gamesPlayed);
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const isMystical = faction === 'mystical';

  return (
    <div
      className={`
        relative group p-3 rounded-lg border transition-all duration-300
        bg-gradient-to-br ${isMystical ? 'from-mystical-950/50 to-mystical-950/30' : 'from-human-950/50 to-human-950/30'}
        ${mastery.borderColor}
        hover:scale-[1.02] hover:shadow-lg
        ${isMystical ? 'hover:shadow-mystical-500/20' : 'hover:shadow-human-500/20'}
      `}
    >
      {/* Hero Avatar */}
      <div className="flex items-start gap-3">
        <div
          className={`
            relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0
            bg-gradient-to-br
            ${isMystical ? 'from-mystical-800 via-mystical-700 to-indigo-800' : 'from-human-800 via-orange-700 to-yellow-800'}
          `}
        >
          {/* Faction glow */}
          <div
            className={`
              absolute inset-0 opacity-50
              ${isMystical ? 'bg-glow-mystical' : 'bg-glow-human'}
            `}
          />
          {/* Hero initial */}
          <span
            className={`
              absolute inset-0 flex items-center justify-center
              text-xl font-display font-bold
              ${isMystical ? 'text-mystical-300' : 'text-human-300'}
            `}
          >
            {heroName.charAt(0)}
          </span>
          {/* Mastery tier badge */}
          <div
            className={`
              absolute -bottom-1 -right-1 w-5 h-5 rounded-full
              flex items-center justify-center text-[10px] font-bold
              ${mastery.bgColor} ${mastery.color} border ${mastery.borderColor}
            `}
          >
            {mastery.tier.charAt(0)}
          </div>
        </div>

        {/* Hero Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`
                font-display font-semibold text-sm truncate
                ${isMystical ? 'text-mystical-300' : 'text-human-300'}
              `}
            >
              {heroName}
            </h4>
            <span className={`text-xs font-medium ${mastery.color}`}>
              {mastery.tier}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-gray-400">
              <span className="text-white font-medium">{gamesPlayed}</span> games
            </span>
            <span
              className={`
                font-medium
                ${winRate >= 55 ? 'text-green-400' : winRate >= 45 ? 'text-gray-300' : 'text-red-400'}
              `}
            >
              {winRate}% WR
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-500
                ${mastery.tier === 'Diamond'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : mastery.tier === 'Platinum'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : mastery.tier === 'Gold'
                      ? 'bg-gradient-to-r from-yellow-500 to-human-500'
                      : mastery.tier === 'Silver'
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600'
                }
              `}
              style={{ width: `${mastery.progress}%` }}
            />
          </div>
          {mastery.tier !== 'Diamond' && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              {mastery.nextTier - gamesPlayed} games to next tier
            </p>
          )}
        </div>
      </div>

      {/* Hover tooltip with quote */}
      {heroLore && (
        <div
          className={`
            absolute left-0 right-0 -bottom-2 translate-y-full z-20
            opacity-0 group-hover:opacity-100 pointer-events-none
            transition-opacity duration-200 px-2
          `}
        >
          <div
            className={`
              p-2 rounded-lg text-xs italic text-gray-300 text-center
              ${isMystical ? 'bg-mystical-950/95 border border-mystical-500/30' : 'bg-human-950/95 border border-human-500/30'}
            `}
          >
            "{heroLore.keyQuote.slice(0, 60)}..."
          </div>
        </div>
      )}
    </div>
  );
}

function RankBadge({ rankTier, mmr }: { rankTier: string; mmr: number }) {
  const badgeStyle = getRankBadgeStyle(rankTier);

  return (
    <div className="relative flex items-center gap-3">
      {/* Animated background glow */}
      <div
        className={`
          absolute -inset-2 rounded-xl opacity-30 blur-xl animate-pulse
          bg-gradient-to-r ${badgeStyle.gradient}
        `}
      />

      {/* Badge */}
      <div
        className={`
          relative w-14 h-14 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${badgeStyle.gradient}
          shadow-lg ${badgeStyle.glow}
        `}
      >
        <svg className="w-8 h-8 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
          <path d={badgeStyle.icon} />
        </svg>
      </div>

      {/* Rank Info */}
      <div>
        <div
          className={`
            font-display font-bold text-lg bg-gradient-to-r ${badgeStyle.gradient}
            bg-clip-text text-transparent
          `}
        >
          {rankTier}
        </div>
        <div className="text-sm text-gray-400">
          <span className="text-white font-medium">{mmr.toLocaleString()}</span> MMR
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProfilePreview({ displayName, stats, heroMastery }: ProfilePreviewProps) {
  // Use mock data if no hero mastery provided
  const masteryData = useMemo(() => {
    return heroMastery || MOCK_HERO_MASTERY;
  }, [heroMastery]);

  const topHeroes = masteryData.slice(0, 3);
  const winRate = stats && stats.games_played > 0
    ? Math.round((stats.games_won / stats.games_played) * 100)
    : 0;

  return (
    <div className="card-game p-5 space-y-5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-mystical-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-human-500/5 rounded-full blur-3xl" />
      </div>

      {/* Profile Header */}
      <div className="relative">
        {/* Avatar with faction glow */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className="
                absolute -inset-1 rounded-full
                bg-gradient-to-br from-mystical-500 via-mystical-400 to-mystical-500
                opacity-70 blur-sm animate-pulse-slow
              "
            />
            {/* Avatar */}
            <div
              className="
                relative w-16 h-16 rounded-full
                bg-gradient-to-br from-[#12121a] to-[#1a1a2e]
                border-2 border-mystical-500/50
                flex items-center justify-center
              "
            >
              <span className="text-2xl font-display font-bold text-mystical-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Name and basic stats */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg text-white truncate">
              {displayName}
            </h3>
            {stats && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">
                  <span className="text-white font-medium">{stats.games_played}</span> games
                </span>
                <span
                  className={`
                    font-medium
                    ${winRate >= 55 ? 'text-green-400' : winRate >= 45 ? 'text-gray-300' : 'text-red-400'}
                  `}
                >
                  {winRate}% WR
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rank Badge */}
        <div className="mt-4">
          <RankBadge
            rankTier={stats?.rank_tier || 'Unranked'}
            mmr={stats?.mmr || 1000}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="h-px bg-gradient-to-r from-transparent via-game-border to-transparent" />
      </div>

      {/* KDA Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-game-dark/50">
            <div className="text-lg font-bold text-green-400">{stats.total_kills}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Kills</div>
          </div>
          <div className="p-2 rounded-lg bg-game-dark/50">
            <div className="text-lg font-bold text-red-400">{stats.total_deaths}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Deaths</div>
          </div>
          <div className="p-2 rounded-lg bg-game-dark/50">
            <div className="text-lg font-bold text-human-400">{stats.total_assists}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Assists</div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="h-px bg-gradient-to-r from-transparent via-game-border to-transparent" />
      </div>

      {/* Hero Mastery Section */}
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-display font-semibold text-gray-300 uppercase tracking-wider">
            Hero Mastery
          </h4>
          <span className="text-xs text-gray-500">Top 3</span>
        </div>

        <div className="space-y-2">
          {topHeroes.map((hero) => (
            <HeroMasteryCard
              key={hero.heroId}
              heroId={hero.heroId}
              gamesPlayed={hero.gamesPlayed}
              gamesWon={hero.gamesWon}
            />
          ))}
        </div>

        {topHeroes.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Play matches to build hero mastery
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePreview;
