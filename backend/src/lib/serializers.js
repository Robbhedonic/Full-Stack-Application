export function serializeSitter(sitter) {
  const availability = sitter.availability ?? null;
  return {
    id: sitter.id,
    name: sitter.name,
    type: sitter.type,
    petTypes: sitter.petTypes
      ? sitter.petTypes
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    availability,
    availabilityStart: sitter.availabilityStart?.toISOString() ?? null,
    availabilityEnd: sitter.availabilityEnd?.toISOString() ?? null,
    isAvailable: Boolean(availability?.trim()),
    rating: sitter.rating,
    pricePerHour: sitter.pricePerHour,
    description: sitter.description,
    location: sitter.location,
  };
}

export function serializeMessage(message) {
  return {
    id: message.id,
    sitterId: message.sitterId,
    ownerId: message.ownerId,
    senderId: message.senderId,
    senderName: message.sender?.name ?? null,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    isMine: undefined,
  };
}

export function serializeThread(latestMessage, currentUserId) {
  return {
    sitterId: latestMessage.sitterId,
    ownerId: latestMessage.ownerId,
    sitterName: latestMessage.sitter?.name ?? null,
    ownerName: latestMessage.owner?.name ?? null,
    sitterAvailability: latestMessage.sitter?.availability ?? null,
    sitterLocation: latestMessage.sitter?.location ?? null,
    lastMessage: latestMessage.body,
    lastMessageAt: latestMessage.createdAt.toISOString(),
    lastSenderName: latestMessage.sender?.name ?? null,
    isAvailable: Boolean(latestMessage.sitter?.availability?.trim()),
    otherPartyName:
      latestMessage.ownerId === currentUserId
        ? latestMessage.sitter?.name
        : latestMessage.owner?.name,
  };
}

export function serializeBooking(booking) {
  return {
    id: booking.id,
    sitterId: booking.sitterId,
    ownerId: booking.ownerId ?? null,
    sitterName: booking.sitter?.name ?? null,
    ownerName: booking.ownerName,
    serviceType: booking.serviceType,
    petType: booking.petType,
    plantType: booking.plantType ?? null,
    mealsPerDay: booking.mealsPerDay ?? null,
    wateringSchedule: booking.wateringSchedule ?? null,
    wateringAmount: booking.wateringAmount ?? null,
    careNotes: booking.careNotes ?? null,
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
