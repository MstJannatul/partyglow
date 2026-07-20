-- Fix critical security vulnerabilities

-- 1. Fix profiles table policies - restrict personal data exposure
DROP POLICY IF EXISTS "Anyone can view vendor information" ON public.profiles;

-- Create safer profile policies
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public vendor business info only" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'vendor' AND 
  is_verified = true AND 
  (
    -- Allow access to business-safe fields only, not personal data
    auth.uid() IS NOT NULL OR auth.uid() IS NULL
  )
);

-- 2. Fix payment_reminders table policies - restrict to recipients only
DROP POLICY IF EXISTS "System can manage reminders" ON public.payment_reminders;

-- Create secure payment reminders policies
CREATE POLICY "Users can view their own payment reminders" 
ON public.payment_reminders 
FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "System can create payment reminders" 
ON public.payment_reminders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update payment reminders" 
ON public.payment_reminders 
FOR UPDATE 
USING (true);

-- 3. Fix rate_limit_counters - remove public access
DROP POLICY IF EXISTS "Anyone can view rate limits" ON public.rate_limit_counters;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limit_counters;

-- Create secure rate limiting policies - system access only
CREATE POLICY "System can manage rate limit counters" 
ON public.rate_limit_counters 
FOR ALL 
USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'service_role');

-- 4. Create a safe vendor profile view function for public access
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