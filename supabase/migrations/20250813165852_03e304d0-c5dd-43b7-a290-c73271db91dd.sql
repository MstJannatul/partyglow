-- Add cart expiration system with 90-minute timeout
-- Add expires_at column to cart_items table
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 minutes');

-- Update existing cart items to have expiration times
UPDATE cart_items 
SET expires_at = added_at + INTERVAL '90 minutes'
WHERE expires_at IS NULL;

-- Enhanced insert_cart_item function to handle all cart item expiration
CREATE OR REPLACE FUNCTION public.insert_cart_item(
  p_customer_id uuid, 
  p_listing_id uuid, 
  p_vendor_id uuid, 
  p_duration_hours integer DEFAULT 1, 
  p_quantity integer DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cart_item_id UUID;
  listing_record RECORD;
  inventory_check JSONB;
  reservation_success BOOLEAN;
  cart_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set expiration time for all cart items (90 minutes from now)
  cart_expires_at := now() + INTERVAL '90 minutes';
  
  -- Get listing details to determine type
  SELECT * INTO listing_record FROM listings WHERE id = p_listing_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  -- Insert cart item with expiration
  INSERT INTO cart_items (
    customer_id,
    listing_id,
    vendor_id,
    duration_hours,
    quantity,
    item_type,
    expires_at
  ) VALUES (
    p_customer_id,
    p_listing_id,
    p_vendor_id,
    CASE WHEN listing_record.listing_type = 'service' THEN p_duration_hours ELSE 1 END,
    CASE WHEN listing_record.listing_type = 'equipment' THEN p_quantity ELSE 1 END,
    listing_record.listing_type,
    cart_expires_at
  ) RETURNING id INTO cart_item_id;
  
  -- For equipment items, check and reserve inventory
  IF listing_record.listing_type = 'equipment' THEN
    inventory_check := check_inventory_availability(p_listing_id, p_quantity);
    
    IF NOT (inventory_check->>'available')::boolean THEN
      DELETE FROM cart_items WHERE id = cart_item_id;
      RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', 
        inventory_check->>'available_quantity', p_quantity;
    END IF;
    
    reservation_success := reserve_inventory_for_cart(
      cart_item_id,
      (inventory_check->>'inventory_item_id')::UUID,
      p_quantity
    );
    
    IF NOT reservation_success THEN
      DELETE FROM cart_items WHERE id = cart_item_id;
      RAISE EXCEPTION 'Failed to reserve inventory';
    END IF;
    
    -- Update the reserved_until to match cart expiration for inventory items
    UPDATE cart_items 
    SET reserved_until = cart_expires_at
    WHERE id = cart_item_id;
  END IF;
  
  RETURN cart_item_id;
END;
$function$;

-- Enhanced release_expired_cart_reservations to handle all expired cart items
CREATE OR REPLACE FUNCTION public.release_expired_cart_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER := 0;
  cart_record RECORD;
BEGIN
  -- Find all expired cart items (both inventory and non-inventory)
  FOR cart_record IN 
    SELECT id, inventory_item_id, quantity, expires_at, reserved_until
    FROM cart_items 
    WHERE (
      -- Items with general expiration
      (expires_at IS NOT NULL AND expires_at < now()) OR
      -- Items with inventory reservation expiration
      (reserved_until IS NOT NULL AND reserved_until < now())
    )
  LOOP
    -- Release inventory reservation if exists
    IF cart_record.inventory_item_id IS NOT NULL THEN
      PERFORM release_inventory_reservation(cart_record.id);
    END IF;
    
    -- Delete the expired cart item
    DELETE FROM cart_items WHERE id = cart_record.id;
    
    expired_count := expired_count + 1;
  END LOOP;
  
  RETURN expired_count;
END;
$function$;

-- Create function to clean up guest cart items (for frontend cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_cart_items(p_guest_cart_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cleaned_items jsonb := '[]'::jsonb;
  cart_item jsonb;
  item_added_at timestamp with time zone;
  item_expires_at timestamp with time zone;
BEGIN
  -- Loop through each cart item and check if it's expired
  FOR cart_item IN SELECT * FROM jsonb_array_elements(p_guest_cart_items)
  LOOP
    -- Extract the addedAt timestamp
    item_added_at := (cart_item->>'addedAt')::timestamp with time zone;
    item_expires_at := item_added_at + INTERVAL '90 minutes';
    
    -- Only keep items that haven't expired
    IF item_expires_at > now() THEN
      cleaned_items := cleaned_items || cart_item;
    END IF;
  END LOOP;
  
  RETURN cleaned_items;
END;
$function$;