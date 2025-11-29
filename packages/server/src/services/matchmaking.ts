import { v4 as uuidv4 } from 'uuid';
import {
  removeFromQueue,
  getQueueSize,
  getAllQueueEntries,
  type QueueEntry,
} from './redis.js';

export interface MatchPlayer {
  userId: string;
  username: string;
  mmr: number;
  isBot: boolean;
  team: 'radiant' | 'dire';
  preferredRoles: string[];
}

export interface MatchConfig {
  matchId: string;
  players: MatchPlayer[];
  createdAt: number;
}

// Bot names for filling empty slots
const BOT_NAMES = [
  'ShadowBot', 'IronGuard', 'FlameSeeker', 'FrostByte',
  'ThunderStrike', 'NightHawk', 'StormBringer', 'DarkMage',
  'LightWarrior', 'SwiftBlade', 'SilentKnight', 'DragonSlayer',
  'MoonWalker', 'SunRider', 'StarGazer', 'VoidHunter',
];

// Minimum players required to start a match (rest filled with bots)
const MIN_PLAYERS_TO_START = 2;
const TEAM_SIZE = 5;
const TOTAL_PLAYERS = TEAM_SIZE * 2;

// MMR range expansion settings
const BASE_MMR_RANGE = 200;      // Initial MMR range (+/- 200)
const MAX_MMR_RANGE = 2000;      // Maximum MMR range after expansion
const MMR_EXPANSION_RATE = 100;  // Expand by 100 MMR per 10 seconds in queue
const MMR_EXPANSION_INTERVAL = 10000; // 10 seconds

function createBot(team: 'radiant' | 'dire', index: number): MatchPlayer {
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + `_${index}`;
  const botMmr = 800 + Math.floor(Math.random() * 400); // 800-1200 MMR

  return {
    userId: `bot_${uuidv4()}`,
    username: botName,
    mmr: botMmr,
    isBot: true,
    team,
    preferredRoles: [],
  };
}

function distributePlayersToTeams(players: QueueEntry[]): MatchPlayer[] {
  // Sort by MMR for balanced teams
  const sorted = [...players].sort((a, b) => b.mmr - a.mmr);
  const matchPlayers: MatchPlayer[] = [];

  // Alternate assignment for balanced teams
  sorted.forEach((player, index) => {
    const team = index % 2 === 0 ? 'radiant' : 'dire';
    matchPlayers.push({
      userId: player.userId,
      username: player.userId, // Will be updated when player joins
      mmr: player.mmr,
      isBot: false,
      team,
      preferredRoles: player.preferredRoles,
    });
  });

  return matchPlayers;
}

function fillWithBots(players: MatchPlayer[]): MatchPlayer[] {
  const radiantCount = players.filter(p => p.team === 'radiant').length;
  const direCount = players.filter(p => p.team === 'dire').length;

  let botIndex = 0;

  // Fill radiant team
  for (let i = radiantCount; i < TEAM_SIZE; i++) {
    players.push(createBot('radiant', botIndex++));
  }

  // Fill dire team
  for (let i = direCount; i < TEAM_SIZE; i++) {
    players.push(createBot('dire', botIndex++));
  }

  return players;
}

/**
 * Calculate MMR range based on time in queue
 * Range expands over time to ensure players eventually find matches
 */
function calculateMmrRange(timeInQueueMs: number): number {
  const expansions = Math.floor(timeInQueueMs / MMR_EXPANSION_INTERVAL);
  const expandedRange = BASE_MMR_RANGE + (expansions * MMR_EXPANSION_RATE);
  return Math.min(expandedRange, MAX_MMR_RANGE);
}

/**
 * Find compatible players for a given anchor player
 * Uses MMR range that expands based on wait time
 */
function findCompatiblePlayers(
  anchor: QueueEntry,
  allPlayers: QueueEntry[],
  maxPlayers: number
): QueueEntry[] {
  const now = Date.now();
  const anchorWaitTime = now - anchor.joinedAt;
  const mmrRange = calculateMmrRange(anchorWaitTime);

  const minMmr = anchor.mmr - mmrRange;
  const maxMmr = anchor.mmr + mmrRange;

  // Filter compatible players (within MMR range)
  const compatible = allPlayers.filter(p => {
    if (p.userId === anchor.userId) return true; // Include anchor
    return p.mmr >= minMmr && p.mmr <= maxMmr;
  });

  // Sort by wait time (longest waiting first) then by MMR proximity
  compatible.sort((a, b) => {
    // Prioritize longer wait times
    const waitDiff = (now - b.joinedAt) - (now - a.joinedAt);
    if (Math.abs(waitDiff) > 5000) return waitDiff; // 5 sec threshold

    // Then by MMR proximity to anchor
    return Math.abs(a.mmr - anchor.mmr) - Math.abs(b.mmr - anchor.mmr);
  });

  return compatible.slice(0, maxPlayers);
}

