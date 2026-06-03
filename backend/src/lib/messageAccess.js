import { UserRole } from '@prisma/client';
import { prisma } from './prisma.js';
import { isOwnerRole } from './bookingAccess.js';

export async function getCaregiverSitterProfile(userId) {
  return prisma.sitterProfile.findUnique({
    where: { userId },
    select: { id: true, name: true },
  });
}

export async function canAccessThread(user, { sitterId, ownerId }) {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (isOwnerRole(user.role) && user.id === ownerId) {
    const sitter = await prisma.sitterProfile.findUnique({
      where: { id: sitterId },
      select: { id: true },
    });
    return Boolean(sitter);
  }

  if (user.role === UserRole.CAREGIVER) {
    const sitter = await getCaregiverSitterProfile(user.id);
    return sitter?.id === sitterId;
  }

  return false;
}

export async function canSendMessage(user, { sitterId, ownerId }) {
  if (!(await canAccessThread(user, { sitterId, ownerId }))) {
    return false;
  }

  if (isOwnerRole(user.role)) {
    return user.id === ownerId;
  }

  if (user.role === UserRole.CAREGIVER) {
    return true;
  }

  return false;
}
