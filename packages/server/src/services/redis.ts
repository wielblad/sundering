import Redis from 'ioredis';
import { config } from '../config/index.js';

export const redis = new Redis.default(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err: Error) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Session management
const SESSION_PREFIX = 'session:';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export async function setSession(userId: string, token: string): Promise<void> {
  await redis.setex(`${SESSION_PREFIX}${userId}`, SESSION_TTL, token);
}

export async function getSession(userId: string): Promise<string | null> {
  return redis.get(`${SESSION_PREFIX}${userId}`);
}

export async function deleteSession(userId: string): Promise<void> {
  await redis.del(`${SESSION_PREFIX}${userId}`);
}

// Online players tracking
const ONLINE_PREFIX = 'online:';
const ONLINE_TTL = 60 * 5; // 5 minutes

export async function setOnline(userId: string, roomId?: string): Promise<void> {
  const data = JSON.stringify({ roomId, timestamp: Date.now() });
  await redis.setex(`${ONLINE_PREFIX}${userId}`, ONLINE_TTL, data);
}

export async function isOnline(userId: string): Promise<boolean> {
  const result = await redis.exists(`${ONLINE_PREFIX}${userId}`);
  return result === 1;
}

export async function setOffline(userId: string): Promise<void> {
  await redis.del(`${ONLINE_PREFIX}${userId}`);
}

export async function getOnlineCount(): Promise<number> {
  const keys = await redis.keys(`${ONLINE_PREFIX}*`);
  return keys.length;
}

// Matchmaking queue
const QUEUE_KEY = 'matchmaking:queue';
const QUEUE_INDEX_PREFIX = 'queue:user:'; // Secondary index for O(1) removal

export interface QueueEntry {
  userId: string;
  mmr: number;
  joinedAt: number;
  preferredRoles: string[];
}

export interface QueueStatus {
  position: number;
  queueSize: number;
  estimatedWaitTime: number; // in seconds
  timeInQueue: number; // in seconds
}

export async function addToQueue(entry: QueueEntry): Promise<void> {
  const entryJson = JSON.stringify(entry);
  // Add to sorted set with MMR as score
  await redis.zadd(QUEUE_KEY, entry.mmr, entryJson);
  // Create secondary index for O(1) lookup/removal
  await redis.set(`${QUEUE_INDEX_PREFIX}${entry.userId}`, entryJson);
}

export async function removeFromQueue(userId: string): Promise<boolean> {
  // O(1) lookup using secondary index
  const entryJson = await redis.get(`${QUEUE_INDEX_PREFIX}${userId}`);
  if (!entryJson) {
    return false;
  }

  // Remove from sorted set and delete index
  await redis.zrem(QUEUE_KEY, entryJson);
  await redis.del(`${QUEUE_INDEX_PREFIX}${userId}`);
  return true;
}

export async function isInQueue(userId: string): Promise<boolean> {
  const exists = await redis.exists(`${QUEUE_INDEX_PREFIX}${userId}`);
  return exists === 1;
}

export async function getQueueEntry(userId: string): Promise<QueueEntry | null> {
  const entryJson = await redis.get(`${QUEUE_INDEX_PREFIX}${userId}`);
  if (!entryJson) return null;
  return JSON.parse(entryJson) as QueueEntry;
}

export async function getQueueByMmrRange(minMmr: number, maxMmr: number, limit: number): Promise<QueueEntry[]> {
  const entries = await redis.zrangebyscore(QUEUE_KEY, minMmr, maxMmr, 'LIMIT', 0, limit);
  return entries.map((e: string) => JSON.parse(e) as QueueEntry);
}

export async function getQueueSize(): Promise<number> {
  return redis.zcard(QUEUE_KEY);
}

export async function getAllQueueEntries(): Promise<QueueEntry[]> {
  const entries = await redis.zrange(QUEUE_KEY, 0, -1);
  return entries.map((e: string) => JSON.parse(e) as QueueEntry);
}

export async function getQueueStatus(userId: string): Promise<QueueStatus | null> {
  const entry = await getQueueEntry(userId);
  if (!entry) return null;

  const queueSize = await getQueueSize();
  const timeInQueue = Math.floor((Date.now() - entry.joinedAt) / 1000);

  // Get position (how many players have lower MMR + joined before)
  // Simplified: use rank in sorted set
  const entryJson = await redis.get(`${QUEUE_INDEX_PREFIX}${userId}`);
  const position = entryJson ? await redis.zrank(QUEUE_KEY, entryJson) : 0;

  // Estimate wait time based on queue size and average match creation rate
  // Assumes ~1 match per 5 seconds when queue has players
  const estimatedWaitTime = Math.max(0, Math.ceil((queueSize / 2) * 5) - timeInQueue);

  return {
    position: (position ?? 0) + 1,
    queueSize,
    estimatedWaitTime,
    timeInQueue,
  };
}

// Rate limiting
const RATE_LIMIT_PREFIX = 'ratelimit:';

export async function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const fullKey = `${RATE_LIMIT_PREFIX}${key}`;
  const current = await redis.incr(fullKey);

  if (current === 1) {
    await redis.expire(fullKey, windowSeconds);
  }

  return current <= maxRequests;
}

// Match notifications - store match info for specific users
const MATCH_NOTIFICATION_PREFIX = 'match:notification:';
const MATCH_NOTIFICATION_TTL = 60; // 1 minute

export interface MatchNotification {
  matchId: string;
  roomId: string;
  team: 'radiant' | 'dire';
}

export async function setMatchNotification(userId: string, notification: MatchNotification): Promise<void> {
  await redis.setex(
    `${MATCH_NOTIFICATION_PREFIX}${userId}`,
    MATCH_NOTIFICATION_TTL,
    JSON.stringify(notification)
  );
}

export async function getMatchNotification(userId: string): Promise<MatchNotification | null> {
  const data = await redis.get(`${MATCH_NOTIFICATION_PREFIX}${userId}`);
  if (!data) return null;
  return JSON.parse(data) as MatchNotification;
}

export async function clearMatchNotification(userId: string): Promise<void> {
  await redis.del(`${MATCH_NOTIFICATION_PREFIX}${userId}`);
}

// Active game tracking for reconnection
const ACTIVE_GAME_PREFIX = 'active:game:';
const ACTIVE_GAME_TTL = 60 * 30; // 30 minutes (max game duration)

export interface ActiveGameInfo {
  matchId: string;
  roomId: string;
  team: 'radiant' | 'dire';
  heroId: string;
  disconnectedAt?: number;
}

export async function setActiveGame(userId: string, gameInfo: ActiveGameInfo): Promise<void> {
  await redis.setex(
    `${ACTIVE_GAME_PREFIX}${userId}`,
    ACTIVE_GAME_TTL,
    JSON.stringify(gameInfo)
  );
}

export async function getActiveGame(userId: string): Promise<ActiveGameInfo | null> {
  const data = await redis.get(`${ACTIVE_GAME_PREFIX}${userId}`);
  if (!data) return null;
  return JSON.parse(data) as ActiveGameInfo;
}

export async function clearActiveGame(userId: string): Promise<void> {
  await redis.del(`${ACTIVE_GAME_PREFIX}${userId}`);
}

export async function updateActiveGameDisconnect(userId: string): Promise<void> {
  const gameInfo = await getActiveGame(userId);
  if (gameInfo) {
    gameInfo.disconnectedAt = Date.now();
    await setActiveGame(userId, gameInfo);
  }
}
