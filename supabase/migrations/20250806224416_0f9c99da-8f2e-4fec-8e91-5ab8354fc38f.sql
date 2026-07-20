-- Enhance cart_items table for inventory integration
ALTER TABLE public.cart_items 
ADD COLUMN quantity INTEGER DEFAULT 1,
ADD COLUMN item_type TEXT DEFAULT 'service' CHECK (item_type IN ('service', 'equipment', 'package')),
ADD COLUMN reserved_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN inventory_item_id UUID;

-- Add index for efficient expiration queries
CREATE INDEX idx_cart_items_reserved_until ON public.cart_items(reserved_until) WHERE reserved_until IS NOT NULL;

-- Enhance inventory_items table with reservation tracking (skip updated_at as it exists)
ALTER TABLE public.inventory_items 
ADD COLUMN reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0);

-- Add constraint to ensure reserved + available doesn't exceed total
ALTER TABLE public.inventory_items 
ADD CONSTRAINT check_inventory_availability CHECK (reserved_quantity <= quantity_available);

-- Create inventory availability check function
CREATE OR REPLACE FUNCTION public.check_inventory_availability(
  p_listing_id UUID,
  p_quantity INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inventory_record RECORD;
  available_quantity INTEGER;
BEGIN
  -- Get inventory item for listing
  SELECT * INTO inventory_record
  FROM inventory_items 
  WHERE listing_id = p_listing_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'no_inventory_found',
      'available_quantity', 0
    );
  END IF;
  
  available_quantity := inventory_record.quantity_available - inventory_record.reserved_quantity;
  
  RETURN jsonb_build_object(
    'available', available_quantity >= p_quantity,
    'available_quantity', available_quantity,
    'inventory_item_id', inventory_record.id,
    'max_quantity', inventory_record.quantity_available
  );
END;
$$;

