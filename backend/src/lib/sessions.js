import { randomBytes } from 'node:crypto';
import { prisma } from './prisma.js';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId) {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: sessionId, userId, expiresAt },
  });

  return sessionId;
}

export async function getSessionUserId(sessionId) {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }

  return session.userId;
}

export async function deleteSession(sessionId) {
  if (!sessionId) return;
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function clearSessionsForTests() {
  await prisma.session.deleteMany();
}
