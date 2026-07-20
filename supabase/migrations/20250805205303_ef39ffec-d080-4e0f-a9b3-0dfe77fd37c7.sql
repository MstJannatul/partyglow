-- Fix the booking issues by removing problematic HTTP trigger and improving availability validation

-- First, drop the existing problematic trigger and function
DROP TRIGGER IF EXISTS booking_email_notifications ON public.bookings;
DROP FUNCTION IF EXISTS public.send_email_notification();

-- Update the simple_booking_availability function to fix timezone and validation issues
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

  -- Extract day of week and time components (convert to local time for availability checking)
  booking_day_of_week := EXTRACT(DOW FROM p_start_date AT TIME ZONE 'UTC');
  booking_start_time := (p_start_date AT TIME ZONE 'UTC')::time;
  booking_end_time := (p_end_date AT TIME ZONE 'UTC')::time;

  -- If no specific availability rules exist, allow booking (vendor hasn't set up availability yet)
  IF NOT EXISTS (SELECT 1 FROM vendor_availability WHERE vendor_id = p_vendor_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if vendor has availability for this day/time in vendor_availability table
  RETURN EXISTS (
    SELECT 1 FROM vendor_availability
    WHERE vendor_id = p_vendor_id
      AND day_of_week = booking_day_of_week
      AND start_time <= booking_start_time
      AND end_time >= booking_end_time
  );
END;
$function$;

-- Add a booking validation trigger that prevents conflicts
CREATE OR REPLACE FUNCTION public.validate_simple_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT simple_booking_availability(NEW.vendor_id, NEW.start_date, NEW.end_date) THEN
    RAISE EXCEPTION 'Booking conflicts with vendor availability or existing bookings';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the validation trigger
CREATE TRIGGER validate_booking_availability
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_simple_booking();