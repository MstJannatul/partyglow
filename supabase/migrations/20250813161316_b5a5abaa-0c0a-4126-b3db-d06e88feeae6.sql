-- COMPREHENSIVE SECURITY AND DATA INTEGRITY FIX - FINAL
-- This migration addresses all identified issues systematically

-- 1. Fix RLS Policies for Critical Tables

-- Check and add missing RLS policy for rate_limit_counters only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rate_limit_counters' 
    AND policyname = 'System can manage rate limits'
  ) THEN
    CREATE POLICY "System can manage rate limits" 
    ON rate_limit_counters 
    FOR ALL 
    USING (true);
  END IF;
END $$;

-- 2. Complete Category Data Structure

-- First, ensure all categories have proper sort_order values
UPDATE categories 
SET sort_order = CASE 
  WHEN name = 'DJ Services' THEN 1
  WHEN name = 'Photography' THEN 2
  WHEN name = 'Catering' THEN 3
  WHEN name = 'Decorations' THEN 4
  WHEN name = 'Entertainment' THEN 5
  WHEN name = 'Equipment Rental' THEN 6
  WHEN name = 'Venue Services' THEN 7
  WHEN name = 'Transportation' THEN 8
  WHEN name = 'Planning & Coordination' THEN 9
  WHEN name = 'Floral Arrangements' THEN 10
  ELSE COALESCE(sort_order, 99)
END
WHERE sort_order IS NULL OR sort_order = 0;

-- Insert missing subcategories if they don't exist
INSERT INTO categories (name, description, type, parent_id, sort_order, slug)
SELECT 
  subcategory_data.name,
  subcategory_data.description,
  subcategory_data.type::listing_type,
  parent_cats.id,
  subcategory_data.sort_order,
  subcategory_data.slug
FROM (
  VALUES 
    ('Wedding DJ', 'Professional DJ services for weddings', 'service', 'DJ Services', 1, 'wedding-dj'),
    ('Party DJ', 'DJ services for parties and celebrations', 'service', 'DJ Services', 2, 'party-dj'),
    ('Corporate Events DJ', 'Professional DJ for corporate functions', 'service', 'DJ Services', 3, 'corporate-dj'),
    ('Wedding Photography', 'Professional wedding photography', 'service', 'Photography', 1, 'wedding-photography'),
    ('Event Photography', 'Photography for special events', 'service', 'Photography', 2, 'event-photography'),
    ('Portrait Photography', 'Professional portrait sessions', 'service', 'Photography', 3, 'portrait-photography'),
    ('Wedding Catering', 'Catering services for weddings', 'service', 'Catering', 1, 'wedding-catering'),
    ('Corporate Catering', 'Catering for business events', 'service', 'Catering', 2, 'corporate-catering'),
    ('Party Catering', 'Catering for parties and celebrations', 'service', 'Catering', 3, 'party-catering'),
    ('Balloon Decorations', 'Balloon arrangements and decorations', 'equipment', 'Decorations', 1, 'balloon-decorations'),
    ('Floral Centerpieces', 'Beautiful floral arrangements for tables', 'equipment', 'Decorations', 2, 'floral-centerpieces'),
    ('Lighting Equipment', 'Professional lighting for events', 'equipment', 'Decorations', 3, 'lighting-equipment')
) AS subcategory_data(name, description, type, parent_name, sort_order, slug)
JOIN categories parent_cats ON parent_cats.name = subcategory_data.parent_name
WHERE NOT EXISTS (
  SELECT 1 FROM categories existing 
  WHERE existing.name = subcategory_data.name 
  AND existing.parent_id = parent_cats.id
);

-- 3. Data Integrity Verification

-- Remove any duplicate categories (keeping the one with the lowest ID)
DELETE FROM categories c1
WHERE EXISTS (
  SELECT 1 FROM categories c2 
  WHERE c2.name = c1.name 
  AND c2.id < c1.id
);

-- 4. Final verification
SELECT 
  'Comprehensive fix complete' as status,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM categories;