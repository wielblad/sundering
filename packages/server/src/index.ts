import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';

import { config } from './config/index.js';
import { initDatabase, pool } from './services/database.js';
import { redis, setMatchNotification } from './services/redis.js';
import authRoutes from './api/routes/auth.js';
import { LobbyRoom } from './rooms/LobbyRoom.js';
import { GameRoom } from './rooms/GameRoom.js';
import { startMatchmaking, type MatchConfig } from './services/matchmaking.js';

async function main() {
  const app = express();

  // Middleware
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/auth', authRoutes);

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Colyseus server
  const gameServer = new Server({
    transport: new WebSocketTransport({ server: httpServer }),
  });

  // Define rooms
  gameServer.define('lobby', LobbyRoom);
  gameServer.define('game', GameRoom);

  // Colyseus monitor (dev only)
  if (config.env === 'development') {
    app.use('/colyseus', monitor());
  }

  // Store active game rooms for matchmaking
  const activeGames = new Map<string, string>(); // matchId -> roomId

  // Matchmaking callback - creates game room when match is found
  const onMatchFound = async (match: MatchConfig) => {
    try {
      // Create a new game room
      const room = await matchMaker.createRoom('game', { matchConfig: match });
      activeGames.set(match.matchId, room.roomId);

      console.log(`Game room created: ${room.roomId} for match ${match.matchId}`);

      // Store match notification for each real player
      const realPlayers = match.players.filter(p => !p.isBot);
      for (const player of realPlayers) {
        await setMatchNotification(player.userId, {
          matchId: match.matchId,
          roomId: room.roomId,
          team: player.team,
        });
        console.log(`  Match notification stored for player ${player.userId}`);
      }

      // Store match info in Redis for players to retrieve
      await redis.setex(
        `match:${match.matchId}`,
        300, // 5 minutes TTL
        JSON.stringify({
          matchId: match.matchId,
          roomId: room.roomId,
          players: match.players.map(p => ({
            userId: p.userId,
            username: p.username,
            mmr: p.mmr,
            isBot: p.isBot,
            team: p.team,
            preferredRoles: p.preferredRoles,
          })),
          createdAt: match.createdAt,
        })
      );
    } catch (error) {
      console.error('Failed to create game room:', error);
    }
  };

  // Start matchmaking service
  startMatchmaking(onMatchFound, 3000); // Check every 3 seconds

  // Initialize database
  try {
    await initDatabase();
    console.log('Database initialized');
  } catch (error) {
    console.warn('Database initialization failed (this is okay if DB is not running):', error);
  }

  // Start server
  await gameServer.listen(config.port);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗  ██╗                ║
║   ██╔══██╗██║   ██║████╗  ██║██╔════╝██║  ██║                ║
║   ██████╔╝██║   ██║██╔██╗ ██║██║     ███████║                ║
║   ██╔═══╝ ██║   ██║██║╚██╗██║██║     ██╔══██║                ║
║   ██║     ╚██████╔╝██║ ╚████║╚██████╗██║  ██║                ║
║   ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝                ║
║                                                               ║
║   Game Server v${config.env === 'development' ? 'DEV' : 'PROD'}                                         ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   HTTP:      http://localhost:${config.port}                          ║
║   WebSocket: ws://localhost:${config.port}                            ║
║   Monitor:   http://localhost:${config.port}/colyseus                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');

    await gameServer.gracefullyShutdown();
    await pool.end();
    redis.disconnect();

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(console.error);
