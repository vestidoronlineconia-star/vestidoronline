

# Plan: Permitir que cualquier usuario autenticado vea las tiendas

## Problema

La vista `embed_clients_public` tiene `security_invoker=true`, lo que significa que cuando un usuario consulta la vista, se aplican las politicas RLS de la tabla `embed_clients` con los permisos de ese usuario. Como las politicas de `embed_clients` solo permiten ver datos al propietario o miembros del equipo, cualquier otro usuario autenticado ve "Tienda no encontrada".

## Solucion

Recrear la vista `embed_clients_public` sin `security_invoker`, para que se ejecute con los permisos del creador (que puede leer toda la tabla). Esto permite que cualquier usuario autenticado acceda a los datos publicos de las tiendas activas, sin exponer campos sensibles como `api_key` o `user_id`.

## Cambios

### Migracion SQL

Ejecutar una migracion que:

1. Elimine la vista actual `embed_clients_public`
2. La recree sin `security_invoker=true` (usa `security_invoker=false`)
3. Otorgue permisos de SELECT a los roles `anon` y `authenticated`

```sql
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
```

### Seguridad

La vista sigue excluyendo los campos sensibles: `api_key`, `user_id`, `allowed_domains`, `monthly_limit`, `current_month_usage`. Solo se exponen datos de configuracion visual y publica.

### Archivos de codigo

No se necesitan cambios en el codigo frontend. El hook `useClientBySlug` ya consulta `embed_clients_public`, asi que una vez corregida la vista, funcionara automaticamente para todos los usuarios.

