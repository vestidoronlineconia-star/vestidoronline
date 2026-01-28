
## Plan: Agregar Opción de Cámara al Subir Foto

### Problema Actual
Cuando el usuario quiere probarse una prenda y necesita subir su foto, el componente `FileUpload` solo permite seleccionar archivos de la galería. No hay un botón dedicado para abrir la cámara directamente, lo cual es importante especialmente en dispositivos móviles.

---

### Solución Propuesta

Modificar el componente `FileUpload` para mostrar dos opciones cuando el usuario no tiene una foto cargada:
1. **Abrir Cámara** - Captura directa desde la cámara del dispositivo
2. **Subir Foto** - Seleccionar desde la galería (comportamiento actual)

---

### Diseño de UI

```text
┌─────────────────────────────────┐
│                                 │
│         [Ícono Usuario]         │
│                                 │
│    ┌─────────┐  ┌─────────┐     │
│    │ 📷      │  │ 📁      │     │
│    │ Cámara  │  │ Galería │     │
│    └─────────┘  └─────────┘     │
│                                 │
│      Clic o arrastra aquí       │
└─────────────────────────────────┘
```

---

### Cambios Técnicos

#### 1. Modificar `src/components/FileUpload.tsx`

**Agregar nuevo input para cámara:**
- Crear un segundo `<input type="file">` con el atributo `capture="user"` que fuerza la apertura de la cámara frontal
- Agregar botones separados para "Cámara" y "Galería"

**Importar ícono de cámara:**
```typescript
import { User, Shirt, Plus, Camera, ImagePlus } from "lucide-react";
```

**Estructura de la UI:**
- Mantener el área de drop para arrastrar archivos
- Reemplazar el botón único por dos botones:
  - Botón "Cámara" → activa `<input capture="user">`
  - Botón "Galería" → activa `<input>` actual

**Código del input de cámara:**
```typescript
<input
  type="file"
  id={`${id}-camera`}
  className="hidden"
  accept="image/*"
  capture="user"
  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
/>
```

**Nuevos botones en la UI:**
```typescript
<div className="flex gap-2 mt-3">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      document.getElementById(`${id}-camera`)?.click();
    }}
    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
  >
    <Camera className="w-4 h-4" />
    <span className="text-xs font-medium">Cámara</span>
  </button>
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      document.getElementById(id)?.click();
    }}
    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
  >
    <ImagePlus className="w-4 h-4" />
    <span className="text-xs font-medium">Galería</span>
  </button>
</div>
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/FileUpload.tsx` | Agregar input con `capture="user"`, botones de Cámara y Galería |

---

### Comportamiento Esperado

**En móviles:**
- Botón "Cámara" → Abre directamente la cámara frontal del dispositivo
- Botón "Galería" → Abre el selector de fotos del dispositivo

**En escritorio:**
- Botón "Cámara" → Si hay webcam, puede abrirla (depende del navegador)
- Botón "Galería" → Abre el explorador de archivos
- Arrastrar y soltar → Sigue funcionando igual

---

### Notas Técnicas

- El atributo `capture="user"` indica cámara frontal (ideal para selfies)
- El atributo `capture="environment"` sería para cámara trasera
- La compatibilidad con `capture` es excelente en móviles modernos (iOS Safari, Chrome Android)
- En escritorio, el comportamiento depende del navegador y si hay cámara disponible
