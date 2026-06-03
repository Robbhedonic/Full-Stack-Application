import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  accountModeRequiresSitterProfile,
  deriveAccountMode,
  normalizeAccountMode,
  roleForAccountMode,
} from '../lib/accountMode.js';
import {
  extractCaregiverProfilePayload,
  parseCaregiverProfile,
  validateCaregiverProfile,
} from '../lib/caregiverProfile.js';
import {
  extractOwnerCarePayload,
  parseOwnerCareProfile,
  serializeOwnerCareFromUser,
  validateOwnerCareProfile,
} from '../lib/careDetails.js';
import { parseClientRole, serializeSitter, serializeUser } from '../lib/serializers.js';
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

async function attachSession(res, userId) {
  const sessionId = await createSession(userId);
  res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions());
}

function buildAuthResponse(user, sitterProfile) {
  return {
    user: serializeUser(user),
    sitterProfile: sitterProfile ? serializeSitter(sitterProfile) : null,
    ownerCare: serializeOwnerCareFromUser(user),
    accountMode: deriveAccountMode(user, sitterProfile),
  };
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

  return res.status(201).json({
    user: serializeUser(user),
    message: 'User created successfully',
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { sitterProfile: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await attachSession(res, user.id);

  return res.json(buildAuthResponse(user, user.sitterProfile));
});

async function saveCaregiverProfile(req, res, { create }) {
  if (req.user.role === UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admins cannot manage a sitter profile' });
  }

  const existing = await prisma.sitterProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (create && existing) {
    return res.status(409).json({ error: 'Caregiver profile already exists' });
  }

  if (!create && !existing) {
    return res.status(404).json({ error: 'Caregiver profile not found' });
  }

  const profilePayload = extractCaregiverProfilePayload(req.body);
  const profileError = validateCaregiverProfile(profilePayload);
  if (profileError) {
    return res.status(400).json({ error: profileError });
  }

  const sitterData = parseCaregiverProfile(
    profilePayload,
    req.user.name,
    existing?.rating ?? 5
  );

  const sitterProfile = create
    ? await prisma.sitterProfile.create({
        data: { userId: req.user.id, ...sitterData },
      })
    : await prisma.sitterProfile.update({
        where: { userId: req.user.id },
        data: sitterData,
      });

  const updatedUser = await prisma.user.findUnique({ where: { id: req.user.id } });

  return res.status(create ? 201 : 200).json({
    ...buildAuthResponse(updatedUser, sitterProfile),
    message: create ? 'Caregiver profile created' : 'Caregiver profile updated',
  });
}

router.post('/caregiver-profile', requireAuth, (req, res) =>
  saveCaregiverProfile(req, res, { create: true })
);

router.put('/caregiver-profile', requireAuth, (req, res) =>
  saveCaregiverProfile(req, res, { create: false })
);

router.put('/owner-care', requireAuth, async (req, res) => {
  if (req.user.role === UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admins cannot manage owner care details here' });
  }

  const payload = extractOwnerCarePayload(req.body);
  const profileError = validateOwnerCareProfile(payload);
  if (profileError) {
    return res.status(400).json({ error: profileError });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: parseOwnerCareProfile(payload),
  });

  const sitterProfile = await prisma.sitterProfile.findUnique({
    where: { userId: req.user.id },
  });

  return res.json({
    ...buildAuthResponse(updatedUser, sitterProfile),
    message: 'Owner care details saved',
  });
});

router.put('/account-mode', requireAuth, async (req, res) => {
  if (req.user.role === UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admins cannot change account mode here' });
  }

  const mode = normalizeAccountMode(req.body.mode);
  if (!mode) {
    return res.status(400).json({ error: 'Mode must be owner, caregiver, or both' });
  }

  const existingSitter = await prisma.sitterProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (mode === 'owner' && existingSitter) {
    const bookingCount = await prisma.booking.count({
      where: { sitterId: existingSitter.id },
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        error: 'Cannot switch to owner-only while you have active bookings as a caregiver.',
      });
    }

    await prisma.sitterProfile.delete({ where: { userId: req.user.id } });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      role: roleForAccountMode(mode),
      profileMode: mode,
    },
  });

  const sitterProfile = await prisma.sitterProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (accountModeRequiresSitterProfile(mode) && !sitterProfile) {
    return res.json({
      ...buildAuthResponse(updatedUser, null),
      message: 'Account mode saved. Add your caregiver details below.',
    });
  }

  return res.json({
    ...buildAuthResponse(updatedUser, sitterProfile),
    message: 'Account mode updated',
  });
});

router.delete('/caregiver-profile', requireAuth, async (req, res) => {
  const existing = await prisma.sitterProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Caregiver profile not found' });
  }

  const bookingCount = await prisma.booking.count({
    where: { sitterId: existing.id },
  });

  if (bookingCount > 0) {
    return res.status(400).json({
      error: 'Cannot delete profile while you have bookings. Complete or cancel them first.',
    });
  }

  await prisma.sitterProfile.delete({ where: { userId: req.user.id } });

  const updatedUser = await prisma.user.findUnique({ where: { id: req.user.id } });

  return res.json({
    ...buildAuthResponse(updatedUser, null),
    message: 'Caregiver profile deleted',
  });
});

router.post('/logout', async (req, res) => {
  await deleteSession(req.cookies?.[SESSION_COOKIE]);
  const clearOptions = { ...sessionCookieOptions() };
  delete clearOptions.maxAge;
  res.clearCookie(SESSION_COOKIE, clearOptions);
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const userId = await getSessionUserId(req.cookies?.[SESSION_COOKIE]);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { sitterProfile: true },
  });
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  return res.json(buildAuthResponse(user, user.sitterProfile));
});

router.get('/protected', requireAuth, (req, res) => {
  return res.json({
    message: 'Protected content available',
    user: serializeUser(req.user),
  });
});

export default router;
