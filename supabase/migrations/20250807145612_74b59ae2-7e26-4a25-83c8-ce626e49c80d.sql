-- Clean up existing booking data by migrating JSON notes to proper tables
-- This will extract structured data from notes field and move it to appropriate tables

-- Function to safely extract JSON data and migrate to proper tables
CREATE OR REPLACE FUNCTION migrate_booking_json_notes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
  json_data JSONB;
  payment_ref TEXT;
  user_notes TEXT;
  items_data JSONB;
  delivery_data JSONB;
BEGIN
  -- Process each booking with JSON in notes field
  FOR booking_record IN 
    SELECT id, notes, vendor_id, customer_id
    FROM bookings 
    WHERE notes IS NOT NULL 
      AND notes LIKE '{%'  -- Only process records that start with JSON
  LOOP
    BEGIN
      -- Try to parse the JSON
      json_data := booking_record.notes::JSONB;
      
      -- Extract payment reference
      payment_ref := json_data->>'paymentReference';
      IF payment_ref IS NOT NULL AND payment_ref != '' THEN
        UPDATE bookings 
        SET payment_reference_number = payment_ref
        WHERE id = booking_record.id;
      END IF;
      
      -- Extract and create booking items if they exist
      items_data := json_data->'items';
      IF items_data IS NOT NULL THEN
        INSERT INTO booking_items (
          booking_id, vendor_id, item_type, item_id, quantity, unit_price, total_price
        )
        SELECT 
          booking_record.id,
          booking_record.vendor_id,
          COALESCE(item->>'item_type', 'service'),
          (item->'listing'->>'id')::UUID,
          COALESCE((item->>'quantity')::INTEGER, 1),
          COALESCE((item->'listing'->>'price')::NUMERIC, 0),
          COALESCE((item->'listing'->>'price')::NUMERIC, 0) * 
          COALESCE((item->>'quantity')::INTEGER, 1) * 
          COALESCE((item->>'duration_hours')::INTEGER, 1)
        FROM jsonb_array_elements(items_data) AS item
        WHERE item->'listing'->>'id' IS NOT NULL
        ON CONFLICT DO NOTHING;  -- Skip if already exists
      END IF;
      
      -- Extract and create delivery details if they exist
      delivery_data := json_data->'deliveryDetails';
      IF delivery_data IS NOT NULL THEN
        INSERT INTO booking_delivery_details (
          booking_id, vendor_id, delivery_type, address, instructions, preferred_time_window
        )
        SELECT 
          booking_record.id,
          booking_record.vendor_id,
          COALESCE(vendor_delivery->>'delivery_type', 'pickup'),
          vendor_delivery->>'address',
          vendor_delivery->>'instructions',
          vendor_delivery->>'preferred_time_window'
        FROM jsonb_each(delivery_data) AS vendor_delivery_entry(vendor_id, vendor_delivery)
        WHERE vendor_delivery->>'delivery_type' IS NOT NULL
        ON CONFLICT DO NOTHING;  -- Skip if already exists
      END IF;
      
      -- Clear the JSON from notes field, keeping only actual user notes
      user_notes := json_data->>'notes';
      IF user_notes IS NOT NULL AND user_notes != '' THEN
        UPDATE bookings 
        SET notes = user_notes
        WHERE id = booking_record.id;
      ELSE
        UPDATE bookings 
        SET notes = NULL
        WHERE id = booking_record.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- If JSON parsing fails, leave the record as is
      RAISE WARNING 'Failed to migrate booking %: %', booking_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
  
  RAISE NOTICE 'Booking notes migration completed';
END;
$$;

-- Execute the migration
SELECT migrate_booking_json_notes();

-- Drop the temporary function
DROP FUNCTION migrate_booking_json_notes();