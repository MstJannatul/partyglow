-- Create automated_reminders table
CREATE TABLE public.automated_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('payment_deadline', 'vendor_response', 'event_preparation', 'review_request')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  message_template TEXT,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automated_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view reminders for their bookings" 
ON public.automated_reminders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM bookings 
  WHERE bookings.id = automated_reminders.booking_id 
  AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
));

CREATE POLICY "System can manage reminders" 
ON public.automated_reminders 
FOR ALL 
USING (true);

-- Create get_booking_timeline_stats function
CREATE OR REPLACE FUNCTION public.get_booking_timeline_stats(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_bookings', COALESCE(total_bookings, 0),
    'pending_bookings', COALESCE(pending_bookings, 0),
    'confirmed_bookings', COALESCE(confirmed_bookings, 0),
    'completed_bookings', COALESCE(completed_bookings, 0),
    'upcoming_events', COALESCE(upcoming_events, 0)
  ) INTO result
  FROM (
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'requested') as pending_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed' AND start_date > now()) as upcoming_events
    FROM bookings 
    WHERE customer_id = user_id OR vendor_id = user_id
  ) stats;
  
  RETURN result;
END;
$$;

-- Create trigger for updating updated_at
CREATE TRIGGER update_automated_reminders_updated_at
  BEFORE UPDATE ON public.automated_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();