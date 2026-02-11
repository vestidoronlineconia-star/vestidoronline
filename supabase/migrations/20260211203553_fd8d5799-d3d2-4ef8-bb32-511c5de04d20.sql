DROP VIEW IF EXISTS public.embed_clients_public;

CREATE VIEW public.embed_clients_public
WITH (security_invoker=false) AS
  SELECT id, name, slug, primary_color, secondary_color,
         background_color, text_color, logo_url, custom_title,
         cta_text, enabled_categories, show_size_selector,
         show_fit_result, is_active, theme_mode,
         placeholder_garment, placeholder_photo,
         error_message, button_style, entry_animation
  FROM embed_clients
  WHERE is_active = true;

GRANT SELECT ON public.embed_clients_public TO anon, authenticated;