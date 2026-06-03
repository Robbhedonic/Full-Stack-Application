import { prisma } from './prisma.js';
import { accountModeAllowsBooking, deriveAccountMode } from './accountMode.js';

export async function resolveAccountModeForUser(user) {
  const sitterProfile = await prisma.sitterProfile.findUnique({
    where: { userId: user.id },
  });
  return deriveAccountMode(user, sitterProfile);
}

export async function canBrowseCaregiverListings(user) {
  const mode = await resolveAccountModeForUser(user);
  return accountModeAllowsBooking(mode);
}
