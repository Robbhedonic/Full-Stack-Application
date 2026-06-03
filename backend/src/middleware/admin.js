import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { getSessionUserId } from '../lib/sessions.js';
import { SESSION_COOKIE } from './auth.js';

export async function requireAdmin(req, res, next) {
  const userId = await getSessionUserId(req.cookies?.[SESSION_COOKIE]);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.user = user;
  return next();
}
