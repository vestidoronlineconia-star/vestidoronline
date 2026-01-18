-- Create size_guides table for store-specific size configurations
CREATE TABLE public.size_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.embed_clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  size_system TEXT NOT NULL DEFAULT 'letter' CHECK (size_system IN ('letter', 'numeric', 'cm')),
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, category)
);

-- Enable Row Level Security
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view size guides of their embed clients"
ON public.size_guides
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.embed_clients
  WHERE embed_clients.id = size_guides.client_id
  AND embed_clients.user_id = auth.uid()
));

CREATE POLICY "Users can create size guides for their embed clients"
ON public.size_guides
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.embed_clients
  WHERE embed_clients.id = size_guides.client_id
  AND embed_clients.user_id = auth.uid()
));

CREATE POLICY "Users can update size guides of their embed clients"
ON public.size_guides
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.embed_clients
  WHERE embed_clients.id = size_guides.client_id
  AND embed_clients.user_id = auth.uid()
));

CREATE POLICY "Users can delete size guides of their embed clients"
ON public.size_guides
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.embed_clients
  WHERE embed_clients.id = size_guides.client_id
  AND embed_clients.user_id = auth.uid()
));

-- Public read access for active embed clients (needed for the embed widget)
CREATE POLICY "Anyone can read size guides of active embed clients"
ON public.size_guides
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.embed_clients
  WHERE embed_clients.id = size_guides.client_id
  AND embed_clients.is_active = true
));

-- Add trigger for updated_at
CREATE TRIGGER update_size_guides_updated_at
BEFORE UPDATE ON public.size_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();