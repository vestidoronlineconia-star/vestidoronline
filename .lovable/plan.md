

# Fix: Registro completo via edge function con Resend

## Problema actual

El flujo actual tiene un conflicto:

1. El frontend llama a `supabase.auth.signUp()` que crea el usuario Y envia el email por defecto de Supabase (con enlace al dominio incorrecto)
2. Luego llama a la edge function `send-confirmation-email` que intenta generar OTRO link con `admin.generateLink({ type: "signup" })` para un usuario que ya fue creado

Resultado: el usuario recibe el email de Supabase (no de Resend), o recibe dos emails, y el link de confirmacion del segundo puede no funcionar correctamente porque el usuario ya existe.

## Solucion

Mover TODO el proceso de registro a la edge function. En vez de que el frontend haga `signUp` y luego llame a la edge function, el frontend solo llama a la edge function que hace ambas cosas:

1. Crea el usuario via `admin.generateLink({ type: "signup", email, password })` (esto crea el usuario Y genera el link, sin enviar email automatico)
2. Envia el email de confirmacion via Resend con el link correcto

### Cambios en `supabase/functions/send-confirmation-email/index.ts`

- Recibir `email` y `password` en el body
- Usar `admin.generateLink({ type: "signup", email, password, options: { redirectTo } })` que crea el usuario y genera el link sin enviar email automatico
- Enviar solo el email de Resend con el link generado

### Cambios en `src/pages/Auth.tsx`

- Reemplazar `supabase.auth.signUp()` + llamada separada a la edge function por UNA sola llamada a la edge function con email y password
- Manejar errores de la edge function (usuario ya registrado, etc.)

### Configuracion `supabase/config.toml`

- Agregar `[functions.send-confirmation-email]` con `verify_jwt = false` (necesario porque el usuario aun no tiene sesion)

## Resumen

| Componente | Cambio |
|-----------|--------|
| `send-confirmation-email` edge function | Recibe password, crea usuario via admin API, envia solo email de Resend |
| `Auth.tsx` | Una sola llamada a la edge function en vez de signUp + edge function |
| `config.toml` | Agregar configuracion de la funcion |

