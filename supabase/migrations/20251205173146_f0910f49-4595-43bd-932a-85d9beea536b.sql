-- Add user_id column to uploaded_images table
ALTER TABLE public.uploaded_images 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public insert" ON public.uploaded_images;
DROP POLICY IF EXISTS "Allow public select" ON public.uploaded_images;

-- Create secure RLS policies - users can only see their own images
CREATE POLICY "Users can view their own images"
ON public.uploaded_images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own images
CREATE POLICY "Users can insert their own images"
ON public.uploaded_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON public.uploaded_images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update storage policies for user-uploads bucket
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only authenticated users can view their own images
CREATE POLICY "Users can view their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);