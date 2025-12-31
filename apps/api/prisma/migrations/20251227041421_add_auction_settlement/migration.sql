/*
  Warnings:

  - A unique constraint covering the columns `[auctionSettlementId]` on the table `CashLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CashSource" ADD VALUE 'AUCTION';

-- AlterTable
ALTER TABLE "CashLedger" ADD COLUMN     "auctionSettlementId" TEXT;

-- CreateTable
CREATE TABLE "AuctionSettlement" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "grossAmountRp" INTEGER NOT NULL,
    "feesRp" INTEGER NOT NULL DEFAULT 0,
    "netAmountRp" INTEGER NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionSettlement_auctionId_settledAt_idx" ON "AuctionSettlement"("auctionId", "settledAt");

-- CreateIndex
CREATE UNIQUE INDEX "CashLedger_auctionSettlementId_key" ON "CashLedger"("auctionSettlementId");

-- AddForeignKey
ALTER TABLE "CashLedger" ADD CONSTRAINT "CashLedger_auctionSettlementId_fkey" FOREIGN KEY ("auctionSettlementId") REFERENCES "AuctionSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSettlement" ADD CONSTRAINT "AuctionSettlement_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "AuctionListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSettlement" ADD CONSTRAINT "AuctionSettlement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSettlement" ADD CONSTRAINT "AuctionSettlement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
