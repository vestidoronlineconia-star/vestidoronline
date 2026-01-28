

## Plan: Enviar Email de Invitación a Nuevos Miembros

### Contexto Actual

- La función `inviteMember` en `useTeam.tsx` solo inserta en la base de datos
- Ya existe una edge function `send-access-request` que usa **Resend** para emails
- El secret `RESEND_API_KEY` ya está configurado

---

### Solución

Crear una nueva edge function `send-team-invitation` que envíe el email de bienvenida al usuario invitado.

---

### Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/send-team-invitation/index.ts` | **Crear** | Edge function que envía el email de invitación |
| `src/hooks/useTeam.tsx` | **Modificar** | Llamar a la edge function después de insertar en DB |

---

### Nueva Edge Function: `send-team-invitation/index.ts`

```typescript
// Estructura del email que se enviará
{
  to: "usuario@ejemplo.com",
  subject: "¡Felicidades! Tu acceso a Vestidor Online está listo",
  html: `
    <h1>¡Felicidades!</h1>
    <p>Estuvimos analizando tu web y creemos que es posible 
    una integración con nuestra tecnología innovadora para 
    probar ropa de manera virtual.</p>
    <p>Entrá al link para acceder a nuestro portal de cliente:</p>
    <a href="https://vestidoronline.lovable.app/client">
      Acceder al Portal
    </a>
  `
}
```

**Datos que recibirá:**
- `email`: Email del usuario invitado
- `role`: Rol asignado (admin/editor/viewer)
- `client_name`: Nombre del cliente/empresa que invita

---

### Cambios en `useTeam.tsx`

```typescript
const inviteMember = async (memberData: InviteMemberData): Promise<TeamMember | null> => {
  // ... código existente de inserción ...
  
  // Después de insertar exitosamente:
  try {
    await supabase.functions.invoke('send-team-invitation', {
      body: {
        email: memberData.email,
        role: memberData.role,
        client_name: clientName, // Necesitamos obtener el nombre del cliente
      }
    });
  } catch (emailError) {
    console.error('Error sending invitation email:', emailError);
    // No fallar la invitación si el email falla
  }
  
  return typedData;
};
```

---

### Diseño del Email

**Asunto:** `¡Felicidades! Tu acceso a Vestidor Online está listo`

**Contenido:**
```text
┌─────────────────────────────────────────────┐
│                                             │
│  [Logo Vestidor Online]                     │
│                                             │
│  ¡Felicidades!                              │
│                                             │
│  Estuvimos analizando tu web y creemos      │
│  que es posible una integración con         │
│  nuestra tecnología innovadora para         │
│  probar ropa de manera virtual.             │
│                                             │
│  Entrá al link para acceder a nuestro       │
│  portal de cliente:                         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │     Acceder al Portal de Cliente    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ─────────────────────────────────────────  │
│  Tu rol: Administrador                      │
│  ─────────────────────────────────────────  │
│                                             │
│  Vestidor Online - Tecnología de            │
│  Prueba Virtual                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Flujo Completo

```text
Usuario Admin                Edge Function           Base de Datos        Usuario Invitado
     │                            │                       │                     │
     │  Invitar miembro           │                       │                     │
     │ ──────────────────────────────────────────────────>│                     │
     │                            │                       │                     │
     │                            │   INSERT team_member  │                     │
     │                            │ ──────────────────────>                     │
     │                            │                       │                     │
     │  Invocar send-team-invitation                      │                     │
     │ ────────────────────────────>                      │                     │
     │                            │                       │                     │
     │                            │         Enviar email con Resend             │
     │                            │ ─────────────────────────────────────────────>
     │                            │                       │                     │
     │  Toast: "Invitación enviada"                       │     Recibe email    │
     │ <──────────────────────────│                       │                     │
```

---

### Consideraciones

1. **El email no bloquea la invitación** - Si falla el envío, la invitación sigue existiendo en la DB
2. **Función `resendInvitation`** - También se actualizará para llamar a la edge function
3. **Dominio de Resend** - Actualmente usa `onboarding@resend.dev` (dominio de prueba de Resend)

