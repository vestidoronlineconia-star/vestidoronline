
# Plan: Corregir el guardado de imagenes en Storage

## Problema identificado

La funcion `saveToStorageAndHistory` recibe el archivo original (`userPhotoFile: File`) y llama a `compressImage(userPhotoFile, 1024, 0.7)` para re-comprimir la foto. Sin embargo, la foto del usuario ya fue comprimida cuando se subio y el objeto `userPhoto` ya contiene `compressed.blob` listo para usar.

El problema es que `compressImage` internamente hace `URL.createObjectURL(file)` para cargar la imagen en un canvas. Despues de ~20 segundos de procesamiento del try-on (analyze + generate), el objeto File puede no estar disponible correctamente o la operacion falla silenciosamente dentro del try-catch, lo que impide que se ejecuten los uploads al Storage.

Ademas, al no haber ningun request de red hacia `tryon-results` en los logs, confirma que el codigo falla ANTES de llegar al upload, es decir, en la etapa de compresion.

## Solucion

Pasar directamente el `compressed.blob` ya disponible en `userPhoto` en lugar de re-comprimir el archivo. Esto elimina el punto de falla y es mas eficiente.

## Cambios

### Archivo: `src/components/store/TryOnWidget.tsx`

1. Cambiar la firma de `saveToStorageAndHistory` para recibir un `Blob` en vez de un `File`:

```typescript
const saveToStorageAndHistory = async (
  userId: string,
  userEmail: string | undefined,
  userPhotoBlob: Blob,         // ya comprimido
  resultBase64: string,
  category: string,
  selectedSize: string | null,
) => {
  try {
    const timestamp = Date.now();
    const resultBlob = base64ToBlob(resultBase64);

    const userPath = `${userId}/${timestamp}-user.jpg`;
    const resultPath = `${userId}/${timestamp}-result.jpg`;

    const [userUpload, resultUpload] = await Promise.all([
      supabase.storage.from('tryon-results').upload(userPath, userPhotoBlob, { contentType: 'image/jpeg' }),
      supabase.storage.from('tryon-results').upload(resultPath, resultBlob, { contentType: 'image/jpeg' }),
    ]);
    // ... resto igual
  }
};
```

2. En la llamada a `saveToStorageAndHistory`, pasar `userPhoto.compressed.blob` en vez de `userPhoto.file`:

```typescript
if (user && userPhoto?.compressed?.blob) {
  await saveToStorageAndHistory(
    user.id,
    user.email,
    userPhoto.compressed.blob,    // blob ya comprimido
    generateData.image,
    product.category,
    selectedSize,
  );
}
```

3. Eliminar la importacion de `compressImage` ya que no se usa mas en este archivo.

### Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/store/TryOnWidget.tsx` | Usar `userPhoto.compressed.blob` en lugar de re-comprimir con `compressImage()`. Actualizar firma de la funcion y la llamada. |
