const PET_TYPE_LABELS = {
  dog: 'dogs',
  cat: 'cats',
  bird: 'birds',
  rabbit: 'rabbits',
  reptile: 'reptiles',
  other: 'other pets',
};

export function normalizeCareType(value) {
  const careType = value?.toString().toLowerCase();
  if (careType === 'pet' || careType === 'plant' || careType === 'both') {
    return careType;
  }
  return null;
}

export function normalizePetTypes(petTypes) {
  if (!Array.isArray(petTypes)) {
    return [];
  }

  return [...new Set(petTypes.map((value) => value?.toString().toLowerCase().trim()).filter(Boolean))];
}

export function formatAvailabilityLabel(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '';
  }
  return `From ${start.toLocaleString()} to ${end.toLocaleString()}`;
}

export function buildSitterDescription({ careType, petTypes, availability, location }) {
  const parts = [];

  if (careType === 'pet') {
    const labels = petTypes.map((type) => PET_TYPE_LABELS[type] ?? type);
    parts.push(`Pet care${labels.length ? ` for ${labels.join(', ')}` : ''}.`);
  } else if (careType === 'plant') {
    parts.push('Plant care for indoor and outdoor plants.');
  } else {
    const labels = petTypes.map((type) => PET_TYPE_LABELS[type] ?? type);
    parts.push(
      `Pet and plant care${labels.length ? ` (pets: ${labels.join(', ')})` : ''}.`
    );
  }

  parts.push(`Available: ${availability.trim()}.`);
  if (location?.trim()) {
    parts.push(`Area: ${location.trim()}.`);
  }

  return parts.join(' ');
}

export function validateCaregiverProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return 'Complete your caregiver profile: care type, availability, and animal types (for pet care).';
  }

  const careType = normalizeCareType(profile.careType);
  if (!careType) {
    return 'Care type must be pet, plant, or both';
  }

  const hasRange = profile.availabilityStart && profile.availabilityEnd;
  const availability = profile.availability?.toString().trim();
  if (!hasRange && !availability) {
    return 'Availability / free time is required';
  }

  if (hasRange) {
    const start = new Date(profile.availabilityStart);
    const end = new Date(profile.availabilityEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return 'Availability end date must be after the start date';
    }
  }

  const petTypes = normalizePetTypes(profile.petTypes);
  if ((careType === 'pet' || careType === 'both') && petTypes.length === 0) {
    return 'Select at least one animal type you can care for';
  }

  const pricePerHour = Number(profile.pricePerHour);
  if (profile.pricePerHour !== undefined && profile.pricePerHour !== '' && Number.isNaN(pricePerHour)) {
    return 'Hourly rate must be a number';
  }

  if (!Number.isNaN(pricePerHour) && pricePerHour < 0) {
    return 'Hourly rate cannot be negative';
  }

  return null;
}

export function parseCaregiverProfile(profile, name, existingRating = 5) {
  const careType = normalizeCareType(profile.careType);
  const petTypes = normalizePetTypes(profile.petTypes);
  const location = profile.location?.toString().trim() || 'Local area';

  let availabilityStart = null;
  let availabilityEnd = null;
  let availability = profile.availability?.toString().trim() ?? '';

  if (profile.availabilityStart && profile.availabilityEnd) {
    availabilityStart = new Date(profile.availabilityStart);
    availabilityEnd = new Date(profile.availabilityEnd);
    availability = formatAvailabilityLabel(availabilityStart, availabilityEnd);
  }

  if (!availability) {
    availability = 'Contact for availability';
  }
  const parsedPrice = Number(profile.pricePerHour);
  const pricePerHour =
    profile.pricePerHour === undefined || profile.pricePerHour === '' || Number.isNaN(parsedPrice)
      ? 15
      : Math.round(parsedPrice);

  return {
    name: name.trim(),
    type: careType,
    petTypes: careType === 'plant' ? null : petTypes.join(','),
    availability,
    availabilityStart,
    availabilityEnd,
    rating: existingRating,
    pricePerHour,
    location,
    description: buildSitterDescription({ careType, petTypes, availability, location }),
  };
}

export function extractCaregiverProfilePayload(body) {
  if (body.caregiverProfile && typeof body.caregiverProfile === 'object') {
    return body.caregiverProfile;
  }
  return body;
}
