import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializePublicSitter } from '../lib/serializers.js';
import { canBrowseCaregiverListings } from '../lib/userPrivacy.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (!(await canBrowseCaregiverListings(req.user))) {
    return res.status(403).json({
      error: 'Only pet and plant owners can browse caregiver listings. Caregivers cannot view other caregivers.',
    });
  }

  const type = req.query.type?.toString().toLowerCase();
  let typeFilter;

  if (type === 'pet') {
    typeFilter = { type: { in: ['pet', 'both'] } };
  } else if (type === 'plant') {
    typeFilter = { type: { in: ['plant', 'both'] } };
  } else if (type) {
    typeFilter = { type };
  }

  const sitters = await prisma.sitterProfile.findMany({
    where: {
      ...(typeFilter ?? {}),
      OR: [{ userId: null }, { userId: { not: req.user.id } }],
    },
    orderBy: { name: 'asc' },
  });

  return res.json({ sitters: sitters.map(serializePublicSitter) });
});

export default router;
