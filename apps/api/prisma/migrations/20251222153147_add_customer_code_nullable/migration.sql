-- CreateEnum
CREATE TYPE "CashStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "CashCategory" AS ENUM ('OPERATIONAL', 'CAPITAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('LISTED', 'SOLD', 'CANCELLED');

-- AlterTable
ALTER TABLE "CashLedger" ADD COLUMN     "category" "CashCategory" NOT NULL DEFAULT 'OPERATIONAL',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "reversalOfId" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedById" TEXT,
ADD COLUMN     "status" "CashStatus" NOT NULL DEFAULT 'POSTED';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "CustomerSequence" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL,

    CONSTRAINT "CustomerSequence_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "AuctionListing" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'LISTED',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDateSnapshot" TIMESTAMP(3) NOT NULL,
    "daysUsedSnapshot" INTEGER NOT NULL,
    "interestAmountSnapshotRp" INTEGER NOT NULL,
    "totalDueSnapshotRp" INTEGER NOT NULL,
    "remainingSnapshotRp" INTEGER NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "note" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AuctionListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuctionListing_loanId_key" ON "AuctionListing"("loanId");

-- CreateIndex
CREATE INDEX "AuctionListing_branchId_status_listedAt_idx" ON "AuctionListing"("branchId", "status", "listedAt");

-- CreateIndex
CREATE INDEX "CashLedger_branchId_txnDate_idx" ON "CashLedger"("branchId", "txnDate");

-- CreateIndex
CREATE INDEX "CashLedger_status_idx" ON "CashLedger"("status");

-- AddForeignKey
ALTER TABLE "CashLedger" ADD CONSTRAINT "CashLedger_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "CashLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedger" ADD CONSTRAINT "CashLedger_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "CashLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionListing" ADD CONSTRAINT "AuctionListing_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionListing" ADD CONSTRAINT "AuctionListing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionListing" ADD CONSTRAINT "AuctionListing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionListing" ADD CONSTRAINT "AuctionListing_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
