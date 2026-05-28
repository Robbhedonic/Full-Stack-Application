export const sitters = [
  {
    id: 'sitter-1',
    name: 'Luna Morales',
    type: 'pet',
    rating: 4.9,
    pricePerHour: 18,
    description: 'Experienced pet sitter for dogs and cats. Available weekends and weekday afternoons.',
    location: 'Downtown',
  },
  {
    id: 'sitter-2',
    name: 'Diego Rojas',
    type: 'plant',
    rating: 4.7,
    pricePerHour: 14,
    description: 'Plant care specialist for indoor and balcony gardens. Watering, fertilizing, and repotting.',
    location: 'Northside',
  },
  {
    id: 'sitter-3',
    name: 'Mia Fernández',
    type: 'pet',
    rating: 4.8,
    pricePerHour: 20,
    description: 'Friendly pet sitter for small animals and birds. Flexible schedule and pickup available.',
    location: 'East End',
  },
];

export const bookings = [];
let nextBookingId = 1;

export function createBooking({ sitterId, ownerName, serviceType, startDate, durationHours }) {
  const booking = {
    id: `booking-${nextBookingId++}`,
    sitterId,
    ownerName,
    serviceType,
    startDate,
    durationHours,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  return booking;
}
