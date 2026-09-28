/*
  Warnings:

  - The values [Pending] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('New', 'InProgress', 'WaitingForRequester', 'Resolved', 'Closed', 'Reopened', 'Cancelled');
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'New';
COMMIT;

-- CreateTable
CREATE TABLE "TicketAction" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketAction_ticketId_createdAt_idx" ON "TicketAction"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAction_actorUserId_idx" ON "TicketAction"("actorUserId");

-- CreateIndex
CREATE INDEX "TicketAction_actionType_idx" ON "TicketAction"("actionType");

-- AddForeignKey
ALTER TABLE "TicketAction" ADD CONSTRAINT "TicketAction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAction" ADD CONSTRAINT "TicketAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
