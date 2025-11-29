import { Router, Request, Response } from 'express';
import {
  register,
  login,
  logout,
  getUserProfile,
  registerSchema,
  loginSchema,
  verifyToken,
} from '../../services/auth.js';
import { checkRateLimit, getActiveGame } from '../../services/redis.js';

const router: ReturnType<typeof Router> = Router();

// Middleware to verify auth token
export async function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  (req as any).user = payload;
  next();
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Rate limit
    const ip = req.ip || 'unknown';
    const allowed = await checkRateLimit(`register:${ip}`, 5, 3600); // 5 per hour
    if (!allowed) {
      res.status(429).json({ error: 'Too many registration attempts. Try again later.' });
      return;
    }

    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, email, password } = validation.data;

    // Register user
    const result = await register(username, email, password);

    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Rate limit
    const ip = req.ip || 'unknown';
    const allowed = await checkRateLimit(`login:${ip}`, 10, 60); // 10 per minute
    if (!allowed) {
      res.status(429).json({ error: 'Too many login attempts. Try again later.' });
      return;
    }

    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = validation.data;

    // Login user
    const result = await login(username, password);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await logout(user.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = await getUserProfile(user.userId);

    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/auth/active-game - Check if user has an active game to reconnect to
router.get('/active-game', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const activeGame = await getActiveGame(user.userId);

    if (!activeGame) {
      res.json({ hasActiveGame: false });
      return;
    }

    // Check if there's a disconnect timestamp (user was disconnected)
    const canReconnect = activeGame.disconnectedAt !== undefined;

    res.json({
      hasActiveGame: true,
      canReconnect,
      matchId: activeGame.matchId,
      roomId: activeGame.roomId,
      team: activeGame.team,
      heroId: activeGame.heroId,
      disconnectedAt: activeGame.disconnectedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check active game' });
  }
});

export default router;
