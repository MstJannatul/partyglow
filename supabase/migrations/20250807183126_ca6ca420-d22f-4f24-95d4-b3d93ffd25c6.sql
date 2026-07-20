-- Fix security warnings: Set search_path for the function

ALTER FUNCTION get_optimized_listings(uuid, text, numeric, numeric, text, integer, integer) 
SET search_path = 'public';