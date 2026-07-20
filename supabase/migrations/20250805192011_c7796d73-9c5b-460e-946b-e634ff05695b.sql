-- Create trigger function to send email notifications via edge function
CREATE OR REPLACE FUNCTION public.send_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_type text;
  recipient_id uuid;
BEGIN
  -- Determine notification type and recipient based on status change
  IF TG_OP = 'INSERT' THEN
    -- New booking request - notify vendor
    notification_type := 'booking_request';
    recipient_id := NEW.vendor_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Status change notifications
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_type := 'booking_confirmed';
        recipient_id := NEW.customer_id;
      WHEN 'cancelled' THEN
        notification_type := 'booking_cancelled';
        recipient_id := NEW.customer_id;
      WHEN 'completed' THEN
        notification_type := 'booking_completed';
        recipient_id := NEW.customer_id;
      ELSE
        RETURN NEW; -- Skip other status changes
    END CASE;
  ELSE
    RETURN NEW; -- No notification needed
  END IF;

  -- Call the send-notifications edge function asynchronously
  PERFORM net.http_post(
    'https://eqaskkfrbxmpkopqctvv.supabase.co/functions/v1/send-notifications',
    '{"type": "' || notification_type || '", "booking_id": "' || NEW.id || '", "recipient_id": "' || recipient_id || '"}',
    '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for booking notifications
CREATE TRIGGER booking_email_notifications
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.send_email_notification();

-- Create trigger for message thread management (using existing function)
CREATE TRIGGER message_thread_update
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_thread_metadata();

-- Create trigger function for booking timeline events
CREATE OR REPLACE FUNCTION public.create_timeline_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create timeline events for status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.booking_timeline_events (
      booking_id,
      event_type,
      created_by,
      notes,
      event_data
    ) VALUES (
      NEW.id,
      'status_change',
      auth.uid(),
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for booking timeline events
CREATE TRIGGER booking_timeline_events
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();