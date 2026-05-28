import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const users = [];
const sessions = new Map();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export function createUser({ name, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { error: 'Email already registered' };
  }

  const user = {
    id: `user-${users.length + 1}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  return { user: toPublicUser(user) };
}

export function authenticateUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((record) => record.email === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Invalid email or password' };
  }

  return { user: toPublicUser(user) };
}

export function findUserById(id) {
  const user = users.find((record) => record.id === id);
  return user ? toPublicUser(user) : null;
}

export function createSession(userId) {
  const sessionId = randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId, createdAt: Date.now() });
  return sessionId;
}

export function getSessionUserId(sessionId) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  return session?.userId ?? null;
}

export function deleteSession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

export function clearSessionsForTests() {
  sessions.clear();
  users.length = 0;
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
