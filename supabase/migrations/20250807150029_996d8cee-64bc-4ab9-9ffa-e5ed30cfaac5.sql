-- Manually clean up the remaining booking with JSON notes
UPDATE bookings 
SET 
  payment_reference_number = 'PG-1754532794964-T7NJDN',
  notes = NULL
WHERE id = '15bfb4e2-1bd9-498e-8696-1dd28db6227a';

-- Also create the booking items for this booking
INSERT INTO booking_items (
  booking_id, vendor_id, item_type, item_id, quantity, unit_price, total_price
) VALUES 
  ('15bfb4e2-1bd9-498e-8696-1dd28db6227a', 'f2071b47-43d6-451d-9fff-d2616c3d22fd', 'service', 'b7270bb2-6160-4467-8329-2d20b61a8cbe', 1, 400, 1600),
  ('15bfb4e2-1bd9-498e-8696-1dd28db6227a', 'f2071b47-43d6-451d-9fff-d2616c3d22fd', 'service', 'b727ca99-cdb7-44da-8b4c-3836cca79db5', 1, 35, 140),
  ('15bfb4e2-1bd9-498e-8696-1dd28db6227a', 'f2071b47-43d6-451d-9fff-d2616c3d22fd', 'service', 'ce7802e4-46e6-4c04-a355-449c788e4b97', 1, 250, 750)
ON CONFLICT DO NOTHING;