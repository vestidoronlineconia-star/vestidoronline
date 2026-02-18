

# Plan: Permitir a admins gestionar miembros del equipo

## Problema

Las politicas RLS de la tabla `client_team_members` solo permiten al propietario (owner) insertar, actualizar y eliminar miembros. Los usuarios con rol `admin` no tienen permisos para invitar, modificar roles ni eliminar miembros del equipo.

## Solucion

Agregar una politica RLS que permita a los admins gestionar miembros del equipo, usando la funcion existente `user_has_client_permission`.

### Migracion SQL

```sql
CREATE POLICY "Team admins can manage team members"
  ON public.client_team_members
  FOR ALL
  USING (
    user_has_client_permission(client_id, auth.uid(), 'admin'::team_role)
  )
  WITH CHECK (
    user_has_client_permission(client_id, auth.uid(), 'admin'::team_role)
  );
```

Esta unica politica cubre INSERT, UPDATE y DELETE para usuarios con rol admin o superior (owner), ya que `user_has_client_permission` respeta la jerarquia de roles.

### Sin cambios en frontend

El codigo del `TeamManager` y `InviteMemberModal` ya esta preparado. El bloqueo es exclusivamente a nivel de base de datos.

## Resumen

| Componente | Cambio |
|-----------|--------|
| Migracion SQL | Nueva politica RLS `FOR ALL` en `client_team_members` usando `user_has_client_permission(..., 'admin')` |
| Frontend | Sin cambios |

