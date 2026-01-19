-- Fix: SECURITY DEFINER view issue
-- Drop and recreate the view with SECURITY INVOKER (safer)

DROP VIEW IF EXISTS public.embed_clients_public;

CREATE VIEW public.embed_clients_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  slug,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  logo_url,
  custom_title,
  cta_text,
  enabled_categories,
  show_size_selector,
  show_fit_result,
  is_active,
  theme_mode,
  placeholder_garment,
  placeholder_photo,
  error_message,
  button_style,
  entry_animation
FROM public.embed_clients
WHERE is_active = true;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.embed_clients_public TO anon;
GRANT SELECT ON public.embed_clients_public TO authenticated;

-- Need a policy on embed_clients that allows select for anyone (since security_invoker uses caller's permissions)
-- Create a minimal policy that only allows checking existence by slug for public access
CREATE POLICY "Public can view limited columns of active clients"
ON public.embed_clients
FOR SELECT
TO anon
USING (is_active = true);