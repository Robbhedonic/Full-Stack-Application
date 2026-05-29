import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeBooking } from '../lib/serializers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const PET_TYPES = new Set(['dog', 'cat', 'bird', 'rabbit', 'reptile', 'other']);

router.use(requireAuth);

router.get('/', async (req, res) => {
  const sitterId = req.query.sitterId?.toString();
  const bookings = await prisma.booking.findMany({
    where: sitterId ? { sitterId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ bookings: bookings.map(serializeBooking) });
});

router.post('/', async (req, res) => {
  const { sitterId, ownerName, serviceType, petType, startDate, durationHours } = req.body;

  if (!sitterId || !ownerName || !serviceType || !startDate || !durationHours) {
    return res.status(400).json({ error: 'Missing booking fields' });
  }

  const normalizedServiceType = serviceType.toString().toLowerCase();
  if (!['pet', 'plant'].includes(normalizedServiceType)) {
    return res.status(400).json({ error: 'Invalid care type' });
  }

  let normalizedPetType = null;
  if (normalizedServiceType === 'pet') {
    normalizedPetType = petType?.toString().toLowerCase().trim();
    if (!normalizedPetType || !PET_TYPES.has(normalizedPetType)) {
      return res.status(400).json({ error: 'Pet type is required for pet care bookings' });
    }
  }

  const sitter = await prisma.sitterProfile.findUnique({ where: { id: sitterId } });
  if (!sitter) {
    return res.status(404).json({ error: 'Sitter not found' });
  }

  const booking = await prisma.booking.create({
    data: {
      sitterId,
      ownerId: req.user.id,
      ownerName: ownerName.trim(),
      serviceType: normalizedServiceType,
      petType: normalizedPetType,
      startDate: new Date(startDate),
      durationHours: Number(durationHours),
      status: 'pending',
    },
  });

  return res.status(201).json({ booking: serializeBooking(booking) });
});

export default router;
