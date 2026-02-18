CREATE POLICY "Team editors can manage client products"
  ON public.client_products
  FOR ALL
  USING (
    user_has_client_permission(client_id, auth.uid(), 'editor'::team_role)
  )
  WITH CHECK (
    user_has_client_permission(client_id, auth.uid(), 'editor'::team_role)
  );