

# Plan: Redirigir al usuario a la tienda original despues del login

## Problema

Cuando un usuario no autenticado visita `/tienda/santiago`, se le muestra el cartel de login con un link a `/auth`. Despues de iniciar sesion o registrarse, el codigo actual siempre redirige a `/` (la pagina principal) en vez de volver a la tienda donde estaba.

## Solucion

Usar un parametro `redirect` en la URL para recordar de donde vino el usuario y redirigirlo ahi despues del login.

## Cambios

### 1. `src/pages/ClientStore.tsx`

Modificar los links de login/registro para incluir la ruta actual como parametro:

- Cambiar `<Link to="/auth">` por `<Link to={"/auth?redirect=" + encodeURIComponent(location.pathname)}>`
- Importar `useLocation` de react-router-dom

### 2. `src/pages/Auth.tsx`

Modificar la logica post-login para leer el parametro `redirect`:

- Importar `useSearchParams` de react-router-dom
- Leer `searchParams.get('redirect')` al inicio del componente
- En el `handleSubmit`, despues de login exitoso (linea 179), cambiar `navigate('/')` por `navigate(redirectPath || '/')`
- En el `emailRedirectTo` del signup (linea 198), agregar el redirect path: cambiar a `` `${window.location.origin}${redirectPath || '/'}` ``

### 3. `src/App.tsx`

Modificar el componente `AuthRoute` para preservar el parametro redirect:

- Cuando un usuario ya logueado visita `/auth?redirect=/tienda/santiago`, redirigirlo al `redirect` en vez de siempre a `/`
- Leer `searchParams.get('redirect')` y usar ese valor en el `Navigate`

## Flujo resultante

```text
1. Usuario visita /tienda/sasa (no logueado)
2. Ve cartel "Inicia sesion" con boton que apunta a /auth?redirect=/tienda/sasa
3. Inicia sesion o se registra
4. Es redirigido a /tienda/sasa automaticamente
```

## Seccion tecnica

| Archivo | Cambio |
|---------|--------|
| `src/pages/ClientStore.tsx` | Agregar `useLocation`, pasar `redirect` query param en links a `/auth` |
| `src/pages/Auth.tsx` | Leer `redirect` de query params, usarlo en `navigate()` post-login y en `emailRedirectTo` |
| `src/App.tsx` | En `AuthRoute`, leer `redirect` param y usarlo en `Navigate` cuando el usuario ya esta logueado |

