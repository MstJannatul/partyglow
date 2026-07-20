-- Phase 1: Fix ambiguous column references and create simplified availability system

-- Create a simplified vendor_availability table
CREATE TABLE IF NOT EXISTS public.vendor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor availability
CREATE POLICY "Anyone can view vendor availability" 
ON public.vendor_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Vendors can manage their own availability" 
ON public.vendor_availability 
FOR ALL 
USING (auth.uid() = vendor_id);

-- Create updated timestamp trigger
CREATE TRIGGER update_vendor_availability_updated_at
BEFORE UPDATE ON public.vendor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the problematic functions that have ambiguous column references
DROP FUNCTION IF EXISTS public.validate_flexible_booking_availability(uuid, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_vendor_availability_intersection(uuid[], date, integer);
DROP FUNCTION IF EXISTS public.validate_block_booking_availability(uuid, timestamp with time zone, timestamp with time zone);

-- Create a simplified multi-vendor availability checking function
CREATE OR REPLACE FUNCTION public.check_multi_vendor_availability(
  p_vendor_ids UUID[],
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  vendor_id UUID,
  is_available BOOLEAN,
  conflict_reason TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_vendor_id UUID;
  booking_day INTEGER;
  booking_start_time TIME;
  booking_end_time TIME;
  has_availability BOOLEAN;
  has_booking_conflict BOOLEAN;
BEGIN
  booking_day := EXTRACT(DOW FROM p_start_time);
  booking_start_time := p_start_time::TIME;
  booking_end_time := p_end_time::TIME;

  FOREACH current_vendor_id IN ARRAY p_vendor_ids LOOP
    -- Check if vendor has availability for this day/time
    SELECT EXISTS (
      SELECT 1 FROM public.vendor_availability va
      WHERE va.vendor_id = current_vendor_id
        AND va.day_of_week = booking_day
        AND va.start_time <= booking_start_time
        AND va.end_time >= booking_end_time
    ) INTO has_availability;

    -- Check for booking conflicts
    SELECT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.vendor_id = current_vendor_id
        AND b.status IN ('confirmed', 'requested', 'in_progress')
        AND tstzrange(b.start_date, b.end_date, '[)') && tstzrange(p_start_time, p_end_time, '[)')
    ) INTO has_booking_conflict;

    -- Return result for this vendor
    IF NOT has_availability THEN
      vendor_id := current_vendor_id;
      is_available := false;
      conflict_reason := 'outside_availability_hours';
      RETURN NEXT;
    ELSIF has_booking_conflict THEN
      vendor_id := current_vendor_id;
      is_available := false;
      conflict_reason := 'booking_conflict';
      RETURN NEXT;
    ELSE
      vendor_id := current_vendor_id;
      is_available := true;
      conflict_reason := NULL;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;

-- Create a simple function to get available time slots for multiple vendors
CREATE OR REPLACE FUNCTION public.get_multi_vendor_available_slots(
  p_vendor_ids UUID[],
  p_date DATE,
  p_duration_hours INTEGER DEFAULT 2
)
RETURNS TABLE(
  slot_start_time TIME,
  slot_end_time TIME,
  available_vendor_count INTEGER,
  total_vendors INTEGER,
  is_fully_available BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  time_slot TIME;
  slot_end TIME;
  available_count INTEGER;
  vendor_count INTEGER;
BEGIN
  vendor_count := array_length(p_vendor_ids, 1);
  
  -- Generate time slots from 8 AM to 10 PM
  FOR time_slot IN 
    SELECT generate_series('08:00:00'::TIME, '22:00:00'::TIME - (p_duration_hours || ' hours')::INTERVAL, '30 minutes')::TIME
  LOOP
    slot_end := time_slot + (p_duration_hours || ' hours')::INTERVAL;
    
    -- Count how many vendors are available for this slot
    SELECT COUNT(*) INTO available_count
    FROM public.check_multi_vendor_availability(
      p_vendor_ids,
      (p_date || ' ' || time_slot)::TIMESTAMPTZ,
      (p_date || ' ' || slot_end)::TIMESTAMPTZ
    ) availability
    WHERE availability.is_available = true;
    
    -- Return the slot information
    slot_start_time := time_slot;
    slot_end_time := slot_end;
    available_vendor_count := available_count;
    total_vendors := vendor_count;
    is_fully_available := (available_count = vendor_count);
    RETURN NEXT;
  END LOOP;
END;
$function$;

-- Create a simple booking validation function to replace the problematic one
CREATE OR REPLACE FUNCTION public.validate_booking_availability_simple(
  p_vendor_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  availability_result RECORD;
BEGIN
  -- Use the multi-vendor function for single vendor (array of one)
  SELECT * INTO availability_result
  FROM public.check_multi_vendor_availability(
    ARRAY[p_vendor_id],
    p_start_time,
    p_end_time
  ) WHERE vendor_id = p_vendor_id;

  RETURN jsonb_build_object(
    'is_valid', COALESCE(availability_result.is_available, false),
    'reason', COALESCE(availability_result.conflict_reason, 'no_availability_set'),
    'requires_approval', false
  );
END;
$function$;