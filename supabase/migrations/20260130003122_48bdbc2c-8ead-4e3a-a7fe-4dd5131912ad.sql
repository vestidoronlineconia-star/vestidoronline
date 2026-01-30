-- First, drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Team members can view their assigned clients" ON embed_clients;

-- Create a SECURITY DEFINER function to check team membership without recursion
CREATE OR REPLACE FUNCTION public.user_is_team_member_of_client(p_client_id uuid, p_user_id uuid, p_user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_team_members
    WHERE client_id = p_client_id
      AND (user_id = p_user_id OR LOWER(email) = LOWER(p_user_email))
      AND accepted_at IS NOT NULL
  )
$$;

-- Now create the policy using the SECURITY DEFINER function
CREATE POLICY "Team members can view their assigned clients"
ON embed_clients FOR SELECT
TO authenticated
USING (
  public.user_is_team_member_of_client(id, auth.uid(), auth.email())
);