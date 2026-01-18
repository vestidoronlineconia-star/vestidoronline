-- ============================================
-- FASE 1: SISTEMA DE SEGURIDAD Y ROLES
-- ============================================

-- 1. Crear enum para roles de aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'user');

-- 2. Crear tabla de roles de usuario
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Función security definer para verificar roles (evita recursión infinita)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Corregir política permisiva de embed_clients (restringir creación)
DROP POLICY IF EXISTS "Users can create their own embed clients" ON public.embed_clients;

CREATE POLICY "Admins and clients can create embed clients"
ON public.embed_clients FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'client')
  )
);

-- 7. Corregir política permisiva de tenants (eliminar USING true)
DROP POLICY IF EXISTS "Authenticated users can manage tenants" ON public.tenants;

CREATE POLICY "Only admins can manage tenants"
ON public.tenants FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));