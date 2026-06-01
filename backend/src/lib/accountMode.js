import { UserRole } from '@prisma/client';
import { isOwnerRole } from './bookingAccess.js';

export const ACCOUNT_MODES = new Set(['owner', 'caregiver', 'both']);

export function deriveAccountMode(user, sitterProfile) {
  const stored = normalizeAccountMode(user.profileMode);
  if (stored) {
    if (stored === 'both' && !sitterProfile && user.role === UserRole.CAREGIVER) {
      return 'caregiver';
    }
    return stored;
  }

  if (user.role === UserRole.CAREGIVER) {
    return 'caregiver';
  }

  if (isOwnerRole(user.role) && sitterProfile) {
    return 'both';
  }

  if (isOwnerRole(user.role)) {
    return 'owner';
  }

  return 'owner';
}

export function roleForAccountMode(mode) {
  if (mode === 'caregiver') {
    return UserRole.CAREGIVER;
  }

  return UserRole.OWNER_PET;
}

export function normalizeAccountMode(value) {
  const mode = value?.toString().toLowerCase();
  return ACCOUNT_MODES.has(mode) ? mode : null;
}

export function accountModeRequiresSitterProfile(mode) {
  return mode === 'caregiver' || mode === 'both';
}

export function accountModeAllowsBooking(mode) {
  return mode === 'owner' || mode === 'both';
}
