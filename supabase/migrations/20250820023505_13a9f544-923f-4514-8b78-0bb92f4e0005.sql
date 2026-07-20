-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.get_safe_vendor_profile(vendor_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  business_name text,
  bio text,
  location text,
  is_verified boolean,
  average_rating numeric,
  total_reviews integer,
  avatar_url text,
  created_at timestamp with time zone,
  vendor_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.business_name,
    p.bio,
    p.location,
    p.is_verified,
    COALESCE((
      SELECT AVG(r.rating)::numeric 
      FROM reviews r 
      WHERE r.reviewed_user_id = p.user_id
    ), 0) as average_rating,
    COALESCE((
      SELECT COUNT(r.id)::integer 
      FROM reviews r 
      WHERE r.reviewed_user_id = p.user_id
    ), 0) as total_reviews,
    p.avatar_url,
    p.created_at,
    p.vendor_type
  FROM profiles p
  WHERE p.user_id = vendor_user_id 
    AND p.role = 'vendor' 
    AND p.is_verified = true;
END;
$$;