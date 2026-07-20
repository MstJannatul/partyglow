-- Fix ambiguous column reference in get_vendor_availability_intersection function
CREATE OR REPLACE FUNCTION public.get_vendor_availability_intersection(p_vendor_ids uuid[], p_date date, p_duration integer)
 RETURNS TABLE(start_time time without time zone, end_time time without time zone, available_vendors uuid[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  time_slot TIME;
  end_slot TIME;
  vendor_id UUID;
  temp_available UUID[];
BEGIN
  FOR time_slot IN 
    SELECT generate_series('09:00:00'::TIME, '18:00:00'::TIME - (p_duration || ' hours')::INTERVAL, '1 hour')::TIME
  LOOP
    end_slot := time_slot + (p_duration || ' hours')::INTERVAL;
    temp_available := ARRAY[]::UUID[];

    -- Loop through each vendor and check if they are available in the current slot
    FOREACH vendor_id IN ARRAY p_vendor_ids LOOP
      -- Check for booking conflicts - properly qualify column names
      IF NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.vendor_id = vendor_id
          AND b.status IN ('confirmed', 'requested')
          AND DATE(b.start_date) = p_date
          AND (
            (b.start_date::time <= time_slot AND b.end_date::time > time_slot) OR
            (b.start_date::time < end_slot AND b.end_date::time >= end_slot) OR
            (b.start_date::time >= time_slot AND b.end_date::time <= end_slot)
          )
      )
      AND NOT EXISTS (
        SELECT 1 FROM vendor_blockouts vb
        WHERE vb.user_id = vendor_id
          AND vb.is_active = true
          AND p_date BETWEEN vb.start_date AND vb.end_date
          AND (
            vb.start_time IS NULL OR vb.end_time IS NULL OR
            (vb.start_time <= time_slot AND vb.end_time > time_slot) OR
            (vb.start_time < end_slot AND vb.end_time >= end_slot) OR
            (vb.start_time >= time_slot AND vb.end_time <= end_slot)
          )
      ) THEN
        temp_available := temp_available || vendor_id;
      END IF;
    END LOOP;

    -- Only return time slots where all vendors are available
    IF array_length(temp_available, 1) = array_length(p_vendor_ids, 1) THEN
      start_time := time_slot;
      end_time := end_slot;
      available_vendors := temp_available;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$function$;