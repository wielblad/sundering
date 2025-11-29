import { Client, Room } from 'colyseus.js';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

class ColyseusService {
  private client: Client;
  private lobbyRoom: Room | null = null;
  private gameRoom: Room | null = null;

  constructor() {
    this.client = new Client(WS_URL);
  }

  async joinLobby(token: string): Promise<Room> {
    if (this.lobbyRoom) {
      return this.lobbyRoom;
    }

    this.lobbyRoom = await this.client.joinOrCreate('lobby', { token });
    return this.lobbyRoom;
  }

  async leaveLobby(): Promise<void> {
    if (this.lobbyRoom) {
      await this.lobbyRoom.leave();
      this.lobbyRoom = null;
    }
  }

  getLobbyRoom(): Room | null {
    return this.lobbyRoom;
  }

  async joinGame(roomId: string, matchId: string, token: string): Promise<Room> {
    if (this.gameRoom) {
      await this.leaveGame();
    }

    this.gameRoom = await this.client.joinById(roomId, {
      token,
      matchId,
    });
    return this.gameRoom;
  }

  async leaveGame(): Promise<void> {
    if (this.gameRoom) {
      await this.gameRoom.leave();
      this.gameRoom = null;
    }
  }

  getGameRoom(): Room | null {
    return this.gameRoom;
  }

  getClient(): Client {
    return this.client;
  }
}

export const colyseusService = new ColyseusService();
