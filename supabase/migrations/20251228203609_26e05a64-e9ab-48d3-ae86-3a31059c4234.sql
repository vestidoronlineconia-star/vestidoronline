-- Create embed_clients table for storing client configurations
CREATE TABLE public.embed_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  
  -- Allowed domains
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  
  -- Branding
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#A78BFA',
  background_color TEXT DEFAULT '#0A0A0F',
  text_color TEXT DEFAULT '#FFFFFF',
  logo_url TEXT,
  custom_title TEXT DEFAULT 'Virtual Try-On',
  cta_text TEXT DEFAULT 'Probar prenda',
  
  -- Features
  enabled_categories TEXT[] DEFAULT ARRAY['buzo', 'remera', 'camisa', 'vestido', 'falda', 'pantalon', 'zapatos'],
  show_size_selector BOOLEAN DEFAULT true,
  show_fit_result BOOLEAN DEFAULT true,
  
  -- Status and limits
  is_active BOOLEAN DEFAULT true,
  monthly_limit INTEGER DEFAULT 1000,
  current_month_usage INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create embed_usage table for tracking usage
CREATE TABLE public.embed_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.embed_clients(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  referer_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.embed_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embed_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for embed_clients
CREATE POLICY "Users can view their own embed clients"
ON public.embed_clients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own embed clients"
ON public.embed_clients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embed clients"
ON public.embed_clients
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embed clients"
ON public.embed_clients
FOR DELETE
USING (auth.uid() = user_id);

-- Public read policy for embed validation (by slug or api_key)
CREATE POLICY "Anyone can read active embed clients by slug"
ON public.embed_clients
FOR SELECT
USING (is_active = true);

-- RLS Policies for embed_usage
CREATE POLICY "Users can view usage of their embed clients"
ON public.embed_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.embed_clients
    WHERE embed_clients.id = embed_usage.client_id
    AND embed_clients.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert usage records"
ON public.embed_usage
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_embed_clients_updated_at
BEFORE UPDATE ON public.embed_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_embed_clients_slug ON public.embed_clients(slug);
CREATE INDEX idx_embed_clients_api_key ON public.embed_clients(api_key);
CREATE INDEX idx_embed_usage_client_id ON public.embed_usage(client_id);
CREATE INDEX idx_embed_usage_created_at ON public.embed_usage(created_at);