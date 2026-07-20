-- CRITICAL PRIVACY & SECURITY FIX (CORRECTED)
-- Drop the dangerous policy that allows all users to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policies for profile access
-- 1. Users can only view their own full profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can view basic public vendor info (for listings/bookings only)
CREATE POLICY "Users can view basic vendor info for active listings" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'vendor' 
  AND is_verified = true 
  AND EXISTS (
    SELECT 1 FROM listings 
    WHERE listings.user_id = profiles.user_id 
    AND listings.is_active = true
  )
);

-- 3. Create a secure public vendor profiles view with only safe data
CREATE OR REPLACE VIEW public.public_vendor_profiles AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.business_name,
  p.business_description,
  p.is_verified,
  p.role,
  p.vendor_type,
  p.specialties,
  p.years_experience,
  p.service_area,
  p.created_at,
  -- Calculate average rating and review count safely
  COALESCE(r.avg_rating, 0) as average_rating,
  COALESCE(r.review_count, 0) as review_count
FROM public.profiles p
LEFT JOIN (
  SELECT 
    reviewed_user_id,
    AVG(rating)::numeric(3,2) as avg_rating,
    COUNT(*)::bigint as review_count
  FROM reviews 
  GROUP BY reviewed_user_id
) r ON r.reviewed_user_id = p.user_id
WHERE 
  p.role = 'vendor' 
  AND p.is_verified = true
  AND EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.user_id = p.user_id 
    AND l.is_active = true
  );

-- Enable RLS on the view
ALTER VIEW public.public_vendor_profiles SET (security_invoker = true);

-- Create audit logging table for profile access
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_profile_id uuid NOT NULL,
  accessed_by uuid REFERENCES auth.users(id),
  access_type text NOT NULL, -- 'own_profile', 'vendor_public', 'admin_access'
  accessed_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs (requires get_user_role function)
CREATE POLICY "Admin can view all profile access logs" 
ON public.profile_access_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Users can view logs of access to their own profile
CREATE POLICY "Users can view access logs to their profile" 
ON public.profile_access_logs 
FOR SELECT 
USING (accessed_profile_id = auth.uid());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.profile_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_profile_id uuid,
  p_access_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO profile_access_logs (
    accessed_profile_id,
    accessed_by,
    access_type,
    accessed_at
  ) VALUES (
    p_profile_id,
    auth.uid(),
    p_access_type,
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if logging fails
    NULL;
END;
$$;