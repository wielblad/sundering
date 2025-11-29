import { useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface MatchData {
  id: string;
  heroId: string;
  result: 'victory' | 'defeat';
  kills: number;
  deaths: number;
  assists: number;
  duration: number; // seconds
  timestamp: Date;
  team: 'radiant' | 'dire';
}

interface RecentMatchesProps {
  matches?: MatchData[];
  maxMatches?: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_MATCHES: MatchData[] = [
  {
    id: 'match-001',
    heroId: 'bladewarden',
    result: 'victory',
    kills: 12,
    deaths: 3,
    assists: 8,
    duration: 1847, // ~31 min
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    team: 'radiant',
  },
  {
    id: 'match-002',
    heroId: 'pyralis',
    result: 'defeat',
    kills: 5,
    deaths: 9,
    assists: 11,
    duration: 2234, // ~37 min
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    team: 'dire',
  },
  {
    id: 'match-003',
    heroId: 'sylara',
    result: 'victory',
    kills: 2,
    deaths: 4,
    assists: 22,
    duration: 1523, // ~25 min
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    team: 'radiant',
  },
  {
    id: 'match-004',
    heroId: 'ironclad',
    result: 'victory',
    kills: 4,
    deaths: 2,
    assists: 15,
    duration: 1956, // ~33 min
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    team: 'dire',
  },
  {
    id: 'match-005',
    heroId: 'vex',
    result: 'defeat',
    kills: 8,
    deaths: 7,
    assists: 4,
    duration: 1678, // ~28 min
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    team: 'radiant',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return `${diffDays}d ago`;
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

function calculateKDA(kills: number, deaths: number, assists: number): string {
  const kda = deaths === 0 ? kills + assists : ((kills + assists) / deaths).toFixed(1);
  return kda.toString();
}

function getKDAColor(kills: number, deaths: number, assists: number): string {
  const kda = deaths === 0 ? 10 : (kills + assists) / deaths;
  if (kda >= 5) return 'text-yellow-400';
  if (kda >= 3) return 'text-green-400';
  if (kda >= 2) return 'text-gray-300';
  if (kda >= 1) return 'text-orange-400';
  return 'text-red-400';
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function HeroAvatar({ heroId }: { heroId: string }) {
  const faction = getHeroFaction(heroId);
  const heroName = getHeroName(heroId);
  const isMystical = faction === 'mystical';

  return (
    <div
      className={`
        relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0
        bg-gradient-to-br
        ${isMystical ? 'from-mystical-800 via-mystical-700 to-indigo-800' : 'from-human-800 via-orange-700 to-yellow-800'}
      `}
    >
      {/* Faction glow */}
      <div
        className={`
          absolute inset-0 opacity-40
          ${isMystical ? 'bg-glow-mystical' : 'bg-glow-human'}
        `}
      />
      {/* Hero initial */}
      <span
        className={`
          absolute inset-0 flex items-center justify-center
          text-lg font-display font-bold
          ${isMystical ? 'text-mystical-300' : 'text-human-300'}
        `}
      >
        {heroName.charAt(0)}
      </span>
    </div>
  );
}

function MatchRow({ match }: { match: MatchData }) {
  const isVictory = match.result === 'victory';
  const heroName = getHeroName(match.heroId);
  const faction = getHeroFaction(match.heroId);
  const isMystical = faction === 'mystical';
  const kdaColor = getKDAColor(match.kills, match.deaths, match.assists);

  return (
    <div
      className={`
        relative group p-3 rounded-lg transition-all duration-300
        hover:scale-[1.01]
        ${isVictory
          ? 'bg-gradient-to-r from-green-950/30 via-green-950/10 to-transparent border-l-2 border-green-500/50'
          : 'bg-gradient-to-r from-red-950/30 via-red-950/10 to-transparent border-l-2 border-red-500/50'
        }
      `}
    >
      {/* Animated glow on hover */}
      <div
        className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none
          ${isVictory
            ? 'shadow-[inset_0_0_30px_rgba(34,197,94,0.1)]'
            : 'shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]'
          }
        `}
      />

      <div className="relative flex items-center gap-4">
        {/* Result indicator */}
        <div className="flex flex-col items-center w-12">
          <span
            className={`
              text-xs font-bold uppercase tracking-wider
              ${isVictory ? 'text-green-400' : 'text-red-400'}
            `}
          >
            {isVictory ? 'WIN' : 'LOSS'}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">
            {formatDuration(match.duration)}
          </span>
        </div>

        {/* Divider */}
        <div className={`w-px h-10 ${isVictory ? 'bg-green-500/30' : 'bg-red-500/30'}`} />

        {/* Hero */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <HeroAvatar heroId={match.heroId} />
          <div>
            <span
              className={`
                text-sm font-medium
                ${isMystical ? 'text-mystical-300' : 'text-human-300'}
              `}
            >
              {heroName}
            </span>
            <div className="flex items-center gap-1 text-[10px]">
              <span
                className={`
                  px-1 py-0.5 rounded text-[9px] uppercase font-medium
                  ${match.team === 'radiant'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                  }
                `}
              >
                {match.team}
              </span>
            </div>
          </div>
        </div>

        {/* KDA */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-green-400 font-semibold">{match.kills}</span>
              <span className="text-gray-600">/</span>
              <span className="text-red-400 font-semibold">{match.deaths}</span>
              <span className="text-gray-600">/</span>
              <span className="text-human-400 font-semibold">{match.assists}</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className={`text-xs font-medium ${kdaColor}`}>
                {calculateKDA(match.kills, match.deaths, match.assists)} KDA
              </span>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="text-right min-w-[60px]">
          <span className="text-xs text-gray-500">{getTimeAgo(match.timestamp)}</span>
        </div>
      </div>

      {/* Performance indicator bar */}
      <div className="mt-2 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => {
          const kda = match.deaths === 0 ? 10 : (match.kills + match.assists) / match.deaths;
          const filled = i < Math.min(Math.floor(kda), 10);
          return (
            <div
              key={i}
              className={`
                h-1 flex-1 rounded-full transition-all duration-300
                ${filled
                  ? isVictory
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                  : 'bg-gray-800'
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-6">
      {/* Decorative element */}
      <div className="relative inline-block mb-4">
        <div className="absolute inset-0 bg-mystical-500/20 rounded-full blur-xl animate-pulse" />
        <svg
          className="relative w-16 h-16 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h4 className="text-gray-400 font-display font-semibold mb-2">No Matches Yet</h4>
      <p className="text-gray-600 text-sm max-w-[200px] mx-auto">
        Your match history will appear here after you play your first game.
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecentMatches({ matches, maxMatches = 5 }: RecentMatchesProps) {
  // Use mock data if no matches provided
  const matchData = useMemo(() => {
    const data = matches || MOCK_MATCHES;
    return data.slice(0, maxMatches);
  }, [matches, maxMatches]);

  // Calculate stats
  const stats = useMemo(() => {
    if (matchData.length === 0) return null;

    const wins = matchData.filter((m) => m.result === 'victory').length;
    const totalKills = matchData.reduce((sum, m) => sum + m.kills, 0);
    const totalDeaths = matchData.reduce((sum, m) => sum + m.deaths, 0);
    const totalAssists = matchData.reduce((sum, m) => sum + m.assists, 0);

    return {
      wins,
      losses: matchData.length - wins,
      avgKills: (totalKills / matchData.length).toFixed(1),
      avgDeaths: (totalDeaths / matchData.length).toFixed(1),
      avgAssists: (totalAssists / matchData.length).toFixed(1),
      avgKDA: totalDeaths === 0 ? 'Perfect' : ((totalKills + totalAssists) / totalDeaths).toFixed(2),
    };
  }, [matchData]);

  return (
    <div className="card-game p-5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-bold text-white">Recent Matches</h2>
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                {stats.wins}W
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                {stats.losses}L
              </span>
            </div>
          )}
        </div>

        {stats && (
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Avg KDA</div>
            <div className="text-sm font-semibold text-gray-300">{stats.avgKDA}</div>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div className="relative mb-4 p-3 rounded-lg bg-game-dark/50 border border-game-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">{stats.avgKills}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Kills</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">{stats.avgDeaths}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Deaths</div>
            </div>
            <div>
              <div className="text-lg font-bold text-human-400">{stats.avgAssists}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Assists</div>
            </div>
          </div>

          {/* Win rate bar */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                style={{ width: `${(stats.wins / matchData.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Win Rate</span>
              <span className="text-gray-300 font-medium">
                {Math.round((stats.wins / matchData.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Match List */}
      <div className="relative space-y-2">
        {matchData.length > 0 ? (
          matchData.map((match) => <MatchRow key={match.id} match={match} />)
        ) : (
          <EmptyState />
        )}
      </div>

      {/* View All Link */}
      {matchData.length > 0 && (
        <div className="relative mt-4 text-center">
          <button
            className="
              text-sm text-gray-500 hover:text-mystical-400
              transition-colors duration-300
              inline-flex items-center gap-1
            "
          >
            View Match History
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default RecentMatches;
