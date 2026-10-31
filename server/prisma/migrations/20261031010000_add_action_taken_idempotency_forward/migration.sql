-- AlterTable
ALTER TABLE "ActionTaken" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "requestFingerprint" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ActionTaken_idempotencyKey_key" ON "ActionTaken"("idempotencyKey");
