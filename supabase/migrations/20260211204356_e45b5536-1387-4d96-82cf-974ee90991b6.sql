
-- Function to check if a client is active (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_client_active(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.embed_clients
    WHERE id = p_client_id AND is_active = true
  );
$$;

-- Replace client_products SELECT policy
DROP POLICY IF EXISTS "Anyone can read active products of active clients"
  ON public.client_products;

CREATE POLICY "Authenticated users can read active products of active clients"
  ON public.client_products
  FOR SELECT
  USING (
    is_active = true
    AND is_client_active(client_id)
  );

-- Replace embed_usage INSERT policy
DROP POLICY IF EXISTS "Insert usage for active clients only"
  ON public.embed_usage;

CREATE POLICY "Insert usage for active clients only"
  ON public.embed_usage
  FOR INSERT
  WITH CHECK (is_client_active(client_id));
