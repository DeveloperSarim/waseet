-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "realtorId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "note" TEXT,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdrawals_realtorId_status_idx" ON "withdrawals"("realtorId", "status");

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
