-- Drop old triggers that reference dropped tables
DROP TRIGGER IF EXISTS booking_availability_validation ON bookings;
DROP TRIGGER IF EXISTS validate_booking_before_insert_blocks ON bookings;
DROP TRIGGER IF EXISTS handle_booking_confirmation_flexible ON bookings;

-- Drop old validation functions that reference dropped tables
DROP FUNCTION IF EXISTS validate_booking_availability();
DROP FUNCTION IF EXISTS validate_booking_before_insert();
DROP FUNCTION IF EXISTS validate_booking_before_insert_blocks();
DROP FUNCTION IF EXISTS handle_booking_confirmation_flexible();

-- Verify our new simplified trigger and function still exist
-- (This is just a check - they should already be there from the previous migration)
-- The validate_booking_availability_trigger should be the only trigger left
-- The validate_simple_booking and simple_booking_availability functions should be the only ones left