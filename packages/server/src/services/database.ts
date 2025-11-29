import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(32) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(64),
        avatar_url VARCHAR(512),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE,
        is_banned BOOLEAN DEFAULT FALSE,
        ban_reason TEXT
      );
    `);

    // Create player_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_stats (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        total_kills INTEGER DEFAULT 0,
        total_deaths INTEGER DEFAULT 0,
        total_assists INTEGER DEFAULT 0,
        total_gold_earned BIGINT DEFAULT 0,
        total_damage_dealt BIGINT DEFAULT 0,
        total_healing_done BIGINT DEFAULT 0,
        mmr INTEGER DEFAULT 1000,
        rank_tier VARCHAR(32) DEFAULT 'unranked',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create hero_stats table (per-hero statistics for each player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS hero_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hero_id VARCHAR(64) NOT NULL,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        total_kills INTEGER DEFAULT 0,
        total_deaths INTEGER DEFAULT 0,
        total_assists INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, hero_id)
      );
    `);

    // Create match_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ended_at TIMESTAMP WITH TIME ZONE,
        duration_seconds INTEGER,
        winner VARCHAR(16),
        game_mode VARCHAR(32) DEFAULT 'standard',
        map_id VARCHAR(64) DEFAULT 'main',
        radiant_score INTEGER DEFAULT 0,
        dire_score INTEGER DEFAULT 0
      );
    `);

    // Create match_players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID NOT NULL REFERENCES match_history(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        team VARCHAR(16) NOT NULL,
        hero_id VARCHAR(64) NOT NULL,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        gold_earned INTEGER DEFAULT 0,
        damage_dealt INTEGER DEFAULT 0,
        healing_done INTEGER DEFAULT 0,
        is_winner BOOLEAN DEFAULT FALSE,
        mmr_change INTEGER DEFAULT 0
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_player_stats_mmr ON player_stats(mmr DESC);
      CREATE INDEX IF NOT EXISTS idx_hero_stats_user ON hero_stats(user_id);
      CREATE INDEX IF NOT EXISTS idx_match_history_started ON match_history(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id);
      CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) || null;
}
