-- Add parent_id to categories table to support hierarchy
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN slug TEXT;
ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create junction table for multiple category assignments per listing
CREATE TABLE listing_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, category_id)
);

-- Enable RLS on listing_categories
ALTER TABLE listing_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for listing_categories
CREATE POLICY "Anyone can view listing categories" 
ON listing_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Vendors can manage their listing categories" 
ON listing_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM listings 
  WHERE listings.id = listing_categories.listing_id 
  AND listings.user_id = auth.uid()
));

-- Insert the 7 parent categories
INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Entertainment & Music', 'DJs, live music, performers, and entertainment services', 'service', 'entertainment-music', 1),
  ('22222222-2222-2222-2222-222222222222', 'Catering & Beverages', 'Food services, catering, bars, and beverage solutions', 'service', 'catering-beverages', 2),
  ('33333333-3333-3333-3333-333333333333', 'Photography & Videography', 'Event photography, videography, and media services', 'service', 'photography-videography', 3),
  ('44444444-4444-4444-4444-444444444444', 'Party Rentals & Equipment', 'Tables, chairs, linens, sound systems, and rental items', 'equipment', 'party-rentals-equipment', 4),
  ('55555555-5555-5555-5555-555555555555', 'Decor & Styling', 'Decorations, florals, lighting, and aesthetic services', 'service', 'decor-styling', 5),
  ('66666666-6666-6666-6666-666666666666', 'Activities & Attractions', 'Interactive entertainment, games, and activity providers', 'service', 'activities-attractions', 6),
  ('77777777-7777-7777-7777-777777777777', 'Event Services', 'Planning, coordination, venues, and logistical support', 'service', 'event-services', 7);

-- Insert subcategories for Entertainment & Music
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('DJs & Music', 'Professional DJs and music services', 'service', '11111111-1111-1111-1111-111111111111', 'djs-music', 1),
  ('Live Bands', 'Live musical performances and bands', 'service', '11111111-1111-1111-1111-111111111111', 'live-bands', 2),
  ('Performers & Artists', 'Entertainers, magicians, comedians, dancers', 'service', '11111111-1111-1111-1111-111111111111', 'performers-artists', 3),
  ('Karaoke & Interactive', 'Karaoke, interactive music experiences', 'service', '11111111-1111-1111-1111-111111111111', 'karaoke-interactive', 4);

-- Insert subcategories for Catering & Beverages
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('Full Service Catering', 'Complete catering services and meal packages', 'service', '22222222-2222-2222-2222-222222222222', 'full-service-catering', 1),
  ('Food Trucks & Vendors', 'Mobile food services and specialty vendors', 'service', '22222222-2222-2222-2222-222222222222', 'food-trucks-vendors', 2),
  ('Dessert Tables', 'Cake, desserts, candy tables, and sweet treats', 'service', '22222222-2222-2222-2222-222222222222', 'dessert-tables', 3),
  ('Bar Services', 'Bartenders, mobile bars, and beverage services', 'service', '22222222-2222-2222-2222-222222222222', 'bar-services', 4),
  ('Specialty Beverages', 'Coffee bars, specialty drinks, non-alcoholic options', 'service', '22222222-2222-2222-2222-222222222222', 'specialty-beverages', 5);

-- Insert subcategories for Photography & Videography
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('Event Photography', 'Professional event and party photography', 'service', '33333333-3333-3333-3333-333333333333', 'event-photography', 1),
  ('Videography', 'Event videography and video production', 'service', '33333333-3333-3333-3333-333333333333', 'videography', 2),
  ('Photo Booths', 'Photo booth rentals and interactive photo experiences', 'equipment', '33333333-3333-3333-3333-333333333333', 'photo-booths', 3),
  ('Social Media Content', 'Content creation for social media and marketing', 'service', '33333333-3333-3333-3333-333333333333', 'social-media-content', 4);

-- Insert subcategories for Party Rentals & Equipment
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('Tables & Seating', 'Tables, chairs, benches, and seating arrangements', 'equipment', '44444444-4444-4444-4444-444444444444', 'tables-seating', 1),
  ('Linens & Tableware', 'Tablecloths, napkins, plates, glassware, utensils', 'equipment', '44444444-4444-4444-4444-444444444444', 'linens-tableware', 2),
  ('Tents & Canopies', 'Event tents, canopies, and outdoor coverage', 'equipment', '44444444-4444-4444-4444-444444444444', 'tents-canopies', 3),
  ('Sound & AV Equipment', 'Speakers, microphones, projectors, AV systems', 'equipment', '44444444-4444-4444-4444-444444444444', 'sound-av-equipment', 4),
  ('Staging & Flooring', 'Stages, dance floors, platforms, and flooring solutions', 'equipment', '44444444-4444-4444-4444-444444444444', 'staging-flooring', 5);

