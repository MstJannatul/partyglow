-- Update inventory availability to support multiple items per listing and add index

-- Create partial index to speed up listing lookups on inventory items
CREATE INDEX IF NOT EXISTS idx_inventory_items_listing_active 
  ON public.inventory_items (listing_id)
  WHERE is_active = true;

-- Replace function to compute availability across all active inventory items
CREATE OR REPLACE FUNCTION public.check_inventory_availability(
  p_listing_id uuid,
  p_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_available INTEGER := 0;
  selected_item RECORD;
BEGIN
  -- Sum free quantity across all active inventory items for this listing
  SELECT COALESCE(SUM(quantity_available - reserved_quantity), 0)
  INTO total_available
  FROM public.inventory_items
  WHERE listing_id = p_listing_id
    AND is_active = true;

  -- Choose a single item capable of satisfying the requested quantity
  SELECT id,
         (quantity_available - reserved_quantity) AS free_qty
  INTO selected_item
  FROM public.inventory_items
  WHERE listing_id = p_listing_id
    AND is_active = true
    AND (quantity_available - reserved_quantity) >= p_quantity
  ORDER BY (quantity_available - reserved_quantity) DESC
  LIMIT 1;

  IF total_available <= 0 THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'no_inventory_found',
      'available_quantity', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'available', selected_item.id IS NOT NULL,
    'available_quantity', total_available,
    'inventory_item_id', selected_item.id,
    'max_quantity', total_available
  );
END;
$$;