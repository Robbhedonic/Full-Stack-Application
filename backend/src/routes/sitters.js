import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeSitter } from '../lib/serializers.js';

const router = Router();

router.get('/', async (req, res) => {
  const type = req.query.type?.toString().toLowerCase();
  const sitters = await prisma.sitterProfile.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: 'asc' },
  });

  return res.json({ sitters: sitters.map(serializeSitter) });
});

export default router;
