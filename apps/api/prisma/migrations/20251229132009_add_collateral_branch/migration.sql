-- AlterTable Branch: Add 'code' column
ALTER TABLE "Branch" ADD COLUMN "code" TEXT;
UPDATE "Branch" SET "code" = "name"; -- Temp: use name as code
ALTER TABLE "Branch" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- AlterTable CollateralItem: Add branchId
-- Step 1: Add nullable column
ALTER TABLE "CollateralItem" ADD COLUMN "branchId" TEXT;

-- Step 2: Assign collateral to loan's branch if exists, else default branch
UPDATE "CollateralItem" c
SET "branchId" = (
  SELECT l."branchId"
  FROM "Loan" l
  WHERE l.id = c."loanId"
  LIMIT 1
)
WHERE "loanId" IS NOT NULL;

-- Step 3: Assign orphaned collateral to default branch (Kantor Pusat)
UPDATE "CollateralItem"
SET "branchId" = (
  SELECT id FROM "Branch" WHERE name = 'Kantor Pusat' LIMIT 1
)
WHERE "branchId" IS NULL;

-- Step 4: Make branchId required
ALTER TABLE "CollateralItem" ALTER COLUMN "branchId" SET NOT NULL;

-- Step 5: Add foreign key and indexes
ALTER TABLE "CollateralItem" ADD CONSTRAINT "CollateralItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "CollateralItem_branchId_idx" ON "CollateralItem"("branchId");

-- Existing index already present
-- CREATE INDEX "CollateralItem_loanId_idx" ON "CollateralItem"("loanId");
