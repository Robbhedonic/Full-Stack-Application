import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'password123';

const adminUsers = [
  { email: 'admin@petcare.test', name: 'PetCare Admin', role: UserRole.ADMIN },
];

const petOwners = [
  { email: 'jane@petcare.test', name: 'Jane Doe' },
  { email: 'mike@petcare.test', name: 'Mike Sullivan' },
  { email: 'sara@petcare.test', name: 'Sara Kim' },
  { email: 'tom@petcare.test', name: 'Tom Bradley' },
  { email: 'emma@petcare.test', name: 'Emma Wilson' },
];

const plantOwners = [
  { email: 'carlos@petcare.test', name: 'Carlos Rivera' },
  { email: 'nina@petcare.test', name: 'Nina Patel' },
  { email: 'oliver@petcare.test', name: 'Oliver Green' },
  { email: 'rosa@petcare.test', name: 'Rosa Martinez' },
  { email: 'ivy@petcare.test', name: 'Ivy Chen' },
];

const mixedOwners = [
  { email: 'alex@petcare.test', name: 'Alex Morgan' },
  { email: 'taylor@petcare.test', name: 'Taylor Brooks' },
  { email: 'jordan@petcare.test', name: 'Jordan Lee' },
  { email: 'casey@petcare.test', name: 'Casey Nguyen' },
  { email: 'riley@petcare.test', name: 'Riley Adams' },
];

const caregivers = [
  {
    email: 'luna@petcare.test',
    name: 'Luna Morales',
    sitter: {
      type: 'pet',
      rating: 4.9,
      pricePerHour: 18,
      description: 'Experienced pet sitter for dogs and cats. Weekends and weekday afternoons.',
      location: 'Downtown',
    },
  },
  {
    email: 'diego@petcare.test',
    name: 'Diego Rojas',
    sitter: {
      type: 'plant',
      rating: 4.7,
      pricePerHour: 14,
      description: 'Plant care for indoor and balcony gardens. Watering and repotting.',
      location: 'Northside',
    },
  },
  {
    email: 'mia@petcare.test',
    name: 'Mia Fernandez',
    sitter: {
      type: 'pet',
      rating: 4.8,
      pricePerHour: 20,
      description: 'Pet sitter for small animals and birds. Flexible schedule.',
      location: 'East End',
    },
  },
  {
    email: 'noah@petcare.test',
    name: 'Noah Bennett',
    sitter: {
      type: 'pet',
      rating: 4.6,
      pricePerHour: 16,
      description: 'Dog walking and overnight pet sitting in central neighborhoods.',
      location: 'Midtown',
    },
  },
  {
    email: 'zoe@petcare.test',
    name: 'Zoe Hart',
    sitter: {
      type: 'plant',
      rating: 4.85,
      pricePerHour: 15,
      description: 'Succulent and houseplant maintenance. Weekly or one-time visits.',
      location: 'West Park',
    },
  },
];

const users = [
  ...adminUsers,
  ...petOwners.map((u) => ({ ...u, role: UserRole.OWNER_PET })),
  ...plantOwners.map((u) => ({ ...u, role: UserRole.OWNER_PLANT })),
  ...mixedOwners.map((u) => ({ ...u, role: UserRole.OWNER_MIXED })),
  ...caregivers.map((u) => ({ ...u, role: UserRole.CAREGIVER })),
];

function ownerCareDefaults(user) {
  if (user.role === UserRole.OWNER_PET) {
    return {
      ownerPetType: 'dog',
      ownerMealsPerDay: 2,
      ownerCareNotes: 'Dry food in the kitchen cupboard. Evening walk preferred.',
    };
  }
  if (user.role === UserRole.OWNER_PLANT) {
    return {
      ownerPlantType: 'succulent',
      ownerWateringSchedule: 'Every 7 days, mornings',
      ownerWateringAmount: 'Light soak until drainage; do not leave standing water',
    };
  }
  if (user.role === UserRole.OWNER_MIXED) {
    return {
      ownerPetType: 'cat',
      ownerMealsPerDay: 2,
      ownerPlantType: 'tropical',
      ownerWateringSchedule: 'Twice a week (Mon & Thu)',
      ownerWateringAmount: 'About 250 ml per large pot',
      ownerCareNotes: 'Cat is shy with strangers; plants on the balcony.',
    };
  }
  return {};
}

