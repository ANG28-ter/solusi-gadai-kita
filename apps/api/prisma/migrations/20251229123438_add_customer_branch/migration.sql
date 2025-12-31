-- AlterTable: Add branchId to Customer
-- Custom migration to handle existing data

-- Step 1: Add nullable branchId column
ALTER TABLE "Customer" ADD COLUMN "branchId" TEXT;

-- Step 2: Assign existing customers to branches based on their first loan
UPDATE "Customer" c
SET "branchId" = (
  SELECT l."branchId" 
  FROM "Loan" l 
  WHERE l."customerId" = c.id 
  ORDER BY l."createdAt" ASC
  LIMIT 1
)
WHERE "branchId" IS NULL;

-- Step 3: For customers without any loans, assign to default branch (Kantor Pusat)
UPDATE "Customer"
SET "branchId" = (
  SELECT id FROM "Branch" WHERE name = 'Kantor Pusat' LIMIT 1
)
WHERE "branchId" IS NULL;

-- Step 4: Make branchId required
ALTER TABLE "Customer" ALTER COLUMN "branchId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "Customer" 
  ADD CONSTRAINT "Customer_branchId_fkey" 
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Create index for performance
CREATE INDEX "Customer_branchId_idx" ON "Customer"("branchId");
