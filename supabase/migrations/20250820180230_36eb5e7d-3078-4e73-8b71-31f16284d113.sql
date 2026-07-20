-- Phase 1: Simplify and clean up categories
-- First, let's consolidate and clean up the category structure

-- Remove duplicate DJ service categories (keep main ones, remove subcategories)
DELETE FROM categories WHERE id IN (
  '0ddc46e4-49de-4013-82f5-386f57c43259', -- Wedding DJ (subcategory)
  '36d7c58e-fa49-49de-88eb-6585767ed3df', -- Party DJ (subcategory)  
  'b1698551-d189-4a73-acb3-1da665880bc3'  -- Corporate Events DJ (subcategory)
);

-- Remove duplicate photography subcategories (keep main Photography category)
DELETE FROM categories WHERE id IN (
  '7218e9a9-cc4f-4a73-946f-d5e9415cf117', -- Wedding Photography (subcategory)
  'edd36ace-ec0a-410f-9133-67a1e636fe7f', -- Event Photography (subcategory)
  '4648584b-2b9f-41bd-a219-1976593f6574'  -- Portrait Photography (subcategory)
);

-- Remove duplicate catering subcategories (keep main Catering category)
DELETE FROM categories WHERE id IN (
  '7eaff8d4-11dd-4806-aff7-713727b1ca2c', -- Wedding Catering (subcategory)
  '1e87679f-a1fb-4c1f-bf5a-0a722da1bea2', -- Corporate Catering (subcategory)
  'ab42c508-c3b8-49ab-864d-64304355fcda'  -- Party Catering (subcategory)
);

-- Remove duplicate main categories and keep cleaner structure
DELETE FROM categories WHERE id IN (
  '11111111-1111-1111-1111-111111111111', -- Entertainment & Music (duplicate of DJ Services)
  '22222222-2222-2222-2222-222222222222', -- Catering & Beverages (duplicate of Catering)
  '33333333-3333-3333-3333-333333333333', -- Photography & Videography (duplicate of Photography)
  '44444444-4444-4444-4444-444444444444', -- Party Rentals & Equipment (generic, not needed)
  '55555555-5555-5555-5555-555555555555', -- Decor & Styling (duplicate of Decorations)
  '66666666-6666-6666-6666-666666666666', -- Activities & Attractions (too broad)
  '77777777-7777-7777-7777-777777777777'  -- Event Services (too generic)
);

-- Update any listings that reference deleted categories to point to main categories
-- DJ subcategories → main DJ Services
UPDATE listings SET category_id = 'ada54aaf-3c1f-4cd4-a402-7190e2da5882' 
WHERE category_id IN (
  '0ddc46e4-49de-4013-82f5-386f57c43259',
  '36d7c58e-fa49-49de-88eb-6585767ed3df',
  'b1698551-d189-4a73-acb3-1da665880bc3',
  '11111111-1111-1111-1111-111111111111'
);

-- Photography subcategories → main Photography  
UPDATE listings SET category_id = 'e00e37a1-7dcc-4141-8fa4-d6d4684b6c09'
WHERE category_id IN (
  '7218e9a9-cc4f-4a73-946f-d5e9415cf117',
  'edd36ace-ec0a-410f-9133-67a1e636fe7f', 
  '4648584b-2b9f-41bd-a219-1976593f6574',
  '33333333-3333-3333-3333-333333333333'
);

-- Catering subcategories → main Catering
UPDATE listings SET category_id = 'e593c860-82a9-42f2-a8d0-9e6fbdc87f32'
WHERE category_id IN (
  '7eaff8d4-11dd-4806-aff7-713727b1ca2c',
  '1e87679f-a1fb-4c1f-bf5a-0a722da1bea2',
  'ab42c508-c3b8-49ab-864d-64304355fcda',
  '22222222-2222-2222-2222-222222222222'
);

-- Decor categories → main Decorations
UPDATE listings SET category_id = '9a4977a4-b5f0-4df5-a6a6-a885a50d4f58'
WHERE category_id IN (
  '55555555-5555-5555-5555-555555555555'
);

-- Equipment rentals → Tables & Chairs (most common)
UPDATE listings SET category_id = '6b31f3aa-1966-4f36-939d-42d631632feb'
WHERE category_id IN (
  '44444444-4444-4444-4444-444444444444'
);

-- Activities/Event Services → DJ Services (closest match)
UPDATE listings SET category_id = 'ada54aaf-3c1f-4cd4-a402-7190e2da5882'
WHERE category_id IN (
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

-- Clean up any other references in related tables
DELETE FROM listing_categories WHERE category_id IN (
  '0ddc46e4-49de-4013-82f5-386f57c43259', '36d7c58e-fa49-49de-88eb-6585767ed3df', 'b1698551-d189-4a73-acb3-1da665880bc3',
  '7218e9a9-cc4f-4a73-946f-d5e9415cf117', 'edd36ace-ec0a-410f-9133-67a1e636fe7f', '4648584b-2b9f-41bd-a219-1976593f6574',
  '7eaff8d4-11dd-4806-aff7-713727b1ca2c', '1e87679f-a1fb-4c1f-bf5a-0a722da1bea2', 'ab42c508-c3b8-49ab-864d-64304355fcda',
  '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

-- Update sort orders for cleaner organization
UPDATE categories SET sort_order = 1 WHERE name = 'DJ Services';
UPDATE categories SET sort_order = 2 WHERE name = 'Photography';  
UPDATE categories SET sort_order = 3 WHERE name = 'Catering';
UPDATE categories SET sort_order = 4 WHERE name = 'Decorations';
UPDATE categories SET sort_order = 5 WHERE name = 'Tables & Chairs';
UPDATE categories SET sort_order = 6 WHERE name = 'Tents & Canopies';
UPDATE categories SET sort_order = 7 WHERE name = 'Sound Equipment';
UPDATE categories SET sort_order = 8 WHERE name = 'Lighting';
UPDATE categories SET sort_order = 9 WHERE name = 'Kitchen & Serving';
UPDATE categories SET sort_order = 10 WHERE name = 'Games';
UPDATE categories SET sort_order = 11 WHERE name = 'Stages & Flooring';
UPDATE categories SET sort_order = 12 WHERE name = 'Heating & Cooling';
UPDATE categories SET sort_order = 13 WHERE name = 'Generators';
UPDATE categories SET sort_order = 14 WHERE name = 'Trash & Cleaning';