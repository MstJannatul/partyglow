-- Fix column reference in simple_booking_availability function
CREATE OR REPLACE FUNCTION public.simple_booking_availability(p_vendor_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  vendor_enabled BOOLEAN;
  booking_day_of_week INTEGER;
  booking_start_time TIME;
  booking_end_time TIME;
BEGIN
  -- Check if vendor has availability enabled
  SELECT COALESCE(availability_enabled, true) INTO vendor_enabled
  FROM profiles 
  WHERE user_id = p_vendor_id;
  
  IF NOT vendor_enabled THEN
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

  -- Extract day of week and time components
  booking_day_of_week := EXTRACT(DOW FROM p_start_date);
  booking_start_time := p_start_date::time;
  booking_end_time := p_end_date::time;

  -- Check if vendor has availability for this day/time in vendor_availability table
  -- Fixed: Use vendor_id instead of user_id for vendor_availability table
  RETURN EXISTS (
    SELECT 1 FROM vendor_availability
    WHERE vendor_id = p_vendor_id
      AND day_of_week = booking_day_of_week
      AND start_time <= booking_start_time
      AND end_time >= booking_end_time
  );
END;
$function$;