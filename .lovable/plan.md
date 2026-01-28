

## Plan: Arreglar Selector de Roles en Modal de Invitación

### Problema Identificado

El componente `InviteMemberModal.tsx` tiene un **conflicto de eventos** que impide cambiar entre roles:

1. El `RadioGroup` tiene `onValueChange` para manejar selecciones
2. El `div` contenedor tiene `onClick={() => setRole(roleOption.id)}` - duplicando la lógica
3. El `Label` usa `htmlFor={roleOption.id}` que también intenta activar el radio

Estos tres manejadores de eventos están compitiendo, causando comportamiento inesperado.

---

### Solución

Simplificar la estructura del componente eliminando manejadores de eventos redundantes:

1. **Eliminar el `onClick` del div contenedor** - El RadioGroup ya maneja la selección
2. **Usar `label` como contenedor clickeable** - En lugar de un `div` con `onClick`, convertir todo el contenedor en un `label` que apunte al radio
3. **Mantener solo el `onValueChange` del RadioGroup** - Es el único handler necesario

---

### Cambios en `src/components/team/InviteMemberModal.tsx`

**Antes (problemático):**
```typescript
<div
  key={roleOption.id}
  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
  onClick={() => setRole(roleOption.id)}  // ❌ Conflicto
>
  <RadioGroupItem value={roleOption.id} id={roleOption.id} className="mt-1" />
  <div className="flex-1">
    <Label htmlFor={roleOption.id} className="font-medium cursor-pointer">  // ❌ Otro conflicto
      {roleOption.label}
    </Label>
    ...
  </div>
</div>
```

**Después (corregido):**
```typescript
<label
  key={roleOption.id}
  htmlFor={roleOption.id}
  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer block"
>
  <RadioGroupItem value={roleOption.id} id={roleOption.id} className="mt-1" />
  <div className="flex-1">
    <span className="font-medium">
      {roleOption.label}
    </span>
    ...
  </div>
</label>
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/team/InviteMemberModal.tsx` | Eliminar `onClick` del div, convertir a `label`, y eliminar el `Label` interno que causaba conflicto |

---

### Resultado Esperado

- Al hacer clic en cualquier parte de la opción (radio, texto, descripción), se selecciona correctamente ese rol
- No hay conflictos de eventos
- El indicador visual del radio se actualiza correctamente
- El estado `role` se actualiza correctamente antes de enviar la invitación

