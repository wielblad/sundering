import type { Vector3 } from './game';

// Client -> Server Messages
export interface MoveCommand {
  type: 'move';
  target: Vector3;
}

export interface AttackCommand {
  type: 'attack';
  targetId: string;
}

export interface CastAbilityCommand {
  type: 'cast';
  abilitySlot: string;
  target?: Vector3;
  targetId?: string;
}

export interface SelectHeroCommand {
  type: 'select_hero';
  heroId: string;
}

export interface ReadyCommand {
  type: 'ready';
}

export interface ChatMessage {
  type: 'chat';
  message: string;
  teamOnly: boolean;
}

export type ClientMessage =
  | MoveCommand
  | AttackCommand
  | CastAbilityCommand
  | SelectHeroCommand
  | ReadyCommand
  | ChatMessage;

// Server -> Client Messages
export interface GameStartMessage {
  type: 'game_start';
  gameTime: number;
}

export interface HeroKillMessage {
  type: 'hero_kill';
  killerId: string;
  victimId: string;
  assistIds: string[];
}

export interface GameEndMessage {
  type: 'game_end';
  winner: 'radiant' | 'dire';
  stats: Record<string, unknown>;
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export type ServerMessage =
  | GameStartMessage
  | HeroKillMessage
  | GameEndMessage
  | ErrorMessage;
