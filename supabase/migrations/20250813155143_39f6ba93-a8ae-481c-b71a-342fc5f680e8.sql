-- Add parent_id, slug, and sort_order to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create junction table for multiple category assignments per listing
CREATE TABLE IF NOT EXISTS listing_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, category_id)
);

-- Enable RLS on listing_categories
ALTER TABLE listing_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view listing categories" ON listing_categories;
DROP POLICY IF EXISTS "Vendors can manage their listing categories" ON listing_categories;

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

-- Insert the 7 parent categories directly without complex VALUES
INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Entertainment & Music', 'DJs, live music, performers, and entertainment services', 'service', 'entertainment-music', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('22222222-2222-2222-2222-222222222222', 'Catering & Beverages', 'Food services, catering, bars, and beverage solutions', 'service', 'catering-beverages', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('33333333-3333-3333-3333-333333333333', 'Photography & Videography', 'Event photography, videography, and media services', 'service', 'photography-videography', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('44444444-4444-4444-4444-444444444444', 'Party Rentals & Equipment', 'Tables, chairs, linens, sound systems, and rental items', 'equipment', 'party-rentals-equipment', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('55555555-5555-5555-5555-555555555555', 'Decor & Styling', 'Decorations, florals, lighting, and aesthetic services', 'service', 'decor-styling', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('66666666-6666-6666-6666-666666666666', 'Activities & Attractions', 'Interactive entertainment, games, and activity providers', 'service', 'activities-attractions', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, type, slug, sort_order) VALUES
('77777777-7777-7777-7777-777777777777', 'Event Services', 'Planning, coordination, venues, and logistical support', 'service', 'event-services', 7)
ON CONFLICT (id) DO NOTHING;

-- Update existing categories to be children of appropriate parents
UPDATE categories SET parent_id = '11111111-1111-1111-1111-111111111111'::uuid, slug = 'djs-music', sort_order = 1 
WHERE name = 'DJs' AND parent_id IS NULL;

UPDATE categories SET parent_id = '33333333-3333-3333-3333-333333333333'::uuid, slug = 'photo-booths', sort_order = 3 
WHERE name = 'Photo Booths' AND parent_id IS NULL;

-- Migrate existing listing category assignments to the new junction table
INSERT INTO listing_categories (listing_id, category_id)
SELECT l.id, l.category_id 
FROM listings l 
WHERE l.category_id IS NOT NULL
ON CONFLICT (listing_id, category_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_listing_categories_listing_id ON listing_categories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_category_id ON listing_categories(category_id);