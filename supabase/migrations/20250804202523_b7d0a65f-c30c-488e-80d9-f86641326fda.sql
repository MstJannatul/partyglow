-- Fix ambiguous column reference in lock_blocks_for_booking function
CREATE OR REPLACE FUNCTION public.lock_blocks_for_booking(p_vendor_id uuid, p_booking_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_date DATE;
  booking_day_of_week INTEGER;
  booking_start_time TIME;
  booking_end_time TIME;
BEGIN
  -- Extract date and time components
  booking_date := p_start_date::DATE;
  booking_day_of_week := EXTRACT(DOW FROM p_start_date);
  booking_start_time := p_start_date::TIME;
  booking_end_time := p_end_date::TIME;

  -- Mark all overlapping blocks as booked - fixed ambiguous column references
  UPDATE availability_blocks
  SET is_booked = TRUE, booking_id = p_booking_id, updated_at = now()
  WHERE vendor_id = p_vendor_id
    AND is_active = TRUE
    AND is_booked = FALSE
    AND (
      -- One-time blocks for this date
      (availability_blocks.date = booking_date AND repeat_weekly = FALSE AND
       (availability_blocks.start_time < booking_end_time AND availability_blocks.end_time > booking_start_time)) OR
      -- Recurring blocks for this day of week
      (day_of_week = booking_day_of_week AND repeat_weekly = TRUE AND
       (availability_blocks.start_time < booking_end_time AND availability_blocks.end_time > booking_start_time))
    );
END;
$function$;