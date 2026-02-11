

# Plan: Requerir autenticacion para acceder a tiendas y habilitar productos/probador para todos los usuarios

## Problema actual

1. **Sin login obligatorio**: Con el cambio reciente a `security_invoker=false`, usuarios anonimos pueden ver la configuracion de la tienda sin iniciar sesion. El usuario quiere que sea obligatorio autenticarse.

2. **Productos bloqueados**: La politica RLS de `client_products` ("Anyone can read active products of active clients") hace un subquery contra `embed_clients`, que tiene RLS restrictivo. Solo el dueno o miembros del equipo pueden ver productos. Cualquier otro usuario autenticado ve 0 productos.

3. **Probador virtual**: El try-on ya funciona para usuarios autenticados (usa edge function + storage). No requiere cambios, pero solo funciona si el usuario puede ver los productos.

## Solucion

### 1. Requerir login en la tienda (Frontend)

**Archivo: `src/pages/ClientStore.tsx`**

Cambiar la logica para que si el usuario no esta autenticado, SIEMPRE muestre la pantalla de "Inicia sesion", independientemente de si la config cargo o no:

```text
Antes (linea 56):   if (!user && (error || !clientConfig))
Despues:            if (!user)
```

Esto garantiza que cualquier visitante no autenticado vea el cartel de login con redirect a la tienda original.

### 2. Permitir que usuarios autenticados vean productos (Base de datos)

Crear una funcion `SECURITY DEFINER` que verifique si un client esta activo, y actualizar la politica RLS de `client_products`:

```sql
-- Funcion para verificar si un cliente esta activo (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_client_active(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.embed_clients
    WHERE id = p_client_id AND is_active = true
  );
$$;

-- Reemplazar la politica de lectura publica
DROP POLICY IF EXISTS "Anyone can read active products of active clients"
  ON public.client_products;

CREATE POLICY "Authenticated users can read active products of active clients"
  ON public.client_products
  FOR SELECT
  USING (
    is_active = true
    AND is_client_active(client_id)
  );
```

Esto permite que cualquier usuario autenticado vea los productos activos de clientes activos, sin depender de las politicas RLS de `embed_clients`.

### 3. Permitir insertar uso (embed_usage) para usuarios autenticados

La politica de INSERT en `embed_usage` tambien hace subquery contra `embed_clients`. Necesita el mismo fix:

```sql
DROP POLICY IF EXISTS "Insert usage for active clients only"
  ON public.embed_usage;

CREATE POLICY "Insert usage for active clients only"
  ON public.embed_usage
  FOR INSERT
  WITH CHECK (is_client_active(client_id));
```

## Flujo resultante

```text
1. Usuario visita /tienda/sasa (no logueado)
2. Ve pantalla "Inicia sesion para continuar" con boton a /auth?redirect=/tienda/sasa
3. Se registra o inicia sesion
4. Es redirigido a /tienda/sasa
5. Ve todos los productos activos con stock
6. Puede usar el probador virtual subiendo su foto
7. El resultado se guarda en su historial
```

## Resumen de cambios

| Componente | Cambio |
|-----------|--------|
| `src/pages/ClientStore.tsx` | Cambiar condicion linea 56 de `!user && (error \|\| !clientConfig)` a simplemente `!user` |
| Migracion SQL | Crear funcion `is_client_active()` SECURITY DEFINER |
| Migracion SQL | Reemplazar politica SELECT de `client_products` para usar la nueva funcion |
| Migracion SQL | Reemplazar politica INSERT de `embed_usage` para usar la nueva funcion |

## Seguridad

- Los usuarios deben estar autenticados para ver cualquier tienda
- Solo se exponen productos activos de clientes activos
- Los campos sensibles de `embed_clients` (api_key, user_id, etc.) siguen protegidos por la vista publica
- El probador virtual ya requiere autenticacion (usa `user.id` para guardar historial)
- La funcion `is_client_active` es SECURITY DEFINER pero solo devuelve un booleano, no expone datos

