-- Fix null category_id issues by assigning to a default service category
UPDATE listings 
SET category_id = (
  SELECT id FROM categories 
  WHERE type = 'service' 
  LIMIT 1
)
WHERE category_id IS NULL AND is_active = true;

-- Add constraint to prevent future null category issues
ALTER TABLE listings 
ADD CONSTRAINT listings_category_id_not_null 
CHECK (category_id IS NOT NULL);