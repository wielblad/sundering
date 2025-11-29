import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../config/index.js';
import { query, queryOne } from './database.js';
import { setSession, deleteSession } from './redis.js';

// Validation schemas
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  is_banned: boolean;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  } as jwt.SignOptions);
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    return null;
  }
}

// Register new user
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  // Check if username exists
  const existingUsername = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE username = $1',
    [username.toLowerCase()]
  );

  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Check if email exists
  const existingEmail = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const userId = uuidv4();

  await query(
    `INSERT INTO users (id, username, email, password_hash, display_name)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, username.toLowerCase(), email.toLowerCase(), passwordHash, username]
  );

  // Create player stats
  await query(
    'INSERT INTO player_stats (user_id) VALUES ($1)',
    [userId]
  );

  // Get created user
  const user = await queryOne<User>(
    `SELECT id, username, email, display_name, avatar_url, created_at, is_banned
     FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  // Generate token
  const token = generateToken({ userId: user.id, username: user.username });

  // Store session
  await setSession(user.id, token);

  return { user, token };
}

// Login user
export async function login(username: string, password: string): Promise<AuthResponse> {
  // Find user
  const user = await queryOne<UserWithPassword>(
    `SELECT id, username, email, display_name, avatar_url, created_at, is_banned, password_hash
     FROM users WHERE username = $1`,
    [username.toLowerCase()]
  );

  if (!user) {
    throw new Error('Invalid username or password');
  }

  if (user.is_banned) {
    throw new Error('Account is banned');
  }

  // Verify password
  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  // Update last login
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  // Generate token
  const token = generateToken({ userId: user.id, username: user.username });

  // Store session
  await setSession(user.id, token);

  // Remove password_hash from response
  const { password_hash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

// Logout user
export async function logout(userId: string): Promise<void> {
  await deleteSession(userId);
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, username, email, display_name, avatar_url, created_at, is_banned
     FROM users WHERE id = $1`,
    [userId]
  );
}

// Get user profile with stats
export interface UserProfile extends User {
  stats: {
    games_played: number;
    games_won: number;
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    mmr: number;
    rank_tier: string;
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await queryOne<UserProfile & { stats: string }>(
    `SELECT
      u.id, u.username, u.email, u.display_name, u.avatar_url, u.created_at, u.is_banned,
      json_build_object(
        'games_played', ps.games_played,
        'games_won', ps.games_won,
        'total_kills', ps.total_kills,
        'total_deaths', ps.total_deaths,
        'total_assists', ps.total_assists,
        'mmr', ps.mmr,
        'rank_tier', ps.rank_tier
      ) as stats
     FROM users u
     LEFT JOIN player_stats ps ON ps.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  return result;
}
