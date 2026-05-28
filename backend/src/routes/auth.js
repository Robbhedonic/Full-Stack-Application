import { Router } from 'express';
import { SESSION_COOKIE, requireAuth } from '../middleware/auth.js';
import {
  authenticateUser,
  createSession,
  createUser,
  deleteSession,
  findUserById,
  getSessionUserId,
} from '../users.js';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function attachSession(res, userId) {
  const sessionId = createSession(userId);
  res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions());
}

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing registration fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const result = createUser({ name, email, password, role });
  if (result.error) {
    return res.status(409).json({ error: result.error });
  }

  attachSession(res, result.user.id);
  return res.status(201).json({ user: result.user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = authenticateUser({ email, password });
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }

  attachSession(res, result.user.id);
  return res.json({ user: result.user });
});

router.post('/logout', (req, res) => {
  deleteSession(req.cookies?.[SESSION_COOKIE]);
  const { maxAge: _ignored, ...clearOptions } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, clearOptions);
  return res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const userId = getSessionUserId(req.cookies?.[SESSION_COOKIE]);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  return res.json({ user });
});

router.get('/protected', requireAuth, (req, res) => {
  return res.json({ message: 'Protected content available', user: req.user });
});

export default router;