-- Insert subcategories for Decor & Styling
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('Floral & Centerpieces', 'Flowers, centerpieces, and floral arrangements', 'service', '55555555-5555-5555-5555-555555555555', 'floral-centerpieces', 1),
  ('Balloon Decor', 'Balloon arches, arrangements, and decorations', 'service', '55555555-5555-5555-5555-555555555555', 'balloon-decor', 2),
  ('Lighting & Ambiance', 'Event lighting, string lights, uplighting, mood lighting', 'equipment', '55555555-5555-5555-5555-555555555555', 'lighting-ambiance', 3),
  ('Backdrops & Props', 'Photo backdrops, props, and decorative elements', 'equipment', '55555555-5555-5555-5555-555555555555', 'backdrops-props', 4),
  ('Theme Styling', 'Complete theme design and styling services', 'service', '55555555-5555-5555-5555-555555555555', 'theme-styling', 5);

-- Insert subcategories for Activities & Attractions
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('Bounce Houses & Inflatables', 'Bounce houses, slides, and inflatable attractions', 'equipment', '66666666-6666-6666-6666-666666666666', 'bounce-houses-inflatables', 1),
  ('Games & Activities', 'Party games, activities, and interactive entertainment', 'service', '66666666-6666-6666-6666-666666666666', 'games-activities', 2),
  ('Face Painting & Crafts', 'Face painters, craft stations, and creative activities', 'service', '66666666-6666-6666-6666-666666666666', 'face-painting-crafts', 3),
  ('Specialty Attractions', 'Unique attractions, carnival games, specialty entertainment', 'service', '66666666-6666-6666-6666-666666666666', 'specialty-attractions', 4);

-- Insert subcategories for Event Services
INSERT INTO categories (name, description, type, parent_id, slug, sort_order) VALUES
  ('Event Planning', 'Full-service event planning and coordination', 'service', '77777777-7777-7777-7777-777777777777', 'event-planning', 1),
  ('Day-of Coordination', 'Day-of coordination and event management', 'service', '77777777-7777-7777-7777-777777777777', 'day-of-coordination', 2),
  ('Venue Services', 'Venue rentals and location services', 'service', '77777777-7777-7777-7777-777777777777', 'venue-services', 3),
  ('Setup & Breakdown', 'Event setup, breakdown, and logistics support', 'service', '77777777-7777-7777-7777-777777777777', 'setup-breakdown', 4);

-- Migrate existing listing category assignments to the new junction table
-- This preserves existing category assignments while allowing for future multi-category support
INSERT INTO listing_categories (listing_id, category_id)
SELECT id, category_id 
FROM listings 
WHERE category_id IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_listing_categories_listing_id ON listing_categories(listing_id);
CREATE INDEX idx_listing_categories_category_id ON listing_categories(category_id);

-- Update function to get optimized listings with new category structure
CREATE OR REPLACE FUNCTION public.get_optimized_listings_with_categories(
  p_category_id uuid DEFAULT NULL::uuid, 
  p_location text DEFAULT NULL::text, 
  p_min_price numeric DEFAULT NULL::numeric, 
  p_max_price numeric DEFAULT NULL::numeric, 
  p_search text DEFAULT NULL::text, 
  p_limit integer DEFAULT 10, 
  p_offset integer DEFAULT 0
) 
RETURNS TABLE(
  id uuid, title text, description text, price numeric, location text, 
  media_urls text[], listing_type text, delivery_type text, 
  min_booking_hours integer, max_booking_hours integer, is_active boolean, 
  created_at timestamp with time zone, updated_at timestamp with time zone, 
  user_id uuid, category_id uuid, vendor jsonb, categories jsonb, 
  reviews_count bigint, average_rating numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    l.id,
    l.title,
    l.description,
    l.price,
    l.location,
    l.media_urls,
    l.listing_type,
    l.delivery_type,
    l.min_booking_hours,
    l.max_booking_hours,
    l.is_active,
    l.created_at,
    l.updated_at,
    l.user_id,
    l.category_id,
    to_jsonb(p.*) as vendor,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'parent_id', c.parent_id,
          'slug', c.slug
        )
      ) FILTER (WHERE c.id IS NOT NULL), 
      '[]'::jsonb
    ) as categories,
    COALESCE(r.reviews_count, 0) as reviews_count,
    COALESCE(r.average_rating, 0) as average_rating
  FROM listings l
  LEFT JOIN profiles p ON p.user_id = l.user_id
  LEFT JOIN listing_categories lc ON lc.listing_id = l.id
  LEFT JOIN categories c ON c.id = lc.category_id
  LEFT JOIN (
    SELECT 
      rev.reviewed_user_id,
      COUNT(rev.id) as reviews_count,
      AVG(rev.rating)::numeric as average_rating
    FROM reviews rev
    GROUP BY rev.reviewed_user_id
  ) r ON r.reviewed_user_id = l.user_id
  WHERE 
    l.is_active = true
    AND (p_category_id IS NULL OR EXISTS (
      SELECT 1 FROM listing_categories lc2 
      JOIN categories cat ON cat.id = lc2.category_id
      WHERE lc2.listing_id = l.id 
      AND (cat.id = p_category_id OR cat.parent_id = p_category_id)
    ))
    AND (p_location IS NULL OR l.location ILIKE '%' || p_location || '%')
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_search IS NULL OR to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')) @@ plainto_tsquery('english', p_search))
  GROUP BY l.id, p.id, r.reviews_count, r.average_rating
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;