-- Create RLS policies for review-media storage bucket
-- Allow authenticated users to upload review photos

-- Policy for inserting files (uploading)
CREATE POLICY "Authenticated users can upload review photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'review-media');

-- Policy for selecting files (viewing)
CREATE POLICY "Anyone can view review photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'review-media');

-- Policy for updating file metadata
CREATE POLICY "Users can update their own review photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for deleting files
CREATE POLICY "Users can delete their own review photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);