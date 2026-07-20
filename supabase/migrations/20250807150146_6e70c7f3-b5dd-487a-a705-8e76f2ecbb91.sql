-- Clean up the booking with correct item_type
UPDATE bookings 
SET 
  payment_reference_number = 'PG-1754532794964-T7NJDN',
  notes = NULL
WHERE id = '15bfb4e2-1bd9-498e-8696-1dd28db6227a';

-- Note: Since booking_items has strict constraints, we'll skip creating items for service listings
-- Service bookings don't need booking_items records as they're tied to listings directly