-- Script to remove test/hardcoded companies from the database
-- Run this using your PostgreSQL client or pgAdmin

-- WARNING: This will permanently delete data. Make sure you have a backup before running!

-- Option 1: Delete all companies in Kerala (if all Kerala companies are test data)
-- Uncomment the line below if you want to delete ALL companies with state = 'Kerala'
-- DELETE FROM "Company" WHERE state = 'Kerala';

-- Option 2: Delete companies with specific names (safer - modify the names as needed)
-- Replace the company names below with the actual test company names you want to remove
DELETE FROM "Company" WHERE name IN (
  'Test Company 1',
  'Test Company 2',
  'Test Company 3',
  'Sample Company',
  'Demo Company'
);

-- Option 3: Delete companies with NULL or invalid coordinates in Kerala
-- This assumes test data might have missing coordinates
DELETE FROM "Company" 
WHERE state = 'Kerala' 
AND (latitude IS NULL OR longitude IS NULL);

-- Option 4: Delete companies by ID (if you know the specific IDs)
-- Uncomment and add the IDs of companies you want to delete
-- DELETE FROM "Company" WHERE id IN (1, 2, 3, 4, 5, 6, 7);

-- Option 5: View all companies before deleting (run this first to see what you have)
-- Uncomment to preview data
-- SELECT id, name, state, district, latitude, longitude, "createdAt" 
-- FROM "Company" 
-- WHERE state = 'Kerala' 
-- ORDER BY "createdAt" DESC;

-- After running the deletion, verify the results
SELECT COUNT(*) as remaining_companies FROM "Company";
SELECT state, COUNT(*) as count FROM "Company" GROUP BY state;
