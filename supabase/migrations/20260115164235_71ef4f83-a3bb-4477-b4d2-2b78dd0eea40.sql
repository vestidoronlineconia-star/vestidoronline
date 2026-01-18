-- Insertar rol admin para el usuario propietario
INSERT INTO public.user_roles (user_id, role)
VALUES ('92595e9a-f4b2-4b1d-9c3e-107c911bda15', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;