async function upsertUser(user, passwordHash) {
  const ownerCare = ownerCareDefaults(user);
  const record = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      role: user.role,
      passwordHash,
      ...ownerCare,
    },
    create: {
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash,
      ...ownerCare,
    },
  });

  if (user.sitter) {
    await prisma.sitterProfile.upsert({
      where: { userId: record.id },
      update: {
        name: user.name,
        type: user.sitter.type,
        rating: user.sitter.rating,
        pricePerHour: user.sitter.pricePerHour,
        description: user.sitter.description,
        location: user.sitter.location,
      },
      create: {
        userId: record.id,
        name: user.name,
        type: user.sitter.type,
        rating: user.sitter.rating,
        pricePerHour: user.sitter.pricePerHour,
        description: user.sitter.description,
        location: user.sitter.location,
      },
    });
  }

  return record;
}

async function seedBookings() {
  const owners = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.OWNER_PET, UserRole.OWNER_PLANT, UserRole.OWNER_MIXED] },
    },
    take: 8,
  });
  const sitters = await prisma.sitterProfile.findMany({ take: 5 });

  if (owners.length === 0 || sitters.length === 0) return;

  const samples = [
    {
      serviceType: 'pet',
      petType: 'dog',
      mealsPerDay: 2,
      careNotes: 'Morning and evening dry food',
      status: 'pending',
      daysAhead: 2,
      hours: 3,
    },
    {
      serviceType: 'pet',
      petType: 'cat',
      mealsPerDay: 3,
      careNotes: 'Wet food at lunch',
      status: 'confirmed',
      daysAhead: 5,
      hours: 4,
    },
    {
      serviceType: 'plant',
      plantType: 'succulent',
      wateringSchedule: 'Every 10 days',
      wateringAmount: '50 ml per small pot',
      status: 'pending',
      daysAhead: 3,
      hours: 2,
    },
    {
      serviceType: 'plant',
      plantType: 'tropical',
      wateringSchedule: 'Twice weekly',
      wateringAmount: 'Until soil is moist',
      status: 'completed',
      daysAhead: -2,
      hours: 2,
    },
    {
      serviceType: 'pet',
      petType: 'dog',
      mealsPerDay: 2,
      status: 'pending',
      daysAhead: 7,
      hours: 5,
    },
    {
      serviceType: 'plant',
      plantType: 'herbs',
      wateringSchedule: 'Daily in summer',
      wateringAmount: '100 ml',
      status: 'confirmed',
      daysAhead: 4,
      hours: 3,
    },
    {
      serviceType: 'pet',
      petType: 'cat',
      mealsPerDay: 2,
      status: 'pending',
      daysAhead: 1,
      hours: 2,
    },
    {
      serviceType: 'plant',
      plantType: 'fern',
      wateringSchedule: 'Every 3 days',
      wateringAmount: 'Mist leaves and water base lightly',
      status: 'pending',
      daysAhead: 6,
      hours: 4,
    },
  ];

  for (let i = 0; i < samples.length; i += 1) {
    const owner = owners[i % owners.length];
    const sitter = sitters[i % sitters.length];
    const sample = samples[i];

    const existing = await prisma.booking.findFirst({
      where: {
        ownerId: owner.id,
        sitterId: sitter.id,
        serviceType: sample.serviceType,
      },
    });

    if (existing) continue;

    await prisma.booking.create({
      data: {
        ownerId: owner.id,
        sitterId: sitter.id,
        ownerName: owner.name,
        serviceType: sample.serviceType,
        petType: sample.petType ?? null,
        plantType: sample.plantType ?? null,
        mealsPerDay: sample.mealsPerDay ?? null,
        wateringSchedule: sample.wateringSchedule ?? null,
        wateringAmount: sample.wateringAmount ?? null,
        careNotes: sample.careNotes ?? null,
        startDate: new Date(Date.now() + sample.daysAhead * 24 * 60 * 60 * 1000),
        durationHours: sample.hours,
        status: sample.status,
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const user of users) {
    await upsertUser(user, passwordHash);
  }

  await seedBookings();

  console.log('Seed complete. Password for all users:', DEFAULT_PASSWORD);
  console.log(`  Admin: ${adminUsers.length}`);
  console.log(`  Pet owners: ${petOwners.length}`);
  console.log(`  Plant owners: ${plantOwners.length}`);
  console.log(`  Mixed owners: ${mixedOwners.length}`);
  console.log(`  Caregivers: ${caregivers.length}`);
  console.log(`  Total users: ${users.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
