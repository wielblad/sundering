import { Room, Client } from '@colyseus/core';
import { v4 as uuidv4 } from 'uuid';
import { LobbyState, LobbyPlayer, ChatMessage } from './schemas/LobbyState.js';
import { verifyToken, getUserProfile } from '../services/auth.js';
import {
  setOnline,
  setOffline,
  getQueueSize,
  addToQueue,
  removeFromQueue,
  getMatchNotification,
  clearMatchNotification,
  getQueueStatus,
  isInQueue
} from '../services/redis.js';

interface JoinOptions {
  token: string;
}

interface ChatMessagePayload {
  content: string;
}

interface JoinQueuePayload {
  preferredRoles: string[];
}

const MAX_MESSAGES = 100;

export class LobbyRoom extends Room<LobbyState> {
  maxClients = 1000;

  onCreate() {
    this.setState(new LobbyState());

    // Handle chat messages
    this.onMessage('chat', (client, message: ChatMessagePayload) => {
      this.handleChatMessage(client, message);
    });

    // Handle queue actions
    this.onMessage('join_queue', (client, payload: JoinQueuePayload) => {
      this.handleJoinQueue(client, payload);
    });

    this.onMessage('leave_queue', (client) => {
      this.handleLeaveQueue(client);
    });

    // Update stats periodically
    this.clock.setInterval(() => {
      this.updateStats();
    }, 5000);

    // Check for match notifications for players in queue
    this.clock.setInterval(() => {
      this.checkMatchNotifications();
    }, 1000);

    // Send queue status updates to players in queue
    this.clock.setInterval(() => {
      this.sendQueueStatusUpdates();
    }, 2000);

    console.log('Lobby room created');
  }

