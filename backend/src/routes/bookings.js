import { Router } from 'express';
import { bookings, sitters, createBooking } from '../data.js';

const router = Router();

router.get('/', (req, res) => {
  const sitterId = req.query.sitterId;
  if (sitterId) {
    return res.json({ bookings: bookings.filter((booking) => booking.sitterId === sitterId) });
  }

  return res.json({ bookings });
});

router.post('/', (req, res) => {
  const { sitterId, ownerName, serviceType, startDate, durationHours } = req.body;

  if (!sitterId || !ownerName || !serviceType || !startDate || !durationHours) {
    return res.status(400).json({ error: 'Missing booking fields' });
  }

  const sitter = sitters.find((record) => record.id === sitterId);
  if (!sitter) {
    return res.status(404).json({ error: 'Sitter not found' });
  }

  const booking = createBooking({ sitterId, ownerName, serviceType, startDate, durationHours });
  return res.status(201).json({ booking });
});

export default router;
