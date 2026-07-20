-- Phase 1: Fix ambiguous column references and consolidate availability system

-- First, let's create a simplified vendor_availability table to replace the complex system
CREATE TABLE IF NOT EXISTS public.vendor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor availability
CREATE POLICY "Anyone can view active vendor availability" 
ON public.vendor_availability 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Vendors can manage their own availability" 
ON public.vendor_availability 
FOR ALL 
USING (auth.uid() = vendor_id);

-- Create updated timestamp trigger
CREATE TRIGGER update_vendor_availability_updated_at
BEFORE UPDATE ON public.vendor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the problematic functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.validate_flexible_booking_availability(uuid, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_vendor_availability_intersection(uuid[], date, integer);

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
  vendor_id UUID;
  booking_day INTEGER;
  booking_start_time TIME;
  booking_end_time TIME;
  has_availability BOOLEAN;
  has_booking_conflict BOOLEAN;
BEGIN
  booking_day := EXTRACT(DOW FROM p_start_time);
  booking_start_time := p_start_time::TIME;
  booking_end_time := p_end_time::TIME;

  FOREACH vendor_id IN ARRAY p_vendor_ids LOOP
    -- Check if vendor has availability for this day/time
    SELECT EXISTS (
      SELECT 1 FROM public.vendor_availability va
      WHERE va.vendor_id = vendor_id
        AND va.day_of_week = booking_day
        AND va.is_active = true
        AND va.start_time <= booking_start_time
        AND va.end_time >= booking_end_time
    ) INTO has_availability;

    -- Check for booking conflicts
    SELECT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.vendor_id = vendor_id
        AND b.status IN ('confirmed', 'requested', 'in_progress')
        AND tstzrange(b.start_date, b.end_date, '[)') && tstzrange(p_start_time, p_end_time, '[)')
    ) INTO has_booking_conflict;

    -- Return result for this vendor
    IF NOT has_availability THEN
      RETURN QUERY SELECT vendor_id, false, 'outside_availability_hours'::TEXT;
    ELSIF has_booking_conflict THEN
      RETURN QUERY SELECT vendor_id, false, 'booking_conflict'::TEXT;
    ELSE
      RETURN QUERY SELECT vendor_id, true, NULL::TEXT;
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
  start_time TIME,
  end_time TIME,
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
    RETURN QUERY SELECT 
      time_slot as start_time,
      slot_end as end_time,
      available_count as available_vendor_count,
      vendor_count as total_vendors,
      (available_count = vendor_count) as is_fully_available;
  END LOOP;
END;
$function$;

-- Update the booking validation to use the new system
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
    'is_valid', availability_result.is_available,
    'reason', COALESCE(availability_result.conflict_reason, 'available'),
    'requires_approval', false
  );
END;
$function$;