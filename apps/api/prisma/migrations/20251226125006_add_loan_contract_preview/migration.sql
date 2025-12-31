-- DropIndex
DROP INDEX "LoanContract_branchId_createdAt_idx";

-- AlterTable
ALTER TABLE "LoanContract" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "LoanContract" ADD CONSTRAINT "LoanContract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
