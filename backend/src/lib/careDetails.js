export const PET_TYPES = new Set(['dog', 'cat', 'bird', 'rabbit', 'reptile', 'other']);

export const PLANT_TYPES = new Set([
  'succulent',
  'tropical',
  'herbs',
  'cactus',
  'flowering',
  'fern',
  'other',
]);

function normalizeType(value, allowed) {
  if (value == null || value === '') return null;
  const normalized = value.toString().toLowerCase().trim();
  return allowed.has(normalized) ? normalized : null;
}

function normalizeMealsPerDay(value) {
  if (value == null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) return null;
  return parsed;
}

function normalizeText(value, { minLength = 1, maxLength = 500 } = {}) {
  if (value == null) return null;
  const trimmed = value.toString().trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) return null;
  return trimmed;
}

export function extractOwnerCarePayload(body) {
  return {
    petType: body?.ownerCare?.petType ?? body?.petType,
    plantType: body?.ownerCare?.plantType ?? body?.plantType,
    mealsPerDay: body?.ownerCare?.mealsPerDay ?? body?.mealsPerDay,
    wateringSchedule: body?.ownerCare?.wateringSchedule ?? body?.wateringSchedule,
    wateringAmount: body?.ownerCare?.wateringAmount ?? body?.wateringAmount,
    careNotes: body?.ownerCare?.careNotes ?? body?.careNotes,
  };
}

export function validateOwnerCareProfile(payload, { requirePet, requirePlant } = {}) {
  const petType = normalizeType(payload.petType, PET_TYPES);
  const plantType = normalizeType(payload.plantType, PLANT_TYPES);
  const mealsPerDay = normalizeMealsPerDay(payload.mealsPerDay);
  const wateringSchedule = normalizeText(payload.wateringSchedule, { minLength: 3 });
  const wateringAmount = normalizeText(payload.wateringAmount, { minLength: 2 });
  if (payload.careNotes) {
    const careNotes = normalizeText(payload.careNotes, { minLength: 0, maxLength: 1000 });
    if (!careNotes) return 'Care notes must be 1000 characters or fewer';
  }

  if (requirePet) {
    if (!petType) return 'Select what type of pet you have';
    if (!mealsPerDay) return 'Meals per day is required (1–12)';
  }

  if (requirePlant) {
    if (!plantType) return 'Select what type of plants you have';
    if (!wateringSchedule) return 'Describe when to water your plants (e.g. every 3 days, twice a week)';
    if (!wateringAmount) return 'Describe how much water to use (e.g. 200 ml, until soil is moist)';
  }

  if (!requirePet && !requirePlant) {
    const hasPet = Boolean(petType || payload.mealsPerDay);
    const hasPlant = Boolean(plantType || payload.wateringSchedule || payload.wateringAmount);
    if (!hasPet && !hasPlant) {
      return 'Add details for your pet, your plants, or both';
    }
    if (hasPet && !petType) return 'Select your pet type';
    if (hasPet && !mealsPerDay) return 'Meals per day is required for pet care (1–12)';
    if (hasPlant && !plantType) return 'Select your plant type';
    if (hasPlant && !wateringSchedule) return 'Watering schedule is required for plant care';
    if (hasPlant && !wateringAmount) return 'Watering amount is required for plant care';
  }

  if (petType && !mealsPerDay) return 'Meals per day is required when a pet type is set';
  if (plantType && (!wateringSchedule || !wateringAmount)) {
    return 'Watering schedule and amount are required when a plant type is set';
  }

  return null;
}

export function parseOwnerCareProfile(payload) {
  return {
    ownerPetType: normalizeType(payload.petType, PET_TYPES),
    ownerPlantType: normalizeType(payload.plantType, PLANT_TYPES),
    ownerMealsPerDay: normalizeMealsPerDay(payload.mealsPerDay),
    ownerWateringSchedule: normalizeText(payload.wateringSchedule, { minLength: 3 }),
    ownerWateringAmount: normalizeText(payload.wateringAmount, { minLength: 2 }),
    ownerCareNotes: payload.careNotes
      ? normalizeText(payload.careNotes, { minLength: 0, maxLength: 1000 })
      : null,
  };
}

export function serializeOwnerCareFromUser(user) {
  if (!user) return null;
  return {
    petType: user.ownerPetType ?? null,
    plantType: user.ownerPlantType ?? null,
    mealsPerDay: user.ownerMealsPerDay ?? null,
    wateringSchedule: user.ownerWateringSchedule ?? null,
    wateringAmount: user.ownerWateringAmount ?? null,
    careNotes: user.ownerCareNotes ?? null,
  };
}

export function extractBookingCarePayload(body) {
  return {
    petType: body.petType,
    plantType: body.plantType,
    mealsPerDay: body.mealsPerDay,
    wateringSchedule: body.wateringSchedule,
    wateringAmount: body.wateringAmount,
    careNotes: body.careNotes,
  };
}

export function validateBookingCareDetails(serviceType, payload) {
  const normalizedServiceType = serviceType?.toString().toLowerCase();

  if (normalizedServiceType === 'pet') {
    const petType = normalizeType(payload.petType, PET_TYPES);
    const mealsPerDay = normalizeMealsPerDay(payload.mealsPerDay);
    const careNotes = payload.careNotes
      ? normalizeText(payload.careNotes, { minLength: 0, maxLength: 1000 })
      : null;

    if (!petType) return { error: 'Pet type is required for pet care bookings' };
    if (!mealsPerDay) return { error: 'Meals per day is required for pet care (1–12)' };

    return {
      data: {
        petType,
        plantType: null,
        mealsPerDay,
        wateringSchedule: null,
        wateringAmount: null,
        careNotes,
      },
    };
  }

  if (normalizedServiceType === 'plant') {
    const plantType = normalizeType(payload.plantType, PLANT_TYPES);
    const wateringSchedule = normalizeText(payload.wateringSchedule, { minLength: 3 });
    const wateringAmount = normalizeText(payload.wateringAmount, { minLength: 2 });
    const careNotes = payload.careNotes
      ? normalizeText(payload.careNotes, { minLength: 0, maxLength: 1000 })
      : null;

    if (!plantType) return { error: 'Plant type is required for plant care bookings' };
    if (!wateringSchedule) return { error: 'Watering schedule is required (when to water)' };
    if (!wateringAmount) return { error: 'Watering amount is required (how much water)' };

    return {
      data: {
        petType: null,
        plantType,
        mealsPerDay: null,
        wateringSchedule,
        wateringAmount,
        careNotes,
      },
    };
  }

  return { error: 'Invalid care type' };
}
