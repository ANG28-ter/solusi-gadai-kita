-- Manual Migration: Add Photo Fields
-- Created: 2025-12-31
-- Description: Add photoUrl to Customer and photoUrls to CollateralItem

-- Add photoUrl column to Customer table (nullable)
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

-- Add photoUrls column to CollateralItem table (array with default empty array)
ALTER TABLE "CollateralItem" ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] DEFAULT '{}';

-- Verify columns added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Customer' AND column_name = 'photoUrl';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'CollateralItem' AND column_name = 'photoUrls';
