-- Create storage bucket for listing media
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-media', 'listing-media', true);

-- Create storage policies for listing media
CREATE POLICY "Anyone can view listing media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'listing-media');

CREATE POLICY "Authenticated users can upload listing media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'listing-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listing media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own listing media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]);