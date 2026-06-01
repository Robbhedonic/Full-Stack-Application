import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const OWNER_ROLES = new Set([UserRole.OWNER_PET, UserRole.OWNER_PLANT, UserRole.OWNER_MIXED]);

export function isOwnerRole(role) {
  return OWNER_ROLES.has(role);
}

export function canCreateBookings(role) {
  return isOwnerRole(role);
}

export async function bookingScopeForUser(user) {
  if (user.role === UserRole.ADMIN) {
    return null;
  }

  if (isOwnerRole(user.role)) {
    return { ownerId: user.id };
  }

  if (user.role === UserRole.CAREGIVER) {
    const sitterProfile = await prisma.sitterProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sitterProfile) {
      return { id: '__none__' };
    }

    return { sitterId: sitterProfile.id };
  }

  return { id: '__none__' };
}

export const bookingInclude = {
  sitter: {
    select: { name: true },
  },
};
