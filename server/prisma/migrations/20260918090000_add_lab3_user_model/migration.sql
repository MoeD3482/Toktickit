-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Requester', 'ITStaff', 'Administrator');

-- CreateEnum
CREATE TYPE "PasswordState" AS ENUM ('InitialPassword', 'ChangeRequired', 'Active');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['Requester']::"UserRole"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordState" "PasswordState" NOT NULL DEFAULT 'InitialPassword',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Backfill authenticated requester users from Lab 2 Development Requesters.
-- Reusing the DevelopmentRequester id preserves existing Ticket and Attachment ownership.
INSERT INTO "User" (
    "id",
    "displayName",
    "email",
    "passwordHash",
    "roles",
    "isActive",
    "passwordState",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "displayName",
    "email",
    'sha256:8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    ARRAY['Requester']::"UserRole"[],
    "isActive",
    'ChangeRequired'::"PasswordState",
    "createdAt",
    "updatedAt"
FROM "DevelopmentRequester"
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "requesterUserId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "assignedToUserId" TEXT;

-- Backfill existing Tickets to their matching authenticated requester user.
UPDATE "Ticket"
SET "requesterUserId" = "requesterId"
WHERE "requesterId" IN (SELECT "id" FROM "User");

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN "uploadedByUserId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "removedByUserId" TEXT;

-- Backfill existing Attachments to their matching authenticated requester users.
UPDATE "Attachment"
SET "uploadedByUserId" = "uploadedByRequesterId"
WHERE "uploadedByRequesterId" IN (SELECT "id" FROM "User");

UPDATE "Attachment"
SET "removedByUserId" = "removedByRequesterId"
WHERE "removedByRequesterId" IS NOT NULL
  AND "removedByRequesterId" IN (SELECT "id" FROM "User");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Ticket_requesterUserId_idx" ON "Ticket"("requesterUserId");

-- CreateIndex
CREATE INDEX "Ticket_assignedToUserId_idx" ON "Ticket"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Ticket_requesterUserId_updatedAt_idx" ON "Ticket"("requesterUserId", "updatedAt");

-- CreateIndex
CREATE INDEX "Attachment_uploadedByUserId_idx" ON "Attachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "Attachment_removedByUserId_idx" ON "Attachment"("removedByUserId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_removedByUserId_fkey" FOREIGN KEY ("removedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
