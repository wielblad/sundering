import { Schema, MapSchema, ArraySchema, defineTypes } from '@colyseus/schema';

export class ChatMessage extends Schema {
  id: string = '';
  senderId: string = '';
  senderName: string = '';
  content: string = '';
  timestamp: number = 0;
  isSystem: boolean = false;
}

defineTypes(ChatMessage, {
  id: 'string',
  senderId: 'string',
  senderName: 'string',
  content: 'string',
  timestamp: 'number',
  isSystem: 'boolean',
});

export class LobbyPlayer extends Schema {
  id: string = '';
  username: string = '';
  displayName: string = '';
  avatarUrl: string = '';
  mmr: number = 1000;
  rankTier: string = 'unranked';
  status: string = 'idle';
  joinedAt: number = 0;
}

defineTypes(LobbyPlayer, {
  id: 'string',
  username: 'string',
  displayName: 'string',
  avatarUrl: 'string',
  mmr: 'number',
  rankTier: 'string',
  status: 'string',
  joinedAt: 'number',
});

export class LobbyState extends Schema {
  players = new MapSchema<LobbyPlayer>();
  messages = new ArraySchema<ChatMessage>();
  queueCount: number = 0;
  onlineCount: number = 0;
  gamesInProgress: number = 0;
}

defineTypes(LobbyState, {
  players: { map: LobbyPlayer },
  messages: [ChatMessage],
  queueCount: 'number',
  onlineCount: 'number',
  gamesInProgress: 'number',
});
