-- Fix branch codes to use short codes instead of full names
UPDATE "Branch" SET code = 'BDG' WHERE name = 'Cabang Bandung';
UPDATE "Branch" SET code = 'JKT' WHERE name = 'Cabang Jakarta';  
UPDATE "Branch" SET code = 'KP' WHERE name = 'Kantor Pusat';

-- Verify changes
SELECT name, code FROM "Branch" ORDER BY name;
