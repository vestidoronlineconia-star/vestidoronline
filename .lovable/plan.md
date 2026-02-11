
# Plan: Agregar espaciado inferior en mobile para evitar sobreposición con footer

## Problema

En pantallas móviles, cuando se genera una imagen de try-on, el botón de descarga (icono Download) queda muy pegado al borde inferior de la pantalla. Esto ocurre porque:

1. El contenedor principal usa `min-h-screen flex items-center justify-center` que centra el contenido verticalmente
2. El `p-4 md:p-8` solo agrega padding horizontal/vertical uniforme
3. En mobile no hay suficiente espacio abajo para el flujo de scroll, causando que elementos como el logo de "logs" o footer se superpongan

## Solución

Agregar padding-bottom adicional específicamente para pantallas móviles al contenedor principal de `Index.tsx`. Esto crea un "buffer" de espacio al final de la página para que el usuario pueda scrollear sin que el botón de descarga se sobreponga con elementos fijos o del navegador.

## Cambios

### Archivo: `src/pages/Index.tsx`

Modificar el contenedor principal (línea 462) que actualmente es:
```typescript
<div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative">
```

Cambiar a:
```typescript
<div className="min-h-screen flex items-center justify-center p-4 md:p-8 pb-24 md:pb-8 relative">
```

**Explicación:**
- `pb-24` en mobile: Agrega 6rem (96px) de padding-bottom en pantallas pequeñas
- `md:pb-8` en desktop: Vuelve al padding normal de 2rem (32px) en pantallas medianas+
- Esto permite que en mobile haya suficiente espacio para scrollear y ver completamente el botón de descarga sin que se sobreponga con elementos del navegador o UI del dispositivo

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Agregar `pb-24 md:pb-8` al contenedor principal (línea 462) |

