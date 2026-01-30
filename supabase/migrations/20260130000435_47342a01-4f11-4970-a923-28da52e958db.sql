-- Add PERMISSIVE policy for team members to view assigned clients
CREATE POLICY "Team members can view their assigned clients"
ON public.embed_clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_team_members
    WHERE client_team_members.client_id = embed_clients.id
      AND (
        client_team_members.user_id = auth.uid() 
        OR LOWER(client_team_members.email) = LOWER(auth.email())
      )
      AND client_team_members.accepted_at IS NOT NULL
  )
);