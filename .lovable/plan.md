

# Plan: Asegurar el guardado de imágenes en Storage

## Contexto

El código de guardado ya fue implementado pero tiene problemas potenciales que pueden hacer que falle silenciosamente. Este plan corrige esos problemas y agrega visibilidad de errores.

**Nota importante**: Este proyecto usa Lovable Cloud como backend. No es posible conectar otro proyecto externo - todo se almacena en el backend actual que ya incluye base de datos, storage y funciones.

## Problemas identificados

1. El guardado es completamente silencioso: si falla, el usuario no se entera
2. El insert usa `as any` para evitar errores de tipado, lo que puede ocultar problemas reales
3. No hay feedback visual al usuario de que las imagenes se estan guardando/guardaron

## Cambios a realizar

### 1. Mejorar `TryOnWidget.tsx`

- Quitar el `as any` del insert y usar los campos correctos segun el schema
- Agregar un toast de confirmacion cuando se guarden correctamente
- Agregar un toast de advertencia si falla el guardado (sin bloquear la experiencia)
- Agregar logs mas descriptivos para depuracion

### 2. Verificar compatibilidad de tipos

- Confirmar que los campos del insert coinciden exactamente con la tabla `tryon_history`
- La tabla tiene: `user_id`, `user_email`, `user_image_url`, `generated_image_url`, `category`, `user_size`, `garment_size` (todos presentes en el codigo actual)

### 3. Agregar feedback visual

- Despues de guardar exitosamente: toast "Resultado guardado en tu historial"
- Si falla: toast warning "No se pudo guardar en el historial" (no critico)

## Seccion Tecnica

### Archivo: `src/components/store/TryOnWidget.tsx`

Modificar `saveToStorageAndHistory`:

```typescript
const saveToStorageAndHistory = async (
  userId: string,
  userEmail: string | undefined,
  userPhotoFile: File,
  resultBase64: string,
  category: string,
  selectedSize: string | null,
) => {
  try {
    const timestamp = Date.now();
    const compressed = await compressImage(userPhotoFile, 1024, 0.7);
    const resultBlob = base64ToBlob(resultBase64);

    const userPath = `${userId}/${timestamp}-user.jpg`;
    const resultPath = `${userId}/${timestamp}-result.jpg`;

    const [userUpload, resultUpload] = await Promise.all([
      supabase.storage.from('tryon-results').upload(userPath, compressed.blob, { contentType: 'image/jpeg' }),
      supabase.storage.from('tryon-results').upload(resultPath, resultBlob, { contentType: 'image/jpeg' }),
    ]);

    if (userUpload.error) {
      console.error('User photo upload error:', userUpload.error);
      toast.warning('No se pudo guardar la foto en el historial');
      return;
    }
    if (resultUpload.error) {
      console.error('Result upload error:', resultUpload.error);
      toast.warning('No se pudo guardar el resultado en el historial');
      return;
    }

    const { error: insertError } = await supabase.from('tryon_history').insert({
      user_id: userId,
      user_email: userEmail || null,
      user_image_url: userPath,
      generated_image_url: resultPath,
      category,
      user_size: selectedSize || null,
      garment_size: selectedSize || null,
    });

    if (insertError) {
      console.error('History insert error:', insertError);
      toast.warning('No se pudo registrar en el historial');
    } else {
      toast.success('Resultado guardado en tu historial');
    }
  } catch (e) {
    console.error('Error saving to storage/history:', e);
    toast.warning('No se pudo guardar en el historial');
  }
};
```

Cambio clave: quitar el `as any` del insert. El schema de `tryon_history` ya tiene `user_email` como columna, asi que el tipo deberia ser compatible.

