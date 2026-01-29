
## Plan: Autorización de Emails desde Base de Datos

### Objetivo
Permitirte agregar emails directamente en la base de datos (`client_team_members`) para autorizar acceso a clientes específicos, sin que el usuario tenga que solicitar acceso.

---

### Problema Actual

El código actual tiene **dos limitaciones**:

1. **Búsqueda solo por `user_id`**: La query busca membresías donde `user_id = auth.uid()`, pero cuando agregas un email desde la DB, el `user_id` es `null` (el usuario aún no existe)

2. **Requiere `accepted_at` no nulo**: La query filtra con `.not('accepted_at', 'is', null)`, pero las invitaciones nuevas tienen `accepted_at = null`

```typescript
// Código actual problemático
.eq('user_id', user.id)           // ❌ Falla si user_id es null
.not('accepted_at', 'is', null);  // ❌ Falla si accepted_at es null
```

---

### Solución

| Archivo | Cambio |
|---------|--------|
| `src/pages/ClientPortal.tsx` | Buscar también por **email** cuando `user_id` es null |
| `src/hooks/useUserRole.tsx` | Asignar automáticamente rol `client` cuando tiene membresías |
| Nueva migración SQL | Crear trigger para vincular `user_id` cuando el usuario se registra |

---

### Flujo Propuesto

```text
1. ADMIN agrega registro en DB
   ┌─────────────────────────────────────────────────┐
   │ INSERT INTO client_team_members                 │
   │ (client_id, email, role, accepted_at)           │
   │ VALUES ('uuid-cliente', 'user@email.com',       │
   │         'editor', NOW())                        │
   └─────────────────────────────────────────────────┘
                        │
                        ▼
2. Usuario se REGISTRA con ese email
   ┌─────────────────────────────────────────────────┐
   │ Trigger automático:                             │
   │ UPDATE client_team_members                      │
   │ SET user_id = NEW.id                            │
   │ WHERE email = NEW.email AND user_id IS NULL     │
   └─────────────────────────────────────────────────┘
                        │
                        ▼
3. Usuario ENTRA al portal
   ┌─────────────────────────────────────────────────┐
   │ ClientPortal busca:                             │
   │ - Por user_id (dueño o miembro)                 │
   │ - Por email si user_id aún no está vinculado    │
   └─────────────────────────────────────────────────┘
                        │
                        ▼
4. Usuario VE el cliente asignado
```

---

### Cambios Técnicos

#### 1. Trigger para Vincular user_id al Registrarse

```sql
-- Cuando un usuario se registra, vincular membresías pendientes
CREATE OR REPLACE FUNCTION link_team_memberships_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Vincular membresías existentes por email
  UPDATE public.client_team_members
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  
  -- Asignar rol 'client' si tiene membresías
  IF EXISTS (SELECT 1 FROM public.client_team_members WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_link_memberships
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_team_memberships_on_signup();
```

#### 2. Modificar ClientPortal.tsx

```typescript
const loadClients = async () => {
  // 1. Clientes donde es dueño (sin cambios)
  const { data: ownClients } = await supabase
    .from('embed_clients')
    .select('*')
    .eq('user_id', user.id);

  // 2. Clientes donde es miembro (por user_id O email)
  const { data: teamMemberships } = await supabase
    .from('client_team_members')
    .select('client_id, role, embed_clients (*)')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .not('accepted_at', 'is', null);  // Solo si ya está aceptado

  // ... resto igual
};
```

#### 3. Modificar useUserRole.tsx

```typescript
const fetchRoles = async () => {
  // Roles explícitos
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  // Si tiene membresías, también es cliente
  const { data: memberships } = await supabase
    .from('client_team_members')
    .select('id')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .not('accepted_at', 'is', null)
    .limit(1);

  let userRoles = (rolesData || []).map(r => r.role);
  
  if (memberships?.length && !userRoles.includes('client')) {
    userRoles.push('client');
  }
  
  setRoles(userRoles);
};
```

---

### Cómo Autorizar desde la Base de Datos

Una vez implementado, podrás autorizar usuarios así:

```sql
-- Autorizar email a un cliente específico
INSERT INTO client_team_members (client_id, email, role, accepted_at)
VALUES (
  'uuid-del-cliente',      -- ID del cliente
  'usuario@email.com',     -- Email a autorizar
  'editor',                -- Rol: owner/admin/editor/viewer
  NOW()                    -- accepted_at = NOW() para acceso inmediato
);
```

Si quieres que el usuario aún deba "aceptar", deja `accepted_at` como `NULL` y el email de invitación lo guiará.

---

### Resumen

| Paso | Descripción |
|------|-------------|
| 1 | Crear trigger en `auth.users` para vincular membresías por email |
| 2 | Modificar `ClientPortal.tsx` para buscar por email además de user_id |
| 3 | Modificar `useUserRole.tsx` para detectar rol `client` por membresías |
| 4 | Actualizar RLS policies para permitir acceso por email |

Esto te permitirá autorizar cualquier email a cualquier cliente directamente desde la base de datos.
