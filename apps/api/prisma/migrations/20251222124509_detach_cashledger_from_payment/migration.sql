/*
  Warnings:

  - You are about to drop the column `paymentId` on the `CashLedger` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CashLedger" DROP CONSTRAINT "CashLedger_paymentId_fkey";

-- DropIndex
DROP INDEX "CashLedger_paymentId_key";

-- AlterTable
ALTER TABLE "CashLedger" DROP COLUMN "paymentId";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "daysUsedSnapshot" INTEGER,
ADD COLUMN     "interestAmountSnapshotRp" INTEGER,
ADD COLUMN     "interestRateSnapshotBps" INTEGER,
ADD COLUMN     "interestRecordedRp" INTEGER,
ADD COLUMN     "principalRecordedRp" INTEGER,
ADD COLUMN     "totalDueSnapshotRp" INTEGER;

-- CreateIndex
CREATE INDEX "Payment_loanId_idx" ON "Payment"("loanId");
