-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true);

-- Storage policies for public access
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-uploads');

-- Create table for image metadata
CREATE TABLE public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('user', 'garment')),
  original_size_kb INTEGER,
  compressed_size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

-- Public policies (no auth required)
CREATE POLICY "Allow public insert" ON public.uploaded_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.uploaded_images FOR SELECT USING (true);