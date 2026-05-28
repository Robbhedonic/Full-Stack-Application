import { findUserById, getSessionUserId } from '../users.js';

const SESSION_COOKIE = 'petcare_session';

export { SESSION_COOKIE };

export function requireAuth(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  const userId = getSessionUserId(sessionId);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = user;
  return next();
}
