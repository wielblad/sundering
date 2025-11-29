import { create } from 'zustand';
import { colyseusService } from '../services/colyseus';
import { useGameStore } from './gameStore';

interface LobbyPlayer {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  mmr: number;
  rankTier: string;
  status: 'idle' | 'in_queue' | 'in_game';
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isSystem: boolean;
}

interface MatchFoundData {
  matchId: string;
  roomId: string;
  team: 'radiant' | 'dire';
}

interface QueueStatusData {
  position: number;
  queueSize: number;
  estimatedWaitTime: number;
  timeInQueue: number;
}

interface LobbyState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  players: Map<string, LobbyPlayer>;
  messages: ChatMessage[];
  queueCount: number;
  onlineCount: number;
  gamesInProgress: number;

  inQueue: boolean;
  queuePosition: number;
  queueStatus: QueueStatusData | null;
  matchFound: MatchFoundData | null;

  // Actions
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string) => void;
  joinQueue: (preferredRoles: string[]) => void;
  leaveQueue: () => void;
  clearMatchFound: () => void;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,

  players: new Map(),
  messages: [],
  queueCount: 0,
  onlineCount: 0,
  gamesInProgress: 0,

  inQueue: false,
  queuePosition: 0,
  queueStatus: null,
  matchFound: null,

  connect: async (token: string) => {
    if (get().isConnected || get().isConnecting) return;

    set({ isConnecting: true, error: null });

    try {
      const room = await colyseusService.joinLobby(token);

      // Listen for state changes
      room.state.listen('onlineCount', (value: number) => {
        set({ onlineCount: value });
      });

      room.state.listen('queueCount', (value: number) => {
        set({ queueCount: value });
      });

      room.state.listen('gamesInProgress', (value: number) => {
        set({ gamesInProgress: value });
      });

      // Listen for player changes
      room.state.players.onAdd((player: any, key: string) => {
        const players = new Map(get().players);
        players.set(key, {
          id: player.id,
          username: player.username,
          displayName: player.displayName,
          avatarUrl: player.avatarUrl,
          mmr: player.mmr,
          rankTier: player.rankTier,
          status: player.status,
          joinedAt: player.joinedAt,
        });
        set({ players });

        // Listen for player property changes
        player.onChange(() => {
          const players = new Map(get().players);
          players.set(key, {
            id: player.id,
            username: player.username,
            displayName: player.displayName,
            avatarUrl: player.avatarUrl,
            mmr: player.mmr,
            rankTier: player.rankTier,
            status: player.status,
            joinedAt: player.joinedAt,
          });
          set({ players });
        });
      });

      room.state.players.onRemove((_player: any, key: string) => {
        const players = new Map(get().players);
        players.delete(key);
        set({ players });
      });

      // Listen for messages
      room.state.messages.onAdd((message: any) => {
        const messages = [...get().messages];
        messages.push({
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          isSystem: message.isSystem,
        });
        // Keep only last 100 messages
        if (messages.length > 100) {
          messages.shift();
        }
        set({ messages });
      });

      // Listen for queue events
      room.onMessage('queue_joined', (data: { position: number }) => {
        set({ inQueue: true, queuePosition: data.position, queueStatus: null });
      });

      room.onMessage('queue_left', () => {
        set({ inQueue: false, queuePosition: 0, queueStatus: null });
      });

      room.onMessage('queue_status', (data: QueueStatusData) => {
        set({ queueStatus: data, queuePosition: data.position });
      });

      room.onMessage('match_found', (data: { matchId: string; roomId: string; team: 'radiant' | 'dire' }) => {
        set({ inQueue: false, queuePosition: 0, queueStatus: null });
        // Store match info in game store
        useGameStore.getState().setMatchFound(data);
        // Navigate to game - this will be handled by the component
        set({ matchFound: data });
      });

      // Handle disconnection
      room.onLeave(() => {
        set({
          isConnected: false,
          players: new Map(),
          messages: [],
          inQueue: false,
          queueStatus: null,
        });
      });

      set({ isConnected: true, isConnecting: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      set({ isConnecting: false, error: message });
    }
  },

  disconnect: async () => {
    await colyseusService.leaveLobby();
    set({
      isConnected: false,
      players: new Map(),
      messages: [],
      inQueue: false,
      queuePosition: 0,
      queueStatus: null,
    });
  },

  sendMessage: (content: string) => {
    const room = colyseusService.getLobbyRoom();
    if (room) {
      room.send('chat', { content });
    }
  },

  joinQueue: (preferredRoles: string[]) => {
    const room = colyseusService.getLobbyRoom();
    if (room) {
      room.send('join_queue', { preferredRoles });
    }
  },

  leaveQueue: () => {
    const room = colyseusService.getLobbyRoom();
    if (room) {
      room.send('leave_queue');
    }
  },

  clearMatchFound: () => {
    set({ matchFound: null });
  },
}));
