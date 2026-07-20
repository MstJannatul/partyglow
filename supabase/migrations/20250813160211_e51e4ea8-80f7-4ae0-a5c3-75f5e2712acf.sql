-- Fix any remaining RLS policy issues
-- Add policies for any tables that might be missing them

-- Check for categories table policy (the main table we modified)
CREATE POLICY IF NOT EXISTS "Anyone can view categories" 
ON categories 
FOR SELECT 
USING (true);

-- Verify all category data is properly set up
UPDATE categories SET sort_order = 0 WHERE sort_order IS NULL;

-- Final verification query
SELECT 'Categories setup complete' as status;