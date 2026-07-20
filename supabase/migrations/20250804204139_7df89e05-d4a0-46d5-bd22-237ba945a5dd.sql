-- Fix ambiguous column references in all booking availability functions

-- Fix validate_booking_availability function
CREATE OR REPLACE FUNCTION public.validate_booking_availability(p_vendor_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  vendor_enabled BOOLEAN;
  day_of_week INTEGER;
  start_time TIME;
  end_time TIME;
  has_availability_rule BOOLEAN := FALSE;
BEGIN
  -- Check if vendor has availability enabled
  SELECT availability_enabled INTO vendor_enabled
  FROM profiles 
  WHERE user_id = p_vendor_id;
  
  IF NOT COALESCE(vendor_enabled, TRUE) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for existing booking conflicts
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE vendor_id = p_vendor_id
      AND status IN ('confirmed', 'requested')
      AND tstzrange(start_date, end_date, '[)') && tstzrange(p_start_date, p_end_date, '[)')
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for blockout conflicts - fixed ambiguous column references
  IF EXISTS (
    SELECT 1 FROM vendor_blockouts vb
    WHERE vb.user_id = p_vendor_id
      AND vb.is_active = TRUE
      AND p_start_date::date BETWEEN vb.start_date AND vb.end_date
      AND (
        vb.start_time IS NULL OR vb.end_time IS NULL OR
        (p_start_date::time BETWEEN vb.start_time AND vb.end_time) OR
        (p_end_date::time BETWEEN vb.start_time AND vb.end_time) OR
        (vb.start_time BETWEEN p_start_date::time AND p_end_date::time)
      )
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Extract day of week and time components
  day_of_week := EXTRACT(DOW FROM p_start_date); -- 0=Sunday, 1=Monday, etc.
  start_time := p_start_date::time;
  end_time := p_end_date::time;
  
  -- Check availability rules for the day - fixed ambiguous column references
  SELECT EXISTS (
    SELECT 1 FROM vendor_availability_rules var
    WHERE var.user_id = p_vendor_id
      AND var.is_active = TRUE
      AND var.day_of_week = EXTRACT(DOW FROM p_start_date)
      AND var.start_time <= p_start_date::time
      AND var.end_time >= p_end_date::time
      AND (var.effective_from IS NULL OR p_start_date::date >= var.effective_from)
      AND (var.effective_until IS NULL OR p_start_date::date <= var.effective_until)
  ) INTO has_availability_rule;
  
  RETURN has_availability_rule;
END;
$function$;

-- Fix validate_block_booking_availability function
CREATE OR REPLACE FUNCTION public.validate_block_booking_availability(p_vendor_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  vendor_enabled BOOLEAN;
  booking_date DATE;
  booking_day_of_week INTEGER;
  booking_start_time TIME;
  booking_end_time TIME;
  matching_block RECORD;
BEGIN
  -- Check if vendor has availability enabled
  SELECT availability_enabled INTO vendor_enabled
  FROM profiles 
  WHERE user_id = p_vendor_id;
  
  IF NOT COALESCE(vendor_enabled, TRUE) THEN
    RETURN FALSE;
  END IF;

  -- Extract date and time components
  booking_date := p_start_date::DATE;
  booking_day_of_week := EXTRACT(DOW FROM p_start_date);
  booking_start_time := p_start_date::TIME;
  booking_end_time := p_end_date::TIME;

  -- Check for existing booking conflicts
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE vendor_id = p_vendor_id
      AND status IN ('confirmed', 'requested')
      AND tstzrange(start_date, end_date, '[)') && tstzrange(p_start_date, p_end_date, '[)')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Find a matching availability block - fixed ambiguous column references
  SELECT * INTO matching_block
  FROM availability_blocks ab
  WHERE ab.vendor_id = p_vendor_id
    AND ab.is_active = TRUE
    AND ab.is_booked = FALSE
    AND ab.start_time <= booking_start_time
    AND ab.end_time >= booking_end_time
    AND (
      -- One-time block matching the date
      (ab.date = booking_date AND ab.repeat_weekly = FALSE) OR
      -- Recurring block matching the day of week
      (ab.day_of_week = booking_day_of_week AND ab.repeat_weekly = TRUE)
    )
  LIMIT 1;

  RETURN matching_block.id IS NOT NULL;
END;
$function$;

-- Fix validate_flexible_booking_availability function
CREATE OR REPLACE FUNCTION public.validate_flexible_booking_availability(p_vendor_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  vendor_enabled BOOLEAN;
  booking_date DATE;
  booking_day_of_week INTEGER;
  booking_start_time TIME;
  booking_end_time TIME;
  matching_block RECORD;
  requires_manual_approval BOOLEAN;
BEGIN
  -- Check if vendor has availability enabled
  SELECT availability_enabled, COALESCE(require_manual_booking_approval, false) 
  INTO vendor_enabled, requires_manual_approval
  FROM profiles 
  WHERE user_id = p_vendor_id;
  
  IF NOT COALESCE(vendor_enabled, TRUE) THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', 'vendor_not_accepting_bookings',
      'requires_approval', false
    );
  END IF;

  -- Extract date and time components
  booking_date := p_start_date::DATE;
  booking_day_of_week := EXTRACT(DOW FROM p_start_date);
  booking_start_time := p_start_date::TIME;
  booking_end_time := p_end_date::TIME;

  -- Check for existing booking conflicts
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE vendor_id = p_vendor_id
      AND status IN ('confirmed', 'requested')
      AND tstzrange(start_date, end_date, '[)') && tstzrange(p_start_date, p_end_date, '[)')
  ) THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', 'booking_conflict',
      'requires_approval', false
    );
  END IF;

  -- Find a matching availability block that covers the START time - fixed ambiguous column references
  SELECT * INTO matching_block
  FROM availability_blocks ab
  WHERE ab.vendor_id = p_vendor_id
    AND ab.is_active = TRUE
    AND ab.is_booked = FALSE
    AND ab.start_time <= booking_start_time
    AND ab.end_time > booking_start_time  -- Start time must be within block
    AND (
      -- One-time block matching the date
      (ab.date = booking_date AND ab.repeat_weekly = FALSE) OR
      -- Recurring block matching the day of week
      (ab.day_of_week = booking_day_of_week AND ab.repeat_weekly = TRUE)
    )
  LIMIT 1;

  -- If no matching block found for start time, reject
  IF matching_block.id IS NULL THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', 'start_time_outside_block',
      'requires_approval', false
    );
  END IF;

  -- Determine if approval is required
  -- If vendor requires manual approval for all bookings OR if booking extends beyond block
  IF requires_manual_approval OR booking_end_time > matching_block.end_time THEN
    -- Requires vendor approval
    RETURN jsonb_build_object(
      'is_valid', true,
      'reason', CASE 
        WHEN requires_manual_approval THEN 'manual_approval_required'
        ELSE 'extends_beyond_block' 
      END,
      'requires_approval', true,
      'block_id', matching_block.id,
      'block_start', matching_block.start_time,
      'block_end', matching_block.end_time,
      'extends_beyond', booking_end_time > matching_block.end_time
    );
  ELSE
    -- Auto-confirm (booking is fully within block)
    RETURN jsonb_build_object(
      'is_valid', true,
      'reason', 'within_block',
      'requires_approval', false,
      'block_id', matching_block.id,
      'block_start', matching_block.start_time,
      'block_end', matching_block.end_time,
      'extends_beyond', false
    );
  END IF;
END;
$function$;