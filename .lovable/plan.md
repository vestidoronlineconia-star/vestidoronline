

# Emails de verificacion desde vestidor.online via Resend

## Problema

Cuando un usuario se registra, el email de verificacion lo envia el sistema por defecto con un enlace que apunta al dominio de preview de Lovable en lugar de a `vestidoronline.lovable.app`. Ademas, el remitente no es `vestidor.online`.

## Solucion

### 1. Crear edge function `send-confirmation-email`

Nueva funcion en `supabase/functions/send-confirmation-email/index.ts` que:
- Recibe el email del usuario recien registrado
- Usa el cliente admin de Supabase (`admin.generateLink`) para generar el enlace de confirmacion apuntando a `https://vestidoronline.lovable.app/auth/callback`
- Envia el email via Resend desde `noreply@vestidor.online` con diseno consistente con los emails de invitacion existentes

### 2. Actualizar `src/pages/Auth.tsx`

- Despues de un `signUp` exitoso, llamar a la edge function `send-confirmation-email` para enviar el email personalizado
- Cambiar `emailRedirectTo` para que siempre use `https://vestidoronline.lovable.app/auth/callback` en lugar de `window.location.origin`

### 3. Configurar la edge function en `supabase/config.toml`

- Agregar la nueva funcion con `verify_jwt = false` ya que necesita ser llamada justo despues del registro (el usuario aun no tiene sesion confirmada)

## Detalle tecnico

### Edge function `send-confirmation-email`

```text
POST /send-confirmation-email
Body: { email: string }

Flujo:
1. Crear cliente Supabase con service_role_key
2. Llamar admin.generateLink({ type: 'signup', email, options: { redirectTo: 'https://vestidoronline.lovable.app/auth/callback' } })
3. Obtener action_link del resultado
4. Enviar email via Resend con template HTML branded
5. Retornar success/error
```

### Cambios en Auth.tsx

- Despues de `supabase.auth.signUp()`, invocar la edge function con el email
- El redirect en signUp se fija a la URL publicada: `https://vestidoronline.lovable.app/auth/callback`

### Template del email

Seguira el mismo estilo visual que los emails de invitacion existentes (send-team-invitation), con:
- Header "Vestidor Online" en violeta
- Boton CTA "Confirmar mi Email" que apunta al action_link generado
- Footer con branding

### Nota importante

El usuario podria recibir tambien el email por defecto del sistema de autenticacion. El email personalizado de Resend sera el que tenga el branding correcto y el enlace al dominio correcto. Se puede instruir a los usuarios a usar ese email.

## Resumen

| Componente | Cambio |
|-----------|--------|
| `supabase/functions/send-confirmation-email/index.ts` | Nueva edge function que genera link y envia email via Resend |
| `supabase/config.toml` | Agregar configuracion de la nueva funcion |
| `src/pages/Auth.tsx` | Llamar a la edge function post-registro, fijar redirectTo al dominio publicado |

