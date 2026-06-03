-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sitterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_sitterId_ownerId_createdAt_idx" ON "Message"("sitterId", "ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_ownerId_idx" ON "Message"("ownerId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
