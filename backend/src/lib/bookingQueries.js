import { UserRole } from '@prisma/client';
import { prisma } from './prisma.js';
import { bookingInclude, isOwnerRole } from './bookingAccess.js';

export async function listBookingsForUser(user) {
  if (user.role === UserRole.ADMIN) {
    return null;
  }

  if (user.role === UserRole.CAREGIVER) {
    const sitterProfile = await prisma.sitterProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sitterProfile) {
      return [];
    }

    return prisma.booking.findMany({
      where: { sitterId: sitterProfile.id },
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  if (isOwnerRole(user.role)) {
    const ownerBookings = await prisma.booking.findMany({
      where: { ownerId: user.id },
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });

    const sitterProfile = await prisma.sitterProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sitterProfile) {
      return ownerBookings;
    }

    const caregiverBookings = await prisma.booking.findMany({
      where: { sitterId: sitterProfile.id },
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });

    const merged = new Map();
    for (const booking of [...ownerBookings, ...caregiverBookings]) {
      merged.set(booking.id, booking);
    }

    return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  return [];
}
