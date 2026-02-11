
INSERT INTO storage.buckets (id, name, public) VALUES ('tryon-results', 'tryon-results', false);

CREATE POLICY "Users upload own tryon images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tryon-results' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own tryon images" ON storage.objects FOR SELECT
USING (bucket_id = 'tryon-results' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own tryon images" ON storage.objects FOR DELETE
USING (bucket_id = 'tryon-results' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE tryon_history ADD COLUMN user_email text;