-- Create inventory reservation function
CREATE OR REPLACE FUNCTION public.reserve_inventory_for_cart(
  p_cart_item_id UUID,
  p_inventory_item_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  available_quantity INTEGER;
  reservation_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set reservation expiry (15 minutes from now)
  reservation_expires := now() + INTERVAL '15 minutes';
  
  -- Check and reserve inventory atomically
  UPDATE inventory_items 
  SET 
    reserved_quantity = reserved_quantity + p_quantity,
    updated_at = now()
  WHERE id = p_inventory_item_id 
    AND (quantity_available - reserved_quantity) >= p_quantity
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update cart item with reservation details
  UPDATE cart_items 
  SET 
    inventory_item_id = p_inventory_item_id,
    reserved_until = reservation_expires,
    quantity = p_quantity
  WHERE id = p_cart_item_id;
  
  RETURN true;
END;
$$;

-- Create function to release inventory reservations
CREATE OR REPLACE FUNCTION public.release_inventory_reservation(
  p_cart_item_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cart_record RECORD;
BEGIN
  -- Get cart item details
  SELECT * INTO cart_record
  FROM cart_items 
  WHERE id = p_cart_item_id;
  
  IF FOUND AND cart_record.inventory_item_id IS NOT NULL THEN
    -- Release the reserved quantity
    UPDATE inventory_items 
    SET 
      reserved_quantity = reserved_quantity - COALESCE(cart_record.quantity, 0),
      updated_at = now()
    WHERE id = cart_record.inventory_item_id;
    
    -- Clear reservation from cart item
    UPDATE cart_items 
    SET 
      inventory_item_id = NULL,
      reserved_until = NULL
    WHERE id = p_cart_item_id;
  END IF;
END;
$$;

-- Create function to release expired cart reservations
CREATE OR REPLACE FUNCTION public.release_expired_cart_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count INTEGER := 0;
  cart_record RECORD;
BEGIN
  -- Find all expired cart reservations
  FOR cart_record IN 
    SELECT id, inventory_item_id, quantity
    FROM cart_items 
    WHERE reserved_until IS NOT NULL 
      AND reserved_until < now()
      AND inventory_item_id IS NOT NULL
  LOOP
    -- Release each expired reservation
    PERFORM release_inventory_reservation(cart_record.id);
    expired_count := expired_count + 1;
  END LOOP;
  
  -- Delete expired cart items
  DELETE FROM cart_items 
  WHERE reserved_until IS NOT NULL 
    AND reserved_until < now();
  
  RETURN expired_count;
END;
$$;

-- Create function to confirm booking and finalize inventory
CREATE OR REPLACE FUNCTION public.confirm_booking_inventory(
  p_booking_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  booking_record RECORD;
  cart_record RECORD;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  -- Process cart items for this customer and finalize inventory
  FOR cart_record IN 
    SELECT ci.*, ii.quantity_available
    FROM cart_items ci
    LEFT JOIN inventory_items ii ON ii.id = ci.inventory_item_id
    WHERE ci.customer_id = booking_record.customer_id
      AND ci.inventory_item_id IS NOT NULL
  LOOP
    -- Finalize the inventory reduction
    UPDATE inventory_items 
    SET 
      quantity_available = quantity_available - cart_record.quantity,
      reserved_quantity = reserved_quantity - cart_record.quantity,
      updated_at = now()
    WHERE id = cart_record.inventory_item_id;
    
    -- Create booking item record
    INSERT INTO booking_items (
      booking_id,
      vendor_id,
      item_type,
      item_id,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      p_booking_id,
      cart_record.vendor_id,
      cart_record.item_type,
      cart_record.inventory_item_id,
      cart_record.quantity,
      0, -- Will be calculated based on listing price
      0  -- Will be calculated based on listing price
    );
  END LOOP;
  
  -- Clear customer's cart after confirmation
  PERFORM clear_cart(booking_record.customer_id);
END;
$$;

-- Update existing insert_cart_item function to handle inventory
CREATE OR REPLACE FUNCTION public.insert_cart_item(
  p_customer_id UUID, 
  p_listing_id UUID, 
  p_vendor_id UUID, 
  p_duration_hours INTEGER DEFAULT 1,
  p_quantity INTEGER DEFAULT 1
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cart_item_id UUID;
  listing_record RECORD;
  inventory_check JSONB;
  reservation_success BOOLEAN;
BEGIN
  -- Get listing details to determine type
  SELECT * INTO listing_record FROM listings WHERE id = p_listing_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  -- Insert cart item first
  INSERT INTO cart_items (
    customer_id,
    listing_id,
    vendor_id,
    duration_hours,
    quantity,
    item_type
  ) VALUES (
    p_customer_id,
    p_listing_id,
    p_vendor_id,
    CASE WHEN listing_record.listing_type = 'service' THEN p_duration_hours ELSE 1 END,
    CASE WHEN listing_record.listing_type = 'equipment' THEN p_quantity ELSE 1 END,
    listing_record.listing_type
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
  END IF;
  
  RETURN cart_item_id;
END;
$$;

-- Update get_cart_items function to include inventory info
CREATE OR REPLACE FUNCTION public.get_cart_items(p_customer_id UUID)
RETURNS TABLE(
  id UUID,
  customer_id UUID,
  listing_id UUID,
  vendor_id UUID,
  duration_hours INTEGER,
  quantity INTEGER,
  item_type TEXT,
  reserved_until TIMESTAMP WITH TIME ZONE,
  added_at TIMESTAMP WITH TIME ZONE,
  listing JSONB,
  vendor JSONB,
  inventory_info JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.customer_id,
    ci.listing_id,
    ci.vendor_id,
    ci.duration_hours,
    ci.quantity,
    ci.item_type,
    ci.reserved_until,
    ci.added_at,
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'price', l.price,
      'location', l.location,
      'media_urls', l.media_urls,
      'min_booking_hours', l.min_booking_hours,
      'max_booking_hours', l.max_booking_hours,
      'listing_type', l.listing_type
    ) as listing,
    jsonb_build_object(
      'id', p.id,
      'user_id', p.user_id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'is_verified', p.is_verified
    ) as vendor,
    CASE 
      WHEN ci.inventory_item_id IS NOT NULL THEN
        jsonb_build_object(
          'inventory_item_id', ii.id,
          'available_quantity', ii.quantity_available - ii.reserved_quantity,
          'reserved_quantity', ci.quantity,
          'reservation_expires', ci.reserved_until
        )
      ELSE NULL
    END as inventory_info
  FROM cart_items ci
  JOIN listings l ON l.id = ci.listing_id
  JOIN profiles p ON p.user_id = ci.vendor_id
  LEFT JOIN inventory_items ii ON ii.id = ci.inventory_item_id
  WHERE ci.customer_id = p_customer_id
  ORDER BY ci.added_at DESC;
END;
$$;

-- Update remove_cart_item function to handle inventory
CREATE OR REPLACE FUNCTION public.remove_cart_item(
  p_item_id UUID, 
  p_customer_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Release inventory reservation if exists
  PERFORM release_inventory_reservation(p_item_id);
  
  -- Delete cart item
  DELETE FROM cart_items 
  WHERE id = p_item_id 
  AND customer_id = p_customer_id;
END;
$$;

-- Update clear_cart function to handle inventory
CREATE OR REPLACE FUNCTION public.clear_cart(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cart_item_record RECORD;
BEGIN
  -- Release all inventory reservations for this customer
  FOR cart_item_record IN 
    SELECT id FROM cart_items WHERE customer_id = p_customer_id
  LOOP
    PERFORM release_inventory_reservation(cart_item_record.id);
  END LOOP;
  
  -- Delete all cart items
  DELETE FROM cart_items 
  WHERE customer_id = p_customer_id;
END;
$$;