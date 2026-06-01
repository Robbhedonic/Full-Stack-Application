-- Owner defaults on User
ALTER TABLE "User" ADD COLUMN "ownerPetType" TEXT;
ALTER TABLE "User" ADD COLUMN "ownerPlantType" TEXT;
ALTER TABLE "User" ADD COLUMN "ownerMealsPerDay" INTEGER;
ALTER TABLE "User" ADD COLUMN "ownerWateringSchedule" TEXT;
ALTER TABLE "User" ADD COLUMN "ownerWateringAmount" TEXT;
ALTER TABLE "User" ADD COLUMN "ownerCareNotes" TEXT;

-- Care instructions on each booking (care request)
ALTER TABLE "Booking" ADD COLUMN "plantType" TEXT;
ALTER TABLE "Booking" ADD COLUMN "mealsPerDay" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "wateringSchedule" TEXT;
ALTER TABLE "Booking" ADD COLUMN "wateringAmount" TEXT;
ALTER TABLE "Booking" ADD COLUMN "careNotes" TEXT;
