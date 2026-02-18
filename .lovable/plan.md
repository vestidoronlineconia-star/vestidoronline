

# Mejoras al sistema de registro

## Cambios en el formulario de registro (`src/pages/Auth.tsx`)

### 1. Campo de confirmar contrasena
- Agregar un nuevo estado `confirmPassword` y un campo de input que solo aparece en modo registro
- Validar que ambas contrasenas coincidan antes de enviar el formulario
- Mostrar un indicador visual (check verde / X roja) debajo del campo de confirmacion indicando si coinciden

### 2. Mensaje post-registro actualizado
- Cambiar el toast de "Ya puedes iniciar sesion" a "Revisa tu bandeja de entrada para confirmar tu email"
- No cambiar automaticamente a modo login, ya que el usuario debe confirmar primero

### 3. Verificacion por email
- Configurar la autenticacion para que NO auto-confirme los emails (usar la herramienta configure-auth)
- Esto asegura que los usuarios deban hacer clic en el enlace de confirmacion antes de poder iniciar sesion
- Agregar manejo del error "Email not confirmed" en el login para mostrar un mensaje claro

## Detalles tecnicos

**Estado nuevo:**
```
const [confirmPassword, setConfirmPassword] = useState('');
```

**Validacion de coincidencia** antes de llamar a `signUp`:
- Si `password !== confirmPassword`, mostrar toast de error y no continuar

**Campo UI** (solo visible en registro, despues del campo de contrasena y sus requisitos):
- Label: "Confirmar Contrasena"
- Input type password con autoComplete="new-password"
- Indicador visual de coincidencia cuando ambos campos tienen contenido

**Auth config**: Desactivar auto-confirm de email para que se requiera verificacion

**Error handling**: Capturar el mensaje "Email not confirmed" en login y mostrar "Debes confirmar tu email antes de iniciar sesion"

