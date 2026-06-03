import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isOwnerRole } from '../lib/bookingAccess.js';
import {
  canAccessThread,
  canSendMessage,
  getCaregiverSitterProfile,
} from '../lib/messageAccess.js';
import { serializeMessage, serializeThread } from '../lib/serializers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/threads', async (req, res) => {
  if (req.user.role === UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admins cannot view message threads here' });
  }

  let threads = [];

  if (isOwnerRole(req.user.role)) {
    const messages = await prisma.message.findMany({
      where: { ownerId: req.user.id },
      include: {
        sitter: { select: { id: true, name: true, availability: true, location: true } },
        owner: { select: { id: true, name: true } },
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byKey = new Map();
    for (const message of messages) {
      const key = `${message.sitterId}:${message.ownerId}`;
      if (!byKey.has(key)) {
        byKey.set(key, message);
      }
    }
    threads = [...byKey.values()].map((message) => serializeThread(message, req.user.id));
  } else if (req.user.role === UserRole.CAREGIVER) {
    const sitter = await getCaregiverSitterProfile(req.user.id);
    if (!sitter) {
      return res.json({ threads: [] });
    }

    const messages = await prisma.message.findMany({
      where: { sitterId: sitter.id },
      include: {
        sitter: { select: { id: true, name: true, availability: true, location: true } },
        owner: { select: { id: true, name: true } },
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byKey = new Map();
    for (const message of messages) {
      const key = `${message.sitterId}:${message.ownerId}`;
      if (!byKey.has(key)) {
        byKey.set(key, message);
      }
    }
    threads = [...byKey.values()].map((message) => serializeThread(message, req.user.id));
  } else {
    return res.status(403).json({ error: 'Your account cannot use messaging' });
  }

  return res.json({ threads });
});

router.get('/', async (req, res) => {
  const sitterId = req.query.sitterId?.toString();
  let ownerId = req.query.ownerId?.toString();

  if (!sitterId) {
    return res.status(400).json({ error: 'sitterId is required' });
  }

  if (isOwnerRole(req.user.role)) {
    ownerId = req.user.id;
  }

  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  if (!(await canAccessThread(req.user, { sitterId, ownerId }))) {
    return res.status(403).json({ error: 'Cannot access this conversation' });
  }

  const messages = await prisma.message.findMany({
    where: { sitterId, ownerId },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({
    messages: messages.map((entry) => ({
      ...serializeMessage(entry),
      isMine: entry.senderId === req.user.id,
    })),
  });
});

router.post('/', async (req, res) => {
  const sitterId = req.body.sitterId?.toString();
  let ownerId = req.body.ownerId?.toString();
  const body = req.body.body?.toString().trim();

  if (!sitterId || !body) {
    return res.status(400).json({ error: 'sitterId and body are required' });
  }

  if (body.length > 2000) {
    return res.status(400).json({ error: 'Message must be 2000 characters or fewer' });
  }

  if (isOwnerRole(req.user.role)) {
    ownerId = req.user.id;
  }

  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  if (!isOwnerRole(req.user.role) && req.user.role !== UserRole.CAREGIVER) {
    return res.status(403).json({ error: 'Only owners and caregivers can send messages' });
  }

  if (!(await canSendMessage(req.user, { sitterId, ownerId }))) {
    return res.status(403).json({ error: 'Cannot send message in this conversation' });
  }

  const message = await prisma.message.create({
    data: {
      sitterId,
      ownerId,
      senderId: req.user.id,
      body,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  return res.status(201).json({
    message: {
      ...serializeMessage(message),
      isMine: true,
    },
  });
});

export default router;
