import { prisma } from '../lib/prisma.js';
import { getSessionUserId } from '../lib/sessions.js';
import { serializeUser } from '../lib/serializers.js';

export const SESSION_COOKIE = 'petcare_session';

export async function requireAuth(req, res, next) {
  const userId = getSessionUserId(req.cookies?.[SESSION_COOKIE]);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = user;
  return next();
}

export async function attachUserIfPresent(req, _res, next) {
  const userId = getSessionUserId(req.cookies?.[SESSION_COOKIE]);
  if (userId) {
    req.user = await prisma.user.findUnique({ where: { id: userId } });
  }
  return next();
}

export function sendUser(res, user) {
  return res.json({ user: serializeUser(user) });
}
