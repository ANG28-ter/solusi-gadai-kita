/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `CashLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CashLedger" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CashLedger_paymentId_key" ON "CashLedger"("paymentId");

-- AddForeignKey
ALTER TABLE "CashLedger" ADD CONSTRAINT "CashLedger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
