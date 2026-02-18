

# Plan: Actualizar dominio de envio de emails a vestidor.online

## Cambios

Se actualizaran las dos edge functions que envian emails para usar el dominio verificado `vestidor.online` en lugar de `onboarding@resend.dev`.

### 1. `supabase/functions/send-team-invitation/index.ts` (linea 70)

Cambiar:
```
from: "Vestidor Online <onboarding@resend.dev>"
```
A:
```
from: "Vestidor Online <noreply@vestidor.online>"
```

### 2. `supabase/functions/send-access-request/index.ts` (linea 107)

Cambiar:
```
from: "Vestidor Online <onboarding@resend.dev>"
```
A:
```
from: "Vestidor Online <noreply@vestidor.online>"
```

## Resultado

Con el dominio verificado, los emails de invitacion de equipo y solicitud de acceso llegaran a cualquier destinatario sin restricciones.

