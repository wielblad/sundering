import { query, queryOne } from './database.js';

export interface MatchPlayerResult {
  oddsUserId: string | null; // null for bots
  team: 'radiant' | 'dire';
  heroId: string;
  kills: number;
  deaths: number;
  assists: number;
  goldEarned: number;
  damageDealt: number;
  isWinner: boolean;
  displayName: string;
  isBot: boolean;
}

export interface MatchResult {
  matchId: string;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  winner: 'radiant' | 'dire';
  radiantScore: number;
  direScore: number;
  players: MatchPlayerResult[];
}

const MMR_WIN_GAIN = 25;
const MMR_LOSS = -20;

export async function saveMatchResult(result: MatchResult): Promise<string | null> {
  try {
    // Insert match into match_history
    const matchRecord = await queryOne<{ id: string }>(
      `INSERT INTO match_history (id, started_at, ended_at, duration_seconds, winner, radiant_score, dire_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        result.matchId,
        result.startedAt,
        result.endedAt,
        result.durationSeconds,
        result.winner,
        result.radiantScore,
        result.direScore,
      ]
    );

    if (!matchRecord) {
      console.error('Failed to insert match_history');
      return null;
    }

    // Insert each player's results
    for (const player of result.players) {
      const mmrChange = player.isWinner ? MMR_WIN_GAIN : MMR_LOSS;

      await query(
        `INSERT INTO match_players (match_id, user_id, team, hero_id, kills, deaths, assists, gold_earned, damage_dealt, is_winner, mmr_change)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          result.matchId,
          player.oddsUserId, // Can be null for bots
          player.team,
          player.heroId,
          player.kills,
          player.deaths,
          player.assists,
          player.goldEarned,
          player.damageDealt,
          player.isWinner,
          player.isBot ? 0 : mmrChange,
        ]
      );

      // Update player_stats for real players only
      if (player.oddsUserId && !player.isBot) {
        await query(
          `UPDATE player_stats SET
            games_played = games_played + 1,
            games_won = games_won + $2,
            total_kills = total_kills + $3,
            total_deaths = total_deaths + $4,
            total_assists = total_assists + $5,
            total_gold_earned = total_gold_earned + $6,
            total_damage_dealt = total_damage_dealt + $7,
            mmr = GREATEST(0, mmr + $8),
            updated_at = NOW()
           WHERE user_id = $1`,
          [
            player.oddsUserId,
            player.isWinner ? 1 : 0,
            player.kills,
            player.deaths,
            player.assists,
            player.goldEarned,
            player.damageDealt,
            mmrChange,
          ]
        );

        // Update hero_stats (upsert)
        await query(
          `INSERT INTO hero_stats (user_id, hero_id, games_played, games_won, total_kills, total_deaths, total_assists)
           VALUES ($1, $2, 1, $3, $4, $5, $6)
           ON CONFLICT (user_id, hero_id) DO UPDATE SET
             games_played = hero_stats.games_played + 1,
             games_won = hero_stats.games_won + $3,
             total_kills = hero_stats.total_kills + $4,
             total_deaths = hero_stats.total_deaths + $5,
             total_assists = hero_stats.total_assists + $6,
             updated_at = NOW()`,
          [
            player.oddsUserId,
            player.heroId,
            player.isWinner ? 1 : 0,
            player.kills,
            player.deaths,
            player.assists,
          ]
        );
      }
    }

    console.log(`Match ${result.matchId} saved to database`);
    return result.matchId;
  } catch (error) {
    console.error('Error saving match result:', error);
    return null;
  }
}

export async function getMatchById(matchId: string): Promise<MatchResult | null> {
  const match = await queryOne<{
    id: string;
    started_at: Date;
    ended_at: Date;
    duration_seconds: number;
    winner: string;
    radiant_score: number;
    dire_score: number;
  }>(
    'SELECT * FROM match_history WHERE id = $1',
    [matchId]
  );

  if (!match) return null;

  const players = await query<{
    user_id: string | null;
    team: string;
    hero_id: string;
    kills: number;
    deaths: number;
    assists: number;
    gold_earned: number;
    damage_dealt: number;
    is_winner: boolean;
  }>(
    'SELECT * FROM match_players WHERE match_id = $1',
    [matchId]
  );

  return {
    matchId: match.id,
    startedAt: match.started_at,
    endedAt: match.ended_at,
    durationSeconds: match.duration_seconds,
    winner: match.winner as 'radiant' | 'dire',
    radiantScore: match.radiant_score,
    direScore: match.dire_score,
    players: players.map(p => ({
      oddsUserId: p.user_id,
      team: p.team as 'radiant' | 'dire',
      heroId: p.hero_id,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      goldEarned: p.gold_earned,
      damageDealt: p.damage_dealt,
      isWinner: p.is_winner,
      displayName: '',
      isBot: !p.user_id,
    })),
  };
}
