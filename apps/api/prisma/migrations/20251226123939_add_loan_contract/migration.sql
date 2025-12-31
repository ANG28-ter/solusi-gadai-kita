-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'FINAL', 'VOID');

-- CreateTable
CREATE TABLE "LoanContract" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contractNo" TEXT,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "snapshotJson" JSONB NOT NULL,
    "snapshotHashSha256" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "finalizedById" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSequence" (
    "branchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL,

    CONSTRAINT "ContractSequence_pkey" PRIMARY KEY ("branchId","year")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanContract_contractNo_key" ON "LoanContract"("contractNo");

-- CreateIndex
CREATE INDEX "LoanContract_loanId_createdAt_idx" ON "LoanContract"("loanId", "createdAt");

-- CreateIndex
CREATE INDEX "LoanContract_branchId_createdAt_idx" ON "LoanContract"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "LoanContract_status_idx" ON "LoanContract"("status");

-- AddForeignKey
ALTER TABLE "LoanContract" ADD CONSTRAINT "LoanContract_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanContract" ADD CONSTRAINT "LoanContract_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanContract" ADD CONSTRAINT "LoanContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanContract" ADD CONSTRAINT "LoanContract_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanContract" ADD CONSTRAINT "LoanContract_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
