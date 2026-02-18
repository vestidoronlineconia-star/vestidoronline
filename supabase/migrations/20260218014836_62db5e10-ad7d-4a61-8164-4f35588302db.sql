CREATE POLICY "Team admins can manage team members"
  ON public.client_team_members
  FOR ALL
  USING (
    user_has_client_permission(client_id, auth.uid(), 'admin'::team_role)
  )
  WITH CHECK (
    user_has_client_permission(client_id, auth.uid(), 'admin'::team_role)
  );