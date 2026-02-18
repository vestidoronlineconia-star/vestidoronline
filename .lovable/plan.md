

# Plan: Corregir envio de emails de invitacion y acceso de admin/editor a configuracion

## Problemas identificados

### Problema 1: Emails no se envian
El dominio `santiagociraudo.tech` no esta verificado en Resend. El log muestra:
```
statusCode: 403, message: "The santiagociraudo.tech domain is not verified"
```
**Solucion**: Esto requiere una accion manual tuya en el dashboard de Resend (https://resend.com/domains). Debes verificar el dominio agregando los registros DNS que Resend te indica. Mientras tanto, podemos cambiar temporalmente el remitente a `onboarding@resend.dev` (el remitente de prueba gratuito de Resend) para que los emails se envien.

### Problema 2: Admin/editor no puede entrar a configuracion del cliente
Hay 3 sub-problemas:

**2a. `accepted_at` es NULL para miembros invitados**
Cuando se invita un miembro, `accepted_at` queda en NULL. El sistema requiere `accepted_at IS NOT NULL` para otorgar permisos. No existe un flujo de aceptacion, asi que los miembros invitados nunca obtienen acceso.
- **Solucion**: Establecer `accepted_at = now()` automaticamente al insertar el miembro (via DEFAULT en la columna o al momento del INSERT en el codigo).

**2b. `user_id` es NULL para miembros invitados**
Cuando se invita por email, el `user_id` no se vincula hasta que el usuario se registra (hay un trigger `link_team_memberships_on_signup`). Pero si el usuario YA tiene cuenta, el `user_id` no se vincula.
- **Solucion**: Al invitar, buscar si ya existe un usuario con ese email en `auth.users` y vincular automaticamente el `user_id`. Crear una funcion de base de datos `SECURITY DEFINER` para esto.

**2c. La pagina de Settings filtra por `user_id`**
En `ClientPortalSettings.tsx` linea 122, la consulta usa `.eq('user_id', user.id)`, lo que bloquea a cualquier miembro del equipo que no sea el propietario.
- **Solucion**: Quitar ese filtro y confiar en las politicas RLS existentes (que ya permiten SELECT a miembros del equipo).

**2d. No hay politica RLS de UPDATE para miembros del equipo**
La tabla `embed_clients` solo tiene politica UPDATE para el owner. Admins y editors no pueden guardar cambios.
- **Solucion**: Agregar politica RLS de UPDATE que use la funcion `user_has_client_permission` existente.

## Cambios a realizar

### 1. Migracion SQL

```sql
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
  -- Try to find existing user by email
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

-- Fix existing members: set accepted_at and link user_id
UPDATE public.client_team_members
SET accepted_at = now()
WHERE accepted_at IS NULL;
```

### 2. Actualizar ClientPortalSettings.tsx (linea 118-123)

Cambiar la consulta de carga del cliente para no filtrar por `user_id`:

```text
Antes:
  .eq('id', clientId)
  .eq('user_id', user.id)

Despues:
  .eq('id', clientId)
```

Las politicas RLS ya garantizan que solo el propietario y miembros del equipo puedan ver el cliente.

### 3. Actualizar edge function send-team-invitation (remitente temporal)

Cambiar el `from` de `"Vestidor Online <noreply@santiagociraudo.tech>"` a `"Vestidor Online <onboarding@resend.dev>"` para que los emails funcionen mientras se verifica el dominio.

**Nota importante**: Con `onboarding@resend.dev` solo se pueden enviar emails a la cuenta asociada a tu API key de Resend. Para enviar a cualquier destinatario, debes verificar tu dominio en Resend.

### 4. Actualizar ClientPortalProducts.tsx (linea 40-44)

La consulta de `api_key` tambien necesita quitar el filtro implicito de RLS (ya esta bien porque no filtra por user_id), pero la RLS actual no permite SELECT a team members. Esto ya esta cubierto por la politica existente "Team members can view their assigned clients".

## Flujo resultante

```text
1. Owner invita a admin@empresa.com como "admin"
2. Se crea el registro con accepted_at = now() y user_id vinculado automaticamente
3. Se envia email de invitacion (desde onboarding@resend.dev temporalmente)
4. Admin inicia sesion y ve el cliente en su portal
5. Admin puede entrar a Configurar, editar branding, productos, etc.
6. Admin NO puede eliminar el cliente (reservado al owner)
```

## Resumen de cambios

| Componente | Cambio |
|-----------|--------|
| Migracion SQL | Default `accepted_at = now()`, trigger para vincular `user_id`, politica UPDATE para admins, fix datos existentes |
| `src/pages/ClientPortalSettings.tsx` | Quitar `.eq('user_id', user.id)` en linea 122 |
| `supabase/functions/send-team-invitation/index.ts` | Cambiar remitente a `onboarding@resend.dev` |

