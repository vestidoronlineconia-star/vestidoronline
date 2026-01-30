
# Plan: Control de Acceso para Miembros de Equipo

## Resumen del Problema

Se detectaron **dos problemas principales**:

1. **El cliente "moonlight" no aparece** para el usuario invitado (`santy2380.ss@gmail.com`) debido a políticas RLS mal configuradas
2. **Puede crear nuevos clientes** cuando solo debería poder configurar el que le asignaste

---

## Análisis Técnico

### Problema 1: RLS de `embed_clients` bloquea a miembros de equipo

Las políticas actuales de SELECT en `embed_clients` son:

```text
Policy 1: "Users can view their own embed clients"
  RESTRICTIVE - USING: auth.uid() = user_id

Policy 2: "Public can view limited columns of active clients"  
  RESTRICTIVE - USING: is_active = true
```

**El problema**: Ambas son `RESTRICTIVE` (Permissive: No). Cuando múltiples políticas RESTRICTIVE existen, **TODAS** deben cumplirse. Para ver un cliente:
- Debe ser el propietario (`user_id = auth.uid()`) **Y**
- El cliente debe estar activo (`is_active = true`)

Un miembro de equipo **no** es el propietario, por lo que la primera condición falla y no puede ver nada.

### Problema 2: Lógica de permisos permite crear clientes

En `useUserRole.tsx` línea 75:
```typescript
const canCreateClients = isAdmin || isClient;
```

Cualquier usuario con rol `client` (incluyendo miembros de equipo) puede crear clientes nuevos. Esto no es lo que deseas.

---

## Solución Propuesta

### Paso 1: Corregir política RLS de `embed_clients`

Agregar una nueva política PERMISSIVE que permita a los miembros de equipo ver los clientes a los que pertenecen:

```sql
CREATE POLICY "Team members can view their assigned clients"
ON embed_clients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_team_members
    WHERE client_team_members.client_id = embed_clients.id
      AND (
        client_team_members.user_id = auth.uid() 
        OR LOWER(client_team_members.email) = LOWER(auth.email())
      )
      AND client_team_members.accepted_at IS NOT NULL
  )
);
```

### Paso 2: Diferenciar entre propietarios y miembros de equipo

Modificar `useUserRole.tsx` para distinguir entre:
- **`isOwner`**: Tiene clientes propios (puede crear más)
- **`isTeamMember`**: Solo tiene membresías en clientes de otros (no puede crear)

```typescript
// Nuevo estado del hook
interface UserRoleState {
  // ... existentes
  isClientOwner: boolean;  // Tiene clientes propios
  isTeamMember: boolean;   // Solo es miembro de equipo
  canCreateClients: boolean; // isAdmin || isClientOwner
}
```

### Paso 3: Ocultar botón "Nuevo Cliente" para miembros de equipo

En `ClientPortal.tsx`, mostrar el botón solo si `canCreateClients` es true (solo admins y propietarios de clientes).

### Paso 4: Reforzar permisos en base de datos

La política de INSERT actual ya restringe correctamente:
```sql
-- Solo admins y clients pueden crear
WITH CHECK: auth.uid() = user_id AND (has_role('admin') OR has_role('client'))
```

Pero un miembro de equipo tiene rol `client` implícito. Debemos verificar si tiene clientes **propios** antes de permitir crear.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| **Base de datos** | Nueva política RLS para `embed_clients` que permita acceso a team members |
| `src/hooks/useUserRole.tsx` | Agregar `isClientOwner`, `isTeamMember`, refinar `canCreateClients` |
| `src/pages/ClientPortal.tsx` | Condicionar botón "Nuevo Cliente" a `canCreateClients` correctamente |

---

## Flujo de Permisos Resultante

```text
+-------------------+------------------+------------------+
| Tipo de Usuario   | Ver Clientes     | Crear Clientes   |
+-------------------+------------------+------------------+
| Admin             | Todos            | Si               |
| Propietario       | Sus propios      | Si               |
| Miembro de Equipo | Solo asignados   | No               |
| Usuario normal    | Ninguno          | No               |
+-------------------+------------------+------------------+
```

---

## Viabilidad y Beneficios

**Es totalmente viable** implementar este control. Beneficios:

- Mantienes control total sobre qué clientes existen
- Los miembros de equipo solo ven y pueden configurar lo que les asignes
- Separación clara entre propietarios y colaboradores
- Sin cambios a la estructura de base de datos existente (solo políticas RLS)
