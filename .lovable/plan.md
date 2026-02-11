

# Plan: Mostrar mensaje de inicio de sesion para usuarios no autenticados en tiendas

## Problema

Despues de la correccion de seguridad reciente, se elimino la politica publica de SELECT en `embed_clients`. Esto causa que usuarios no autenticados no puedan cargar ninguna tienda (`/tienda/santiago`), mostrando "Tienda no encontrada" en vez de un mensaje util.

## Solucion

Modificar `ClientStore.tsx` para detectar cuando el usuario no esta autenticado y mostrar un cartel invitandolo a iniciar sesion o registrarse, con un boton que lo lleve a `/auth`.

## Cambios

### Archivo: `src/pages/ClientStore.tsx`

1. Importar `useAuth` y componentes necesarios (`Link` de react-router-dom, icono `LogIn`).

2. Obtener `{ user, loading: authLoading }` de `useAuth()`.

3. Agregar una condicion antes del error de "Tienda no encontrada": si el usuario no esta autenticado y hubo error al cargar la tienda, mostrar un cartel con:
   - Icono de login
   - Titulo: "Inicia sesion para continuar"
   - Descripcion: "Necesitas una cuenta para acceder a esta tienda"
   - Boton "Iniciar sesion" que navega a `/auth`
   - Link "Crear cuenta" debajo

El bloque de error existente (lineas ~56-66) se modifica para agregar esta comprobacion:

```text
if (!user && (error || !clientConfig)) {
  -> Mostrar cartel de login/registro
} else if (error || !clientConfig) {
  -> Mostrar "Tienda no encontrada" (caso de usuario logueado sin acceso)
}
```

### Detalle tecnico

```typescript
// Nuevo bloque antes del error existente
if (!authLoading && !user && (error || !clientConfig)) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center p-8">
        <LogIn className="w-16 h-16 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Inicia sesion para continuar</h1>
        <p className="text-muted-foreground mb-6">
          Necesitas una cuenta para acceder a esta tienda.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/auth">Iniciar sesion</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            No tenes cuenta?{' '}
            <Link to="/auth" className="text-primary underline">
              Registrate
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/ClientStore.tsx` | Importar `useAuth`, `Link`, `LogIn`. Agregar bloque condicional que muestra cartel de login cuando el usuario no esta autenticado |

