

# Plan: Permitir a editores y admins gestionar productos del cliente

## Problema

La tabla `client_products` tiene una unica politica de gestion ("Users can manage their client products") que solo permite operaciones al propietario del cliente (`embed_clients.user_id = auth.uid()`). Los miembros del equipo con rol editor o admin no pueden insertar, actualizar ni eliminar productos.

## Solucion

### Migracion SQL

Agregar una nueva politica RLS en `client_products` que permita a los miembros del equipo con rol `editor` o superior (editor, admin, owner) gestionar productos. Usaremos la funcion existente `user_has_client_permission` que ya implementa la jerarquia de roles.

```sql
CREATE POLICY "Team editors can manage client products"
  ON public.client_products
  FOR ALL
  USING (
    user_has_client_permission(client_id, auth.uid(), 'editor'::team_role)
  )
  WITH CHECK (
    user_has_client_permission(client_id, auth.uid(), 'editor'::team_role)
  );
```

Esto cubre:
- Creacion manual de productos
- Importacion de productos (CSV, JSON, API, URL)
- Actualizacion y eliminacion de productos
- Exportacion (ya funciona porque el SELECT de productos activos es publico para autenticados)

### Sin cambios en frontend

El codigo frontend (`ClientPortalProducts.tsx` y `useProducts.tsx`) ya esta preparado: recibe el `clientId` de la URL y opera contra la base de datos. El unico bloqueo era la politica RLS, que se resuelve con la migracion.

## Resumen

| Componente | Cambio |
|-----------|--------|
| Migracion SQL | Nueva politica RLS `FOR ALL` en `client_products` usando `user_has_client_permission(..., 'editor')` |
| Frontend | Sin cambios necesarios |

