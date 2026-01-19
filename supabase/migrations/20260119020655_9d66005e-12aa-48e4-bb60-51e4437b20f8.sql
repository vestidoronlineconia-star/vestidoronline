-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Team managers can manage members" ON public.client_team_members;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their memberships" ON public.client_team_members;

-- Create new policies without recursion

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
ON public.client_team_members FOR SELECT
USING (user_id = auth.uid());

-- Owners can view all members of their clients (uses embed_clients, not self-referencing)
CREATE POLICY "Owners can view client members"
ON public.client_team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_team_members.client_id 
    AND embed_clients.user_id = auth.uid()
  )
);

-- Owners can insert team members to their clients
CREATE POLICY "Owners can insert team members"
ON public.client_team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_team_members.client_id 
    AND embed_clients.user_id = auth.uid()
  )
);

-- Owners can update team members of their clients
CREATE POLICY "Owners can update team members"
ON public.client_team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_team_members.client_id 
    AND embed_clients.user_id = auth.uid()
  )
);

-- Owners can delete team members from their clients
CREATE POLICY "Owners can delete team members"
ON public.client_team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_team_members.client_id 
    AND embed_clients.user_id = auth.uid()
  )
);