import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { serializeBooking, serializeUser } from '../lib/serializers.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  const [roleCounts, totalBookings, pendingBookings, sittersListed, recentUsers, recentBookings] =
    await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.sitterProfile.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

  const countByRole = Object.fromEntries(
    roleCounts.map((row) => [row.role, row._count._all])
  );

  const petOwners = countByRole[UserRole.OWNER_PET] ?? 0;
  const plantOwners = countByRole[UserRole.OWNER_PLANT] ?? 0;
  const mixedOwners = countByRole[UserRole.OWNER_MIXED] ?? 0;
  const caregivers = countByRole[UserRole.CAREGIVER] ?? 0;
  const admins = countByRole[UserRole.ADMIN] ?? 0;
  const totalOwners = petOwners + plantOwners + mixedOwners;

  return res.json({
    stats: {
      totalUsers: petOwners + plantOwners + mixedOwners + caregivers + admins,
      petOwners,
      plantOwners,
      mixedOwners,
      totalOwners,
      caregivers,
      admins,
      sittersListed,
      totalBookings,
      pendingBookings,
    },
    recentUsers: recentUsers.map((user) => ({
      ...serializeUser(user),
      createdAt: user.createdAt.toISOString(),
    })),
    recentBookings: recentBookings.map(serializeBooking),
  });
});

export default router;
