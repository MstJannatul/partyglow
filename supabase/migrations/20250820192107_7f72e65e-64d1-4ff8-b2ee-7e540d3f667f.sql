-- Phase 1: Properly clean up categories by handling child categories first

-- First, migrate child categories to their new parents or convert to standalone
-- Photo Booths -> move to main equipment category (no parent)
UPDATE categories SET parent_id = NULL WHERE id = '91127dee-69ed-4e6b-8a2a-2f1c62a40503';

-- Update any listings that reference the subcategories to point to main categories
-- DJ subcategories → main DJ Services
UPDATE listings SET category_id = 'ada54aaf-3c1f-4cd4-a402-7190e2da5882' 
WHERE category_id IN (
  '0ddc46e4-49de-4013-82f5-386f57c43259', -- Wedding DJ
  '36d7c58e-fa49-49de-88eb-6585767ed3df', -- Party DJ
  'b1698551-d189-4a73-acb3-1da665880bc3'  -- Corporate Events DJ
);

-- Photography subcategories → main Photography  
UPDATE listings SET category_id = 'e00e37a1-7dcc-4141-8fa4-d6d4684b6c09'
WHERE category_id IN (
  '7218e9a9-cc4f-4a73-946f-d5e9415cf117', -- Wedding Photography
  'edd36ace-ec0a-410f-9133-67a1e636fe7f', -- Event Photography
  '4648584b-2b9f-41bd-a219-1976593f6574'  -- Portrait Photography
);

-- Catering subcategories → main Catering
UPDATE listings SET category_id = 'e593c860-82a9-42f2-a8d0-9e6fbdc87f32'
WHERE category_id IN (
  '7eaff8d4-11dd-4806-aff7-713727b1ca2c', -- Wedding Catering
  '1e87679f-a1fb-4c1f-bf5a-0a722da1bea2', -- Corporate Catering
  'ab42c508-c3b8-49ab-864d-64304355fcda'  -- Party Catering
);

-- Update any other references to duplicated parent categories
UPDATE listings SET category_id = 'ada54aaf-3c1f-4cd4-a402-7190e2da5882' -- DJ Services
WHERE category_id = '11111111-1111-1111-1111-111111111111'; -- Entertainment & Music

UPDATE listings SET category_id = 'e593c860-82a9-42f2-a8d0-9e6fbdc87f32' -- Catering
WHERE category_id = '22222222-2222-2222-2222-222222222222'; -- Catering & Beverages

UPDATE listings SET category_id = 'e00e37a1-7dcc-4141-8fa4-d6d4684b6c09' -- Photography
WHERE category_id = '33333333-3333-3333-3333-333333333333'; -- Photography & Videography

UPDATE listings SET category_id = '6b31f3aa-1966-4f36-939d-42d631632feb' -- Tables & Chairs
WHERE category_id = '44444444-4444-4444-4444-444444444444'; -- Party Rentals & Equipment

UPDATE listings SET category_id = '9a4977a4-b5f0-4df5-a6a6-a885a50d4f58' -- Decorations
WHERE category_id = '55555555-5555-5555-5555-555555555555'; -- Decor & Styling

UPDATE listings SET category_id = 'ada54aaf-3c1f-4cd4-a402-7190e2da5882' -- DJ Services
WHERE category_id IN (
  '66666666-6666-6666-6666-666666666666', -- Activities & Attractions
  '77777777-7777-7777-7777-777777777777'  -- Event Services
);

-- Now remove the subcategory records (children first)
DELETE FROM categories WHERE id IN (
  '0ddc46e4-49de-4013-82f5-386f57c43259', -- Wedding DJ
  '36d7c58e-fa49-49de-88eb-6585767ed3df', -- Party DJ  
  'b1698551-d189-4a73-acb3-1da665880bc3', -- Corporate Events DJ
  '7218e9a9-cc4f-4a73-946f-d5e9415cf117', -- Wedding Photography
  'edd36ace-ec0a-410f-9133-67a1e636fe7f', -- Event Photography
  '4648584b-2b9f-41bd-a219-1976593f6574', -- Portrait Photography
  '7eaff8d4-11dd-4806-aff7-713727b1ca2c', -- Wedding Catering
  '1e87679f-a1fb-4c1f-bf5a-0a722da1bea2', -- Corporate Catering
  'ab42c508-c3b8-49ab-864d-64304355fcda'  -- Party Catering
);

-- Then remove the duplicate parent categories
DELETE FROM categories WHERE id IN (
  '11111111-1111-1111-1111-111111111111', -- Entertainment & Music
  '22222222-2222-2222-2222-222222222222', -- Catering & Beverages
  '33333333-3333-3333-3333-333333333333', -- Photography & Videography
  '44444444-4444-4444-4444-444444444444', -- Party Rentals & Equipment
  '55555555-5555-5555-5555-555555555555', -- Decor & Styling
  '66666666-6666-6666-6666-666666666666', -- Activities & Attractions
  '77777777-7777-7777-7777-777777777777'  -- Event Services
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