
## Plan: Auto-completar "https://" en URL del Sitio Web

### Problema Actual

Cuando el usuario ingresa su sitio web en el formulario de solicitud de acceso:
- El campo tiene `type="url"` que requiere que la URL incluya el protocolo (`https://`)
- Si el usuario escribe solo `mitienda.com`, el navegador marca el campo como inválido
- No hay normalización automática de la URL

---

### Solución

Crear una función que normalice la URL automáticamente antes de enviarla, agregando `https://` si el usuario no lo especifica.

---

### Cambios en `src/components/portal/AccessRequestForm.tsx`

1. **Cambiar el tipo del input** de `url` a `text` para evitar validación estricta del navegador

2. **Crear función de normalización**:
   ```typescript
   const normalizeUrl = (url: string): string => {
     const trimmed = url.trim();
     if (!trimmed) return '';
     
     // Si ya tiene protocolo, devolverla tal cual
     if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
       return trimmed;
     }
     
     // Si no tiene protocolo, agregar https://
     return `https://${trimmed}`;
   };
   ```

3. **Aplicar normalización en el submit**:
   ```typescript
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!formData.company_name.trim()) return;

     const success = await submitRequest({
       company_name: formData.company_name.trim(),
       website_url: normalizeUrl(formData.website_url) || undefined,  // ← Normalizar aquí
       message: formData.message.trim() || undefined,
     });
     // ...
   };
   ```

4. **Actualizar placeholder** para indicar que no es necesario el protocolo:
   ```typescript
   placeholder="mitienda.com"  // En lugar de "https://mitienda.com"
   ```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/portal/AccessRequestForm.tsx` | Agregar función `normalizeUrl`, cambiar tipo de input a `text`, actualizar placeholder |

---

### Resultado Esperado

| El usuario escribe | Se envía como |
|-------------------|---------------|
| `mitienda.com` | `https://mitienda.com` |
| `www.mitienda.com` | `https://www.mitienda.com` |
| `https://mitienda.com` | `https://mitienda.com` |
| `http://mitienda.com` | `http://mitienda.com` |
| *(vacío)* | `undefined` |
