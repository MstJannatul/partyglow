-- Check if there are any missing RLS policies and fix security issues

-- First, verify listing_categories policies exist and are correct
DO $$ 
BEGIN
    -- Check if there are tables with RLS enabled but no policies
    IF EXISTS (
        SELECT 1 
        FROM pg_tables t 
        WHERE t.schemaname = 'public' 
        AND t.rowsecurity = true 
        AND NOT EXISTS (
            SELECT 1 
            FROM pg_policies p 
            WHERE p.schemaname = 'public' 
            AND p.tablename = t.tablename
        )
    ) THEN
        RAISE NOTICE 'Found tables with RLS enabled but no policies';
    END IF;
END $$;

-- Ensure all required policies exist for listing_categories
-- (They should already exist from previous migration, but let's be safe)

-- Create get_user_role function if it doesn't exist (needed for some policies)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE profiles.user_id = $1),
    'customer'
  );
$$;

-- Update categories to include sort_order in type if needed
UPDATE categories 
SET sort_order = COALESCE(sort_order, 0) 
WHERE sort_order IS NULL;

-- Add missing subcategories if they don't exist
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
('Karaoke & Interactive', 'Karaoke, interactive music experiences', 'service', '11111111-1111-1111-1111-111111111111', 'karaoke-interactive', 4),
('Food Trucks & Vendors', 'Mobile food services and specialty vendors', 'service', '22222222-2222-2222-2222-222222222222', 'food-trucks-vendors', 2),
('Dessert Tables', 'Cake, desserts, candy tables, and sweet treats', 'service', '22222222-2222-2222-2222-222222222222', 'dessert-tables', 3),
('Bar Services', 'Bartenders, mobile bars, and beverage services', 'service', '22222222-2222-2222-2222-222222222222', 'bar-services', 4),
('Specialty Beverages', 'Coffee bars, specialty drinks, non-alcoholic options', 'service', '22222222-2222-2222-2222-222222222222', 'specialty-beverages', 5),
('Videography', 'Event videography and video production', 'service', '33333333-3333-3333-3333-333333333333', 'videography', 2),
('Social Media Content', 'Content creation for social media and marketing', 'service', '33333333-3333-3333-3333-333333333333', 'social-media-content', 4),
('Linens & Tableware', 'Tablecloths, napkins, plates, glassware, utensils', 'equipment', '44444444-4444-4444-4444-444444444444', 'linens-tableware', 2),
('Tents & Canopies', 'Event tents, canopies, and outdoor coverage', 'equipment', '44444444-4444-4444-4444-444444444444', 'tents-canopies', 3),
('Sound & AV Equipment', 'Speakers, microphones, projectors, AV systems', 'equipment', '44444444-4444-4444-4444-444444444444', 'sound-av-equipment', 4),
('Staging & Flooring', 'Stages, dance floors, platforms, and flooring solutions', 'equipment', '44444444-4444-4444-4444-444444444444', 'staging-flooring', 5),
('Floral & Centerpieces', 'Flowers, centerpieces, and floral arrangements', 'service', '55555555-5555-5555-5555-555555555555', 'floral-centerpieces', 1),
('Balloon Decor', 'Balloon arches, arrangements, and decorations', 'service', '55555555-5555-5555-5555-555555555555', 'balloon-decor', 2),
('Lighting & Ambiance', 'Event lighting, string lights, uplighting, mood lighting', 'equipment', '55555555-5555-5555-5555-555555555555', 'lighting-ambiance', 3),
('Backdrops & Props', 'Photo backdrops, props, and decorative elements', 'equipment', '55555555-5555-5555-5555-555555555555', 'backdrops-props', 4),
('Theme Styling', 'Complete theme design and styling services', 'service', '55555555-5555-5555-5555-555555555555', 'theme-styling', 5),
('Games & Activities', 'Party games, activities, and interactive entertainment', 'service', '66666666-6666-6666-6666-666666666666', 'games-activities', 2),
('Face Painting & Crafts', 'Face painters, craft stations, and creative activities', 'service', '66666666-6666-6666-6666-666666666666', 'face-painting-crafts', 3),
('Specialty Attractions', 'Unique attractions, carnival games, specialty entertainment', 'service', '66666666-6666-6666-6666-666666666666', 'specialty-attractions', 4),
('Day-of Coordination', 'Day-of coordination and event management', 'service', '77777777-7777-7777-7777-777777777777', 'day-of-coordination', 2),
('Venue Services', 'Venue rentals and location services', 'service', '77777777-7777-7777-7777-777777777777', 'venue-services', 3),
('Setup & Breakdown', 'Event setup, breakdown, and logistics support', 'service', '77777777-7777-7777-7777-777777777777', 'setup-breakdown', 4)
ON CONFLICT (name, parent_id) DO NOTHING;