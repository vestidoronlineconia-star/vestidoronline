-- Fix: Create a public view for embed_clients that excludes sensitive data
-- This prevents api_key and user_id from being exposed publicly

-- Create a view with only public-safe columns
CREATE OR REPLACE VIEW public.embed_clients_public AS
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
  -- EXCLUDED: api_key, user_id, allowed_domains, monthly_limit, current_month_usage
FROM public.embed_clients
WHERE is_active = true;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.embed_clients_public TO anon;
GRANT SELECT ON public.embed_clients_public TO authenticated;

-- Drop the overly permissive public SELECT policy on embed_clients
DROP POLICY IF EXISTS "Anyone can read active embed clients by slug" ON public.embed_clients;

-- The remaining policies for embed_clients are:
-- - "Users can view their own embed clients" (SELECT where auth.uid() = user_id)
-- - "Users can update their own embed clients" (UPDATE where auth.uid() = user_id)
-- - "Users can delete their own embed clients" (DELETE where auth.uid() = user_id)
-- - "Admins and clients can create embed clients" (INSERT)
-- These are all properly restricted.