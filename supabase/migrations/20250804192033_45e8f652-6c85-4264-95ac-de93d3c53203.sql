-- Drop existing vendor_availability table if it exists and create the correct one
DROP TABLE IF EXISTS public.vendor_availability CASCADE;

-- Create the correct vendor_availability table
CREATE TABLE public.vendor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor availability
CREATE POLICY "Anyone can view vendor availability" 
ON public.vendor_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Vendors can manage their own availability" 
ON public.vendor_availability 
FOR ALL 
USING (auth.uid() = vendor_id);

-- Create updated timestamp trigger
CREATE TRIGGER update_vendor_availability_updated_at
BEFORE UPDATE ON public.vendor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample availability for existing vendors to test
INSERT INTO public.vendor_availability (vendor_id, day_of_week, start_time, end_time)
SELECT 
  p.user_id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00'::TIME as start_time,
  '17:00'::TIME as end_time
FROM profiles p 
WHERE p.role = 'vendor'
ON CONFLICT DO NOTHING;