-- Corregir política de embed_usage para ser más restrictiva
-- Permitir inserción solo si el client_id corresponde a un cliente activo
DROP POLICY IF EXISTS "Anyone can insert usage records" ON public.embed_usage;

CREATE POLICY "Insert usage for active clients only"
ON public.embed_usage FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE id = client_id AND is_active = true
  )
);