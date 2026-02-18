
-- 2a: Auto-aceptar miembros al ser invitados
ALTER TABLE public.client_team_members
  ALTER COLUMN accepted_at SET DEFAULT now();

-- 2b: Funcion para vincular user_id al invitar (si el usuario ya existe)
CREATE OR REPLACE FUNCTION public.link_user_id_on_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT id INTO NEW.user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_user_id_on_invite
  BEFORE INSERT ON public.client_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.link_user_id_on_invite();

-- 2d: Permitir UPDATE a admins del equipo
CREATE POLICY "Team admins can update assigned clients"
  ON public.embed_clients
  FOR UPDATE
  USING (
    user_has_client_permission(id, auth.uid(), 'admin'::team_role)
  )
  WITH CHECK (
    user_has_client_permission(id, auth.uid(), 'admin'::team_role)
  );

-- Fix existing members: set accepted_at where NULL
UPDATE public.client_team_members
SET accepted_at = now()
WHERE accepted_at IS NULL;
