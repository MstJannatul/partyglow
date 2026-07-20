-- Re-run the migration to catch any remaining JSON notes
CREATE OR REPLACE FUNCTION migrate_remaining_booking_json_notes()
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
BEGIN
  -- Process remaining bookings with JSON in notes field
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
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- Clear the JSON from notes field, extracting actual user notes if they exist
      user_notes := json_data->>'notes';
      IF user_notes IS NOT NULL AND user_notes != '' AND user_notes != 'null' THEN
        UPDATE bookings 
        SET notes = user_notes
        WHERE id = booking_record.id;
      ELSE
        UPDATE bookings 
        SET notes = NULL
        WHERE id = booking_record.id;
      END IF;
      
      RAISE NOTICE 'Migrated booking % - payment ref: %, user notes: %', booking_record.id, payment_ref, user_notes;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate booking %: %', booking_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- Execute the migration
SELECT migrate_remaining_booking_json_notes();

-- Drop the function
DROP FUNCTION migrate_remaining_booking_json_notes();