  async onAuth(_client: Client, options: JoinOptions): Promise<{ userId: string; username: string }> {
    if (!options.token) {
      throw new Error('Authentication required');
    }

    const payload = verifyToken(options.token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    return payload;
  }

  async onJoin(client: Client, _options: JoinOptions, auth?: { userId: string; username: string }) {
    if (!auth) {
      throw new Error('Authentication required');
    }
    const profile = await getUserProfile(auth.userId);

    if (!profile) {
      throw new Error('User not found');
    }

    // Create player state
    const player = new LobbyPlayer();
    player.id = auth.userId;
    player.username = profile.username;
    player.displayName = profile.display_name || profile.username;
    player.avatarUrl = profile.avatar_url || '';
    player.mmr = profile.stats?.mmr || 1000;
    player.rankTier = profile.stats?.rank_tier || 'unranked';
    player.status = 'idle';
    player.joinedAt = Date.now();

    // Store player reference
    client.userData = { userId: auth.userId, username: auth.username, player };

    // Add to state
    this.state.players.set(client.sessionId, player);
    this.state.onlineCount = this.state.players.size;

    // Mark as online in Redis
    await setOnline(auth.userId, this.roomId);

    // System message
    this.addSystemMessage(`${player.displayName} joined the lobby`);

    console.log(`Player ${auth.username} joined lobby`);
  }

  async onLeave(client: Client, _consented: boolean) {
    const userData = client.userData as { userId: string; username: string; player: LobbyPlayer } | undefined;

    if (userData) {
      // Remove from queue if in queue
      if (userData.player.status === 'in_queue') {
        await removeFromQueue(userData.userId);
      }

      // Mark as offline
      await setOffline(userData.userId);

      // Remove from state
      this.state.players.delete(client.sessionId);
      this.state.onlineCount = this.state.players.size;

      // System message
      this.addSystemMessage(`${userData.player.displayName} left the lobby`);

      console.log(`Player ${userData.username} left lobby`);
    }
  }

  onDispose() {
    console.log('Lobby room disposed');
  }

  private handleChatMessage(client: Client, payload: ChatMessagePayload) {
    const userData = client.userData as { userId: string; username: string; player: LobbyPlayer } | undefined;

    if (!userData || !payload.content) return;

    const content = payload.content.trim().slice(0, 500); // Limit message length
    if (!content) return;

    const message = new ChatMessage();
    message.id = uuidv4();
    message.senderId = userData.userId;
    message.senderName = userData.player.displayName;
    message.content = content;
    message.timestamp = Date.now();
    message.isSystem = false;

    this.addMessage(message);
  }

  private async handleJoinQueue(client: Client, payload: JoinQueuePayload) {
    const userData = client.userData as { userId: string; username: string; player: LobbyPlayer } | undefined;

    if (!userData) return;
    if (userData.player.status !== 'idle') return;

    // Add to Redis queue
    await addToQueue({
      userId: userData.userId,
      mmr: userData.player.mmr,
      joinedAt: Date.now(),
      preferredRoles: payload.preferredRoles || [],
    });

    // Update player status
    userData.player.status = 'in_queue';

    // Update queue count
    this.state.queueCount = await getQueueSize();

    client.send('queue_joined', { position: this.state.queueCount });
  }

  private async handleLeaveQueue(client: Client) {
    const userData = client.userData as { userId: string; username: string; player: LobbyPlayer } | undefined;

    if (!userData) return;
    if (userData.player.status !== 'in_queue') return;

    // Remove from Redis queue
    await removeFromQueue(userData.userId);

    // Update player status
    userData.player.status = 'idle';

    // Update queue count
    this.state.queueCount = await getQueueSize();

    client.send('queue_left', {});
  }

  private addSystemMessage(content: string) {
    const message = new ChatMessage();
    message.id = uuidv4();
    message.senderId = 'system';
    message.senderName = 'System';
    message.content = content;
    message.timestamp = Date.now();
    message.isSystem = true;

    this.addMessage(message);
  }

  private addMessage(message: ChatMessage) {
    this.state.messages.push(message);

    // Keep only last N messages
    while (this.state.messages.length > MAX_MESSAGES) {
      this.state.messages.shift();
    }
  }

  private async updateStats() {
    this.state.queueCount = await getQueueSize();
    this.state.onlineCount = this.state.players.size;
  }

  private async checkMatchNotifications() {
    // Check each player in queue for match notifications
    for (const [sessionId, player] of this.state.players.entries()) {
      if (player.status !== 'in_queue') continue;

      const client = this.clients.find(c => c.sessionId === sessionId);
      if (!client) continue;

      const userData = client.userData as { userId: string; username: string; player: LobbyPlayer } | undefined;
      if (!userData) continue;

      const notification = await getMatchNotification(userData.userId);
      if (notification) {
        // Clear the notification
        await clearMatchNotification(userData.userId);

        // Update player status
        userData.player.status = 'in_match';

        // Send match found to client
        client.send('match_found', {
          matchId: notification.matchId,
          roomId: notification.roomId,
          team: notification.team,
        });

        console.log(`Match notification sent to ${userData.username}: ${notification.matchId}`);
      }
    }
  }

  private async sendQueueStatusUpdates() {
    // Send queue status to all players in queue
    for (const [sessionId, player] of this.state.players.entries()) {
      if (player.status !== 'in_queue') continue;

      const client = this.clients.find(c => c.sessionId === sessionId);
      if (!client) continue;

      const userData = client.userData as { userId: string; username: string; player: LobbyPlayer } | undefined;
      if (!userData) continue;

      const status = await getQueueStatus(userData.userId);
      if (status) {
        client.send('queue_status', {
          position: status.position,
          queueSize: status.queueSize,
          estimatedWaitTime: status.estimatedWaitTime,
          timeInQueue: status.timeInQueue,
        });
      } else {
        // Player not in queue anymore (maybe removed), update status
        const stillInQueue = await isInQueue(userData.userId);
        if (!stillInQueue && userData.player.status === 'in_queue') {
          userData.player.status = 'idle';
          client.send('queue_left', { reason: 'removed' });
        }
      }
    }
  }
}
