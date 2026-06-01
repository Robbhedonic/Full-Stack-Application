import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeSitter } from '../lib/serializers.js';

const router = Router();

router.get('/', async (req, res) => {
  const type = req.query.type?.toString().toLowerCase();
  let where;

  if (type === 'pet') {
    where = { type: { in: ['pet', 'both'] } };
  } else if (type === 'plant') {
    where = { type: { in: ['plant', 'both'] } };
  } else if (type) {
    where = { type };
  }

  const sitters = await prisma.sitterProfile.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return res.json({ sitters: sitters.map(serializeSitter) });
});

export default router;
