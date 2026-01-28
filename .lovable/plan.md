

## Plan: Implementar Captura de Cámara Real (Móvil + Escritorio)

### Problema Identificado

El atributo HTML `capture="user"` tiene una **limitación del navegador**:
- **En móviles (iOS/Android):** Funciona correctamente y abre la cámara
- **En escritorio:** Es **completamente ignorado** por el navegador y siempre abre el explorador de archivos

Por eso, aunque el código está correcto, al probar desde un navegador de escritorio no se abre la cámara.

---

### Solución

Crear un componente de cámara que use la **API MediaDevices** (`navigator.mediaDevices.getUserMedia()`), que sí funciona en navegadores de escritorio con webcam.

---

### Cambios a Realizar

#### 1. Crear nuevo componente `src/components/CameraCapture.tsx`

Un modal/diálogo que:
- Solicita permiso para acceder a la cámara
- Muestra el video en vivo de la webcam
- Tiene un botón para capturar la foto
- Permite seleccionar cámara frontal o trasera (en móviles)

#### 2. Modificar `src/components/FileUpload.tsx`

- Importar el nuevo componente `CameraCapture`
- Agregar un estado para controlar si se muestra el modal de cámara
- Modificar el botón "Cámara" para:
  - En **móviles**: Usar el input con `capture="user"` (comportamiento actual que funciona)
  - En **escritorio**: Abrir el modal con la webcam

#### 3. Detección de dispositivo

Usar detección para elegir el método correcto:
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
```

---

### Diseño del Modal de Cámara

```text
┌────────────────────────────────────┐
│              Tomar foto        [X] │
├────────────────────────────────────┤
│                                    │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   │      Video en vivo         │   │
│   │      de la webcam          │   │
│   │                            │   │
│   └────────────────────────────┘   │
│                                    │
│         [ 📷 Capturar ]            │
│                                    │
│           [Cancelar]               │
└────────────────────────────────────┘
```

---

### Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/CameraCapture.tsx` | Crear | Componente modal para capturar foto desde webcam |
| `src/components/FileUpload.tsx` | Modificar | Integrar el nuevo componente de cámara |

---

### Detalles Técnicos

**CameraCapture.tsx:**
```typescript
// Solicitar acceso a la cámara
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user' } // Cámara frontal
});

// Capturar frame del video
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext('2d')?.drawImage(video, 0, 0);

// Convertir a blob/file
canvas.toBlob((blob) => {
  const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
  // Enviar al componente padre
});
```

**FileUpload.tsx - Lógica de detección:**
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// En el botón de cámara:
onClick={() => {
  if (isMobile) {
    // Usar input con capture (funciona en móviles)
    document.getElementById(`${id}-camera`)?.click();
  } else {
    // Abrir modal de webcam (para escritorio)
    setShowCameraModal(true);
  }
}}
```

---

### Comportamiento Final

| Dispositivo | Al presionar "Cámara" |
|-------------|----------------------|
| Móvil (iOS/Android) | Abre cámara nativa del dispositivo |
| Escritorio con webcam | Abre modal con vista de la webcam |
| Escritorio sin webcam | Muestra mensaje de error amigable |

