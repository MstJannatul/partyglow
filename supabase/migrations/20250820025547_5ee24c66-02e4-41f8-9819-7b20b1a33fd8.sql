-- Update the handle_new_user function to store phone numbers for vendor accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Add a small delay to ensure auth.users record is committed
  -- and insert the profile with explicit error handling
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    vendor_type,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
    NEW.raw_user_meta_data->>'vendor_type',
    -- Only store phone for vendor accounts
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role) = 'vendor' 
      THEN NEW.raw_user_meta_data->>'phone'
      ELSE NULL 
    END
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;