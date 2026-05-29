import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { parseClientRole, serializeUser } from '../lib/serializers.js';
import { createSession, deleteSession, getSessionUserId } from '../lib/sessions.js';
import { SESSION_COOKIE, requireAuth } from '../middleware/auth.js';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function attachSession(res, userId) {
  const sessionId = createSession(userId);
  res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions());
}

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing registration fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const prismaRole = parseClientRole(role);
  if (!prismaRole) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (prismaRole === UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin accounts cannot be created via registration' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: prismaRole,
    },
  });

  attachSession(res, user.id);
  return res.status(201).json({ user: serializeUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  attachSession(res, user.id);
  return res.json({ user: serializeUser(user) });
});

router.post('/logout', (req, res) => {
  deleteSession(req.cookies?.[SESSION_COOKIE]);
  const clearOptions = { ...sessionCookieOptions() };
  delete clearOptions.maxAge;
  res.clearCookie(SESSION_COOKIE, clearOptions);
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const userId = getSessionUserId(req.cookies?.[SESSION_COOKIE]);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  return res.json({ user: serializeUser(user) });
});

router.get('/protected', requireAuth, (req, res) => {
  return res.json({
    message: 'Protected content available',
    user: serializeUser(req.user),
  });
});

export default router;
