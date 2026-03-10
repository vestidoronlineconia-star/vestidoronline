
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view user photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'user-photos');
