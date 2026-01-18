-- ============================================
-- FASE 4: HISTORIAL DE TRY-ONS
-- ============================================

-- Create table for try-on history
CREATE TABLE public.tryon_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_image_url text,
  garment_image_url text,
  generated_image_url text NOT NULL,
  view360_image_url text,
  category text NOT NULL,
  user_size text,
  garment_size text,
  fit_result text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tryon_history ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see and manage their own history
CREATE POLICY "Users can view their own try-on history"
ON public.tryon_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own try-on history"
ON public.tryon_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own try-on history"
ON public.tryon_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_tryon_history_user_id ON public.tryon_history(user_id);
CREATE INDEX idx_tryon_history_created_at ON public.tryon_history(created_at DESC);