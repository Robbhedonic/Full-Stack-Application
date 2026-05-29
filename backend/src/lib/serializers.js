export function serializeSitter(sitter) {
  return {
    id: sitter.id,
    name: sitter.name,
    type: sitter.type,
    rating: sitter.rating,
    pricePerHour: sitter.pricePerHour,
    description: sitter.description,
    location: sitter.location,
  };
}

export function serializeBooking(booking) {
  return {
    id: booking.id,
    sitterId: booking.sitterId,
    sitterName: booking.sitter?.name ?? null,
    ownerName: booking.ownerName,
    serviceType: booking.serviceType,
    petType: booking.petType,
    startDate: booking.startDate.toISOString(),
    durationHours: booking.durationHours,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
}

const roleToClient = {
  OWNER_PET: 'owner-pet',
  OWNER_PLANT: 'owner-plant',
  OWNER_MIXED: 'owner-mixed',
  CAREGIVER: 'caregiver',
  ADMIN: 'admin',
};

const roleFromClient = {
  'owner-pet': 'OWNER_PET',
  'owner-plant': 'OWNER_PLANT',
  'owner-mixed': 'OWNER_MIXED',
  caregiver: 'CAREGIVER',
};

export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleToClient[user.role] ?? user.role,
  };
}

export function parseClientRole(role) {
  return roleFromClient[role] ?? null;
}
