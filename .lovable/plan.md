
## Plan: Cambiar el título de la página de login

### Problema
El título en la página de login dice "Virtual Try-On", que no deja claro al usuario a dónde se está logeando/registrando. Es mejor usar un texto en español que describa claramente el servicio.

### Solución
Cambiar el título en `src/pages/Auth.tsx` (línea 235) de "Virtual Try-On" a "Prueba ropa digitalmente".

### Cambios

**Archivo: `src/pages/Auth.tsx`**

| Línea | Cambio |
|-------|--------|
| 235 | Cambiar `Virtual Try-On` por `Prueba ropa digitalmente` |

El nuevo bloque de código quedará:
```typescript
<h1 className="text-2xl font-bold text-center mb-2">
  Prueba ropa digitalmente
</h1>
```

### Resultado
Cuando un usuario visite la página de login, verá claramente que se está registrando/logeando en una plataforma de prueba de ropa virtual. Esto mejora la experiencia y aclara el propósito del sitio.
