-- Remove the duplicate simple_booking_availability function and create a single comprehensive one
DROP FUNCTION IF EXISTS public.simple_booking_availability(uuid, timestamp with time zone, timestamp with time zone);

-- Update the existing function to handle both cases with optional exclude parameter
CREATE OR REPLACE FUNCTION public.simple_booking_availability(
  p_vendor_id uuid, 
  p_start_date timestamp with time zone, 
  p_end_date timestamp with time zone, 
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vendor_enabled BOOLEAN;
  booking_day_of_week INTEGER;
  booking_start_time TIME;
BEGIN
  -- Check if vendor has availability enabled
  SELECT COALESCE(availability_enabled, true) INTO vendor_enabled
  FROM profiles 
  WHERE user_id = p_vendor_id;
  
  IF NOT vendor_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check for existing booking conflicts (prevent double bookings)
  -- Exclude the current booking if p_exclude_booking_id is provided
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE vendor_id = p_vendor_id
      AND status IN ('confirmed', 'requested')
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND tstzrange(start_date, end_date, '[)') && tstzrange(p_start_date, p_end_date, '[)')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Extract day of week and start time components (convert to local time for availability checking)
  booking_day_of_week := EXTRACT(DOW FROM p_start_date AT TIME ZONE 'UTC');
  booking_start_time := (p_start_date AT TIME ZONE 'UTC')::time;

  -- If no specific availability rules exist, allow booking (vendor hasn't set up availability yet)
  IF NOT EXISTS (SELECT 1 FROM vendor_availability WHERE vendor_id = p_vendor_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if vendor has availability for the start time only
  -- Booking is valid if it starts within vendor's available hours
  RETURN EXISTS (
    SELECT 1 FROM vendor_availability
    WHERE vendor_id = p_vendor_id
      AND day_of_week = booking_day_of_week
      AND start_time <= booking_start_time
      AND end_time > booking_start_time
  );
END;
$function$;