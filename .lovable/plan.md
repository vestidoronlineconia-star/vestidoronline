

# Plan: Guardar resultados generados en el historial desde la pagina principal

## Problema

La pagina principal (`Index.tsx`) genera imagenes de try-on pero nunca las guarda:
- Las imagenes originales se suben al bucket `user-uploads` (solo como registro), pero el resultado generado no se guarda en ningun bucket
- No se inserta ningun registro en la tabla `tryon_history`
- El boton "Ver resultados anteriores" abre `TryOnHistory`, que consulta `tryon_history` y genera signed URLs desde `tryon-results` -- ambos vacios

## Solucion

Agregar logica de guardado al flujo de generacion en `Index.tsx`, subiendo el resultado y la foto del usuario al bucket `tryon-results` e insertando un registro en `tryon_history`.

## Cambios

### Archivo: `src/pages/Index.tsx`

1. Agregar una funcion `base64ToBlob` (o importarla) para convertir el resultado base64 a Blob para subirlo al storage.

2. Agregar una funcion `saveResultToHistory` que:
   - Suba la foto del usuario comprimida (`userImg.compressed.blob`) al bucket `tryon-results` como `{userId}/{timestamp}-user.jpg`
   - Convierta `generateData.image` (base64 data URL) a Blob y lo suba al bucket `tryon-results` como `{userId}/{timestamp}-result.jpg`
   - Tambien suba la prenda comprimida (`clothImg.compressed.blob`) como `{userId}/{timestamp}-garment.jpg`
   - Inserte un registro en `tryon_history` con:
     - `user_id`: del usuario autenticado
     - `user_email`: email del usuario
     - `user_image_url`: path relativo de la foto del usuario en storage
     - `garment_image_url`: path relativo de la prenda en storage
     - `generated_image_url`: path relativo del resultado en storage
     - `category`: categoria seleccionada
     - `user_size`: talle del usuario
     - `garment_size`: talle de la prenda
     - `fit_result`: label del fitResult calculado

3. Llamar a `saveResultToHistory` despues de `setGeneratedImage(generateData.image)` dentro de `handleProcess`, solo si el usuario esta autenticado. Usar try-catch para que un error de guardado no afecte la experiencia.

4. Mostrar toast de confirmacion cuando se guarda exitosamente.

### Detalle de la insercion en handleProcess (lineas ~267-272)

Despues de:
```typescript
setGeneratedImage(generateData.image);
setStatus("complete");
toast.success("Imagen generada con exito!");
```

Agregar:
```typescript
if (user) {
  try {
    await saveResultToHistory(
      user.id,
      user.email,
      userImg.compressed.blob,
      clothImg.compressed.blob,
      generateData.image,
      selectedCategory,
      userSize,
      garmentSize,
      currentFit,
    );
    toast.success("Resultado guardado en tu historial");
  } catch (err) {
    console.error('Error saving to history:', err);
  }
}
```

### Funcion saveResultToHistory

```typescript
const base64ToBlob = (base64: string): Blob => {
  const data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/jpeg' });
};

const saveResultToHistory = async (
  userId: string,
  userEmail: string | undefined,
  userBlob: Blob,
  garmentBlob: Blob,
  resultBase64: string,
  category: string,
  userSize: string,
  garmentSize: string,
  fitResult: FitResult,
) => {
  const timestamp = Date.now();
  const resultBlob = base64ToBlob(resultBase64);

  const userPath = `${userId}/${timestamp}-user.jpg`;
  const garmentPath = `${userId}/${timestamp}-garment.jpg`;
  const resultPath = `${userId}/${timestamp}-result.jpg`;

  const [userUp, garmentUp, resultUp] = await Promise.all([
    supabase.storage.from('tryon-results').upload(userPath, userBlob, { contentType: 'image/jpeg' }),
    supabase.storage.from('tryon-results').upload(garmentPath, garmentBlob, { contentType: 'image/jpeg' }),
    supabase.storage.from('tryon-results').upload(resultPath, resultBlob, { contentType: 'image/jpeg' }),
  ]);

  if (userUp.error || garmentUp.error || resultUp.error) {
    console.error('Storage upload errors:', userUp.error, garmentUp.error, resultUp.error);
    return;
  }

  await supabase.from('tryon_history').insert({
    user_id: userId,
    user_email: userEmail || null,
    user_image_url: userPath,
    garment_image_url: garmentPath,
    generated_image_url: resultPath,
    category,
    user_size: userSize,
    garment_size: garmentSize,
    fit_result: fitResult.label,
  });
};
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Agregar `base64ToBlob`, `saveResultToHistory`, y llamarla en `handleProcess` despues de generar la imagen |

No se necesitan cambios en la base de datos, storage ni RLS -- todo ya esta configurado correctamente.
