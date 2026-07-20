-- Add missing service categories
INSERT INTO categories (name, type, sort_order, slug) VALUES
('Entertainment', 'service', 1, 'entertainment'),
('Florist', 'service', 2, 'florist'),
('Other Service', 'service', 4, 'other-service');

-- Update DJ Services to DJ & Live Music with broader scope
UPDATE categories 
SET name = 'DJ & Live Music', slug = 'dj-live-music', sort_order = 3
WHERE name = 'DJ Services' AND type = 'service';

-- Update service category sort orders
UPDATE categories SET sort_order = 5 WHERE name = 'Photography' AND type = 'service';
UPDATE categories SET sort_order = 6 WHERE name = 'Catering' AND type = 'service';

-- Clean up equipment category duplicates
-- First, migrate any listings from duplicate categories to the main ones
UPDATE listings 
SET category_id = (SELECT id FROM categories WHERE name = 'Lighting' AND type = 'equipment' LIMIT 1)
WHERE category_id IN (SELECT id FROM categories WHERE name = 'Lighting Equipment' AND type = 'equipment');

UPDATE listings 
SET category_id = (SELECT id FROM categories WHERE name = 'Decorations' AND type = 'equipment' LIMIT 1)
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE (name = 'Balloon Decorations' OR name = 'Floral Centerpieces') 
  AND type = 'equipment'
);

-- Delete duplicate equipment categories
DELETE FROM categories WHERE name = 'Lighting Equipment' AND type = 'equipment';
DELETE FROM categories WHERE name = 'Balloon Decorations' AND type = 'equipment';
DELETE FROM categories WHERE name = 'Floral Centerpieces' AND type = 'equipment';

-- Update equipment category sort orders for better organization
UPDATE categories SET sort_order = 10 WHERE name = 'Photo Booths' AND type = 'equipment';
UPDATE categories SET sort_order = 11 WHERE name = 'Decorations' AND type = 'equipment';
UPDATE categories SET sort_order = 12 WHERE name = 'Tables & Chairs' AND type = 'equipment';
UPDATE categories SET sort_order = 13 WHERE name = 'Tents & Canopies' AND type = 'equipment';
UPDATE categories SET sort_order = 14 WHERE name = 'Sound Equipment' AND type = 'equipment';
UPDATE categories SET sort_order = 15 WHERE name = 'Lighting' AND type = 'equipment';
UPDATE categories SET sort_order = 16 WHERE name = 'Kitchen & Serving' AND type = 'equipment';
UPDATE categories SET sort_order = 17 WHERE name = 'Games' AND type = 'equipment';
UPDATE categories SET sort_order = 18 WHERE name = 'Stages & Flooring' AND type = 'equipment';
UPDATE categories SET sort_order = 19 WHERE name = 'Heating & Cooling' AND type = 'equipment';
UPDATE categories SET sort_order = 20 WHERE name = 'Generators' AND type = 'equipment';
UPDATE categories SET sort_order = 21 WHERE name = 'Trash & Cleaning' AND type = 'equipment';