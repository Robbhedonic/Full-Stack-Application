export const PET_TYPE_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'reptile', label: 'Reptile' },
  { value: 'other', label: 'Other' },
];

export const PLANT_TYPE_OPTIONS = [
  { value: 'succulent', label: 'Succulents' },
  { value: 'tropical', label: 'Tropical houseplants' },
  { value: 'herbs', label: 'Herbs' },
  { value: 'cactus', label: 'Cactus' },
  { value: 'flowering', label: 'Flowering plants' },
  { value: 'fern', label: 'Ferns' },
  { value: 'other', label: 'Other' },
];

export function petTypeLabel(value) {
  return PET_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function plantTypeLabel(value) {
  return PLANT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatBookingCareSummary(booking) {
  if (!booking) return null;
  if (booking.serviceType === 'pet') {
    const parts = [];
    if (booking.petType) parts.push(petTypeLabel(booking.petType));
    if (booking.mealsPerDay) parts.push(`${booking.mealsPerDay} meal(s)/day`);
    if (booking.careNotes) parts.push(booking.careNotes);
    return parts.join(' · ');
  }
  if (booking.serviceType === 'plant') {
    const parts = [];
    if (booking.plantType) parts.push(plantTypeLabel(booking.plantType));
    if (booking.wateringSchedule) parts.push(`Water: ${booking.wateringSchedule}`);
    if (booking.wateringAmount) parts.push(booking.wateringAmount);
    if (booking.careNotes) parts.push(booking.careNotes);
    return parts.join(' · ');
  }
  return null;
}
