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

  const availability = profile.availability?.toString().trim();
  if (!availability) {
    return 'Availability / free time is required';
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

export function parseCaregiverProfile(profile, name) {
  const careType = normalizeCareType(profile.careType);
  const petTypes = normalizePetTypes(profile.petTypes);
  const availability = profile.availability.toString().trim();
  const location = profile.location?.toString().trim() || 'Local area';
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
    rating: 5,
    pricePerHour,
    location,
    description: buildSitterDescription({ careType, petTypes, availability, location }),
  };
}
