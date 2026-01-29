-- Function to link team memberships when a user signs up
CREATE OR REPLACE FUNCTION public.link_team_memberships_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Link existing memberships by email
  UPDATE public.client_team_members
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;
  
  -- Assign 'client' role if user has memberships
  IF EXISTS (SELECT 1 FROM public.client_team_members WHERE user_id = NEW.id AND accepted_at IS NOT NULL) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created_link_memberships
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_team_memberships_on_signup();

-- Helper function to check membership by email (for RLS)
CREATE OR REPLACE FUNCTION public.user_has_team_membership(p_user_id uuid, p_user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_team_members
    WHERE (user_id = p_user_id OR LOWER(email) = LOWER(p_user_email))
      AND accepted_at IS NOT NULL
  )
$$;

-- Add RLS policy to allow users to view their memberships by email
CREATE POLICY "Users can view memberships by email"
ON public.client_team_members
FOR SELECT
USING (LOWER(email) = LOWER(auth.email()));