export async function tryCreateMatch(): Promise<MatchConfig | null> {
  const queueSize = await getQueueSize();

  // Need at least MIN_PLAYERS_TO_START players
  if (queueSize < MIN_PLAYERS_TO_START) {
    return null;
  }

  // Get all players from queue
  const allPlayers = await getAllQueueEntries();

  if (allPlayers.length < MIN_PLAYERS_TO_START) {
    return null;
  }

  // Sort by wait time (longest waiting = highest priority)
  allPlayers.sort((a, b) => a.joinedAt - b.joinedAt);

  // Use longest-waiting player as anchor
  const anchor = allPlayers[0];
  const now = Date.now();
  const anchorWaitTime = now - anchor.joinedAt;
  const mmrRange = calculateMmrRange(anchorWaitTime);

  // Find compatible players for this anchor
  const compatiblePlayers = findCompatiblePlayers(anchor, allPlayers, TOTAL_PLAYERS);

  if (compatiblePlayers.length < MIN_PLAYERS_TO_START) {
    // Not enough compatible players yet, wait for MMR range to expand
    return null;
  }

  // Select players for this match
  const selectedPlayers = compatiblePlayers.slice(0, Math.min(compatiblePlayers.length, TOTAL_PLAYERS));

  // Remove selected players from queue
  for (const player of selectedPlayers) {
    await removeFromQueue(player.userId);
  }

  // Distribute to teams with better balancing
  let matchPlayers = distributePlayersToTeams(selectedPlayers);

  // Fill remaining slots with bots
  matchPlayers = fillWithBots(matchPlayers);

  const matchConfig: MatchConfig = {
    matchId: uuidv4(),
    players: matchPlayers,
    createdAt: Date.now(),
  };

  // Calculate stats for logging
  const realPlayers = matchPlayers.filter(p => !p.isBot);
  const avgMmr = realPlayers.reduce((sum, p) => sum + p.mmr, 0) / (realPlayers.length || 1);
  const radiantMmr = realPlayers.filter(p => p.team === 'radiant').reduce((sum, p) => sum + p.mmr, 0);
  const direMmr = realPlayers.filter(p => p.team === 'dire').reduce((sum, p) => sum + p.mmr, 0);

  console.log(`Match created: ${matchConfig.matchId}`);
  console.log(`  Real players: ${selectedPlayers.length}, Bots: ${TOTAL_PLAYERS - selectedPlayers.length}`);
  console.log(`  MMR range used: ±${mmrRange} (anchor waited ${Math.floor(anchorWaitTime / 1000)}s)`);
  console.log(`  Avg MMR: ${Math.round(avgMmr)}, Team balance: Radiant ${radiantMmr} vs Dire ${direMmr}`);
  console.log(`  Radiant: ${matchPlayers.filter(p => p.team === 'radiant').map(p => p.isBot ? `[BOT]` : `${p.userId.slice(0, 8)}(${p.mmr})`).join(', ')}`);
  console.log(`  Dire: ${matchPlayers.filter(p => p.team === 'dire').map(p => p.isBot ? `[BOT]` : `${p.userId.slice(0, 8)}(${p.mmr})`).join(', ')}`);

  return matchConfig;
}

// Matchmaking loop - runs periodically
let matchmakingInterval: ReturnType<typeof setInterval> | null = null;

export function startMatchmaking(
  onMatchFound: (match: MatchConfig) => void,
  intervalMs: number = 5000
): void {
  if (matchmakingInterval) {
    return;
  }

  console.log(`Matchmaking started (checking every ${intervalMs}ms, min ${MIN_PLAYERS_TO_START} players)`);

  matchmakingInterval = setInterval(async () => {
    try {
      const match = await tryCreateMatch();
      if (match) {
        onMatchFound(match);
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
    }
  }, intervalMs);
}

export function stopMatchmaking(): void {
  if (matchmakingInterval) {
    clearInterval(matchmakingInterval);
    matchmakingInterval = null;
    console.log('Matchmaking stopped');
  }
}
