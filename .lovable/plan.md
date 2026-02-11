

# Plan: Guardar imagenes generadas y foto del usuario en Storage con compresion

## Resumen

Guardar automaticamente la imagen generada del try-on y la foto original del usuario en el bucket de Storage, comprimiendo ambas antes de subirlas. Vincular cada registro al email del usuario para trazabilidad e historial.

## Cambios necesarios

### 1. Migracion SQL

- Crear bucket privado `tryon-results` con RLS por `user_id` en la ruta del archivo
- Agregar columna `user_email` (text, nullable) a la tabla `tryon_history`

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('tryon-results', 'tryon-results', false);

CREATE POLICY "Users upload own tryon images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tryon-results' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own tryon images" ON storage.objects FOR SELECT
USING (bucket_id = 'tryon-results' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own tryon images" ON storage.objects FOR DELETE
USING (bucket_id = 'tryon-results' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE tryon_history ADD COLUMN user_email text;
```

### 2. Modificar Edge Function `virtual-tryon/index.ts`

En la accion `generate`, despues de obtener la imagen generada:

- Recibir `userId` y `userEmail` del frontend
- Decodificar base64 de la imagen generada y de la foto del usuario
- Comprimir ambas imagenes en el servidor (redimensionar a max 1024px y calidad 70% JPEG usando canvas en Deno, o usando sharp-like approach con encoding)
- Subirlas al bucket `tryon-results/{userId}/{timestamp}-result.jpg` y `{timestamp}-user.jpg`
- Insertar registro en `tryon_history` con las URLs de Storage, email, categoria, talles y fit
- Devolver el base64 original al frontend (para mostrar inmediatamente)

Nota: En Deno (edge functions) no hay canvas nativo. La compresion se hara re-encodeando el JPEG con calidad reducida. Se puede usar la libreria `imagescript` de Deno o simplemente almacenar el JPEG tal cual viene de Gemini (que ya es comprimido) y comprimir solo la foto del usuario reduciendola en el frontend antes de enviarla.

**Enfoque elegido**: Comprimir en el frontend (ya existe `imageCompression.ts`) antes de enviar a la edge function. La edge function solo sube los blobs al Storage.

### 3. Modificar `TryOnWidget.tsx`

- Importar `useAuth` para obtener `user.id` y `user.email`
- Antes de enviar a la edge function, comprimir la foto del usuario usando `compressImage()` existente (max 1024px, quality 0.7)
- Despues de recibir el resultado exitoso, enviar las imagenes (user photo comprimida + resultado generado) al backend para que las guarde
- Agregar un paso post-generacion: llamar a la edge function con una nueva accion `save` o hacer el upload directamente desde el frontend usando `supabase.storage`

**Enfoque preferido**: Upload directo desde el frontend usando `supabase.storage.from('tryon-results').upload(...)` - es mas simple y respeta las RLS policies. Luego insertar el registro en `tryon_history`.

Flujo actualizado:

```text
1. Usuario sube foto -> compressImage() reduce a max 1024px, quality 0.7
2. Enviar base64 comprimido a edge function (analyze + generate)
3. Recibir imagen generada (base64)
4. Mostrar resultado al usuario
5. En paralelo (sin bloquear UI):
   a. Convertir base64 del resultado a Blob
   b. Upload foto usuario comprimida a tryon-results/{userId}/{ts}-user.jpg
   c. Upload resultado a tryon-results/{userId}/{ts}-result.jpg
   d. Insertar registro en tryon_history con URLs y email
```

### 4. Modificar `useTryOnHistory.tsx`

- En `deleteItem`: tambien eliminar los archivos del bucket Storage usando `supabase.storage.from('tryon-results').remove([paths])`
- Agregar funcion para generar URLs firmadas (`createSignedUrl`) para mostrar imagenes del bucket privado
- Modificar `fetchHistory` para generar signed URLs de cada imagen

### 5. Modificar `TryOnHistory.tsx`

- Las imagenes del historial ahora vendran como signed URLs (generadas en el hook)
- No requiere cambios grandes, solo asegurarse de que las URLs sean validas

---

## Seccion Tecnica

### Estructura de archivos en Storage

```text
tryon-results/
  {user_id}/
    {timestamp}-user.jpg      (foto original comprimida)
    {timestamp}-result.jpg    (imagen generada)
```

### Compresion

Se reutiliza `src/lib/imageCompression.ts` existente para comprimir la foto del usuario en el frontend:
- Max 1024px de ancho/alto
- Calidad JPEG 0.7
- La imagen generada por Gemini ya viene comprimida como JPEG/PNG, se almacena tal cual

### Flujo de guardado (frontend)

```typescript
// Despues de obtener resultado exitoso
const timestamp = Date.now();
const userId = user.id;

// 1. Upload foto usuario (ya comprimida)
const userBlob = await compressImage(userPhoto.file);
await supabase.storage
  .from('tryon-results')
  .upload(`${userId}/${timestamp}-user.jpg`, userBlob.blob);

// 2. Upload resultado (convertir base64 a blob)
const resultBlob = base64ToBlob(resultImage);
await supabase.storage
  .from('tryon-results')
  .upload(`${userId}/${timestamp}-result.jpg`, resultBlob);

// 3. Insertar en tryon_history
await supabase.from('tryon_history').insert({
  user_id: userId,
  user_email: user.email,
  user_image_url: `${userId}/${timestamp}-user.jpg`,
  generated_image_url: `${userId}/${timestamp}-result.jpg`,
  category: product.category,
  user_size: selectedSize,
  garment_size: selectedSize,
});
```

### URLs firmadas para el historial

Como el bucket es privado, se generan signed URLs con expiracion de 1 hora:

```typescript
const { data } = await supabase.storage
  .from('tryon-results')
  .createSignedUrl(item.generated_image_url, 3600);
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| SQL Migration | Crear bucket, RLS, agregar `user_email` |
| `src/components/store/TryOnWidget.tsx` | Agregar upload a Storage + insert en tryon_history post-generacion |
| `src/hooks/useTryOnHistory.tsx` | Signed URLs, delete con Storage cleanup |
| `src/components/TryOnHistory.tsx` | Usar signed URLs para mostrar imagenes |

