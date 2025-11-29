import type { HeroState } from './hero';

export type GamePhase =
  | 'waiting'
  | 'hero_select'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended';

export type Team = 'radiant' | 'dire';

export interface PlayerInfo {
  id: string;
  name: string;
  team: Team;
  heroId: string | null;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
}

export interface GameConfig {
  maxPlayers: number;
  teamSize: number;
  heroSelectTime: number;   // seconds
  respawnTimeBase: number;  // base respawn time
  respawnTimePerLevel: number;
  goldPerSecond: number;
  startingGold: number;
  experienceRange: number;  // units to receive XP
  killsToWin: number;       // team kills to win
  maxGameTime: number;      // max game time in seconds
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  gameTime: number;         // seconds since game start
  players: Map<string, PlayerInfo>;
  heroes: Map<string, HeroState>;
  radiantScore: number;
  direScore: number;
  winner: Team | null;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}
