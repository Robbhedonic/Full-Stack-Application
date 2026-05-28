import { randomBytes } from 'node:crypto';

const sessions = new Map();

export function createSession(userId) {
  const sessionId = randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId, createdAt: Date.now() });
  return sessionId;
}

export function getSessionUserId(sessionId) {
  return sessions.get(sessionId)?.userId ?? null;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

export function clearSessionsForTests() {
  sessions.clear();
}
