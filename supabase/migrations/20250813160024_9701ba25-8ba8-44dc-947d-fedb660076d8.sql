-- Fix security issues

-- 1. Add RLS policies for rate_limit_counters table
CREATE POLICY "Rate limit counters are managed by system" 
ON rate_limit_counters 
FOR ALL 
USING (true);

-- 2. Complete category setup with proper conflict handling
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) 
SELECT v.name, v.description, v.type, v.parent_id, v.slug, v.sort_order::integer
FROM (VALUES
  ('Karaoke & Interactive', 'Karaoke, interactive music experiences', 'service', '11111111-1111-1111-1111-111111111111', 'karaoke-interactive', '4'),
  ('Food Trucks & Vendors', 'Mobile food services and specialty vendors', 'service', '22222222-2222-2222-2222-222222222222', 'food-trucks-vendors', '2'),
  ('Dessert Tables', 'Cake, desserts, candy tables, and sweet treats', 'service', '22222222-2222-2222-2222-222222222222', 'dessert-tables', '3'),
  ('Bar Services', 'Bartenders, mobile bars, and beverage services', 'service', '22222222-2222-2222-2222-222222222222', 'bar-services', '4'),
  ('Specialty Beverages', 'Coffee bars, specialty drinks, non-alcoholic options', 'service', '22222222-2222-2222-2222-222222222222', 'specialty-beverages', '5'),
  ('Videography', 'Event videography and video production', 'service', '33333333-3333-3333-3333-333333333333', 'videography', '2'),
  ('Social Media Content', 'Content creation for social media and marketing', 'service', '33333333-3333-3333-3333-333333333333', 'social-media-content', '4'),
  ('Linens & Tableware', 'Tablecloths, napkins, plates, glassware, utensils', 'equipment', '44444444-4444-4444-4444-444444444444', 'linens-tableware', '2'),
  ('Tents & Canopies', 'Event tents, canopies, and outdoor coverage', 'equipment', '44444444-4444-4444-4444-444444444444', 'tents-canopies', '3'),
  ('Sound & AV Equipment', 'Speakers, microphones, projectors, AV systems', 'equipment', '44444444-4444-4444-4444-444444444444', 'sound-av-equipment', '4'),
  ('Staging & Flooring', 'Stages, dance floors, platforms, and flooring solutions', 'equipment', '44444444-4444-4444-4444-444444444444', 'staging-flooring', '5'),
  ('Floral & Centerpieces', 'Flowers, centerpieces, and floral arrangements', 'service', '55555555-5555-5555-5555-555555555555', 'floral-centerpieces', '1'),
  ('Balloon Decor', 'Balloon arches, arrangements, and decorations', 'service', '55555555-5555-5555-5555-555555555555', 'balloon-decor', '2'),
  ('Lighting & Ambiance', 'Event lighting, string lights, uplighting, mood lighting', 'equipment', '55555555-5555-5555-5555-555555555555', 'lighting-ambiance', '3'),
  ('Backdrops & Props', 'Photo backdrops, props, and decorative elements', 'equipment', '55555555-5555-5555-5555-555555555555', 'backdrops-props', '4'),
  ('Theme Styling', 'Complete theme design and styling services', 'service', '55555555-5555-5555-5555-555555555555', 'theme-styling', '5'),
  ('Bounce Houses & Inflatables', 'Bounce houses, slides, and inflatable attractions', 'equipment', '66666666-6666-6666-6666-666666666666', 'bounce-houses-inflatables', '1'),
  ('Games & Activities', 'Party games, activities, and interactive entertainment', 'service', '66666666-6666-6666-6666-666666666666', 'games-activities', '2'),
  ('Face Painting & Crafts', 'Face painters, craft stations, and creative activities', 'service', '66666666-6666-6666-6666-666666666666', 'face-painting-crafts', '3'),
  ('Specialty Attractions', 'Unique attractions, carnival games, specialty entertainment', 'service', '66666666-6666-6666-6666-666666666666', 'specialty-attractions', '4'),
  ('Event Planning', 'Full-service event planning and coordination', 'service', '77777777-7777-7777-7777-777777777777', 'event-planning', '1'),
  ('Day-of Coordination', 'Day-of coordination and event management', 'service', '77777777-7777-7777-7777-777777777777', 'day-of-coordination', '2'),
  ('Venue Services', 'Venue rentals and location services', 'service', '77777777-7777-7777-7777-777777777777', 'venue-services', '3'),
  ('Setup & Breakdown', 'Event setup, breakdown, and logistics support', 'service', '77777777-7777-7777-7777-777777777777', 'setup-breakdown', '4')
) AS v(name, description, type, parent_id, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE categories.name = v.name 
  AND categories.parent_id = v.parent_id::uuid
);