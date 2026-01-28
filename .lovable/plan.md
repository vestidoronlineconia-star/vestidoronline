

## Plan: Agregar Botón para Quitar Imagen

### Problema Actual

Cuando el usuario ya tiene una imagen cargada:
1. Solo puede ver "Cambiar" al hacer hover
2. Al hacer clic solo puede seleccionar desde galería
3. **No tiene opción de usar la cámara** para cambiar la foto
4. **No puede quitar la imagen** para volver a ver los botones de Cámara/Galería

---

### Solución

Agregar un botón "X" (quitar imagen) en la esquina superior derecha de la imagen cargada. Al presionarlo:
- Se elimina la imagen actual
- Vuelven a aparecer los botones de "Cámara" y "Galería"

---

### Diseño Visual

```text
Imagen cargada:
┌─────────────────────────────────┐
│ [X] ◄── Botón para quitar      │
│                                 │
│         (imagen actual)         │
│                                 │
│                                 │
│         [ Cambiar ]             │
└─────────────────────────────────┘

Después de quitar:
┌─────────────────────────────────┐
│                                 │
│         [Ícono Usuario]         │
│                                 │
│    ┌─────────┐  ┌─────────┐     │
│    │ 📷      │  │ 📁      │     │
│    │ Cámara  │  │ Galería │     │
│    └─────────┘  └─────────┘     │
│                                 │
└─────────────────────────────────┘
```

---

### Cambios Técnicos

#### Modificar `src/components/FileUpload.tsx`

1. **Importar ícono X**:
   ```typescript
   import { User, Shirt, Camera, ImagePlus, X } from "lucide-react";
   ```

2. **Agregar prop para limpiar la imagen**:
   - El componente padre (`Index.tsx`) ya pasa `preview` y `onFileSelect`
   - Para quitar la imagen, se llamará `onFileSelect` con `null`
   - Se actualizará la interfaz `FileUploadProps` para aceptar `null`

3. **Agregar botón X en la vista de preview**:
   ```typescript
   {preview && (
     <button
       type="button"
       onClick={(e) => {
         e.stopPropagation();
         onFileSelect(null);
       }}
       className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
     >
       <X className="w-4 h-4 text-white" />
     </button>
   )}
   ```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/FileUpload.tsx` | Agregar botón X para quitar imagen, actualizar tipo de `onFileSelect` |
| `src/pages/Index.tsx` | Manejar el caso cuando `onFileSelect` recibe `null` |

---

### Comportamiento Final

1. Usuario carga una imagen
2. Ve la imagen con un botón "X" en la esquina superior derecha
3. Al presionar "X":
   - La imagen se elimina
   - Vuelven a aparecer los botones "Cámara" y "Galería"
4. El usuario puede ahora elegir tomar una foto con la cámara o subir desde galería

