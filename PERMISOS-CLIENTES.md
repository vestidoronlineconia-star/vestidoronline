# Sistema de Permisos por Cliente

## 📋 Descripción

Sistema de control de acceso granular que permite al administrador asignar usuarios específicos a uno o varios clientes, controlando qué pueden ver y gestionar.

## 🎯 Características Principales

### 1. **Admin puede asignar múltiples clientes a un usuario**
- Al aprobar una solicitud de acceso, el admin puede:
  - **Crear un nuevo cliente** y asignar al usuario con un rol específico
  - **Vincular a uno o varios clientes existentes** con un rol específico

### 2. **Usuarios solo ven sus clientes asignados**
- Los usuarios SOLO pueden ver y trabajar con los clientes que el admin les asignó
- No pueden ver otros clientes del sistema
- La lista de clientes se filtra automáticamente según sus permisos

### 3. **Usuarios NO pueden crear nuevos clientes**
- Solo los **Admins** pueden crear clientes
- Los usuarios asignados NO tienen el botón "Nuevo Cliente"
- Esto evita que proliferen clientes sin control

### 4. **Roles por cliente**
Cada usuario puede tener un rol diferente en cada cliente:
- **Admin**: Gestión completa (equipo, productos, configuración)
- **Editor**: Productos y personalización de marca
- **Viewer**: Solo lectura (analytics, información)

## 🔧 Cómo Funciona

### Flujo de Aprobación de Solicitudes

#### **Opción 1: Crear Nuevo Cliente**

```
Usuario solicita acceso
      ↓
Admin revisa solicitud
      ↓
Admin selecciona "Crear nuevo cliente"
      ↓
Admin configura:
  - Nombre del cliente
  - Slug único
  - Dominios permitidos
  - ROL del usuario (admin/editor/viewer)
      ↓
Sistema crea el cliente (con admin como owner)
      ↓
Sistema asigna al usuario como miembro del equipo
      ↓
Usuario accede al portal y ve SOLO ese cliente
```

**Importante**: El cliente se crea con el **admin como owner** (en `embed_clients.user_id`), y el usuario se agrega como **team member** (en `client_team_members`). Esto impide que el usuario pueda crear más clientes.

#### **Opción 2: Vincular a Cliente(s) Existente(s)**

```
Usuario solicita acceso
      ↓
Admin revisa solicitud
      ↓
Admin selecciona "Vincular a existente"
      ↓
Admin selecciona UNO O VARIOS clientes (checkboxes)
      ↓
Admin selecciona ROL único para todos
      ↓
Sistema vincula al usuario a todos los clientes seleccionados
      ↓
Usuario accede al portal y ve TODOS los clientes asignados
```

### Estructura de Base de Datos

#### Tabla `embed_clients`
- **user_id**: ID del **admin/owner** que creó el cliente
- Solo los admin owners pueden crear nuevos clientes

#### Tabla `client_team_members`
- **client_id**: ID del cliente
- **user_id**: ID del usuario asignado
- **role**: Rol del usuario ('admin', 'editor', 'viewer')
- **accepted_at**: Fecha de aceptación (auto-aceptado por el admin)

#### Tabla `user_roles`
- **user_id**: ID del usuario
- **role**: Rol global ('admin', 'client', 'user')

### Lógica de Permisos

```typescript
// En useUserRole.tsx
const canCreateClients = isAdmin || isClientOwner;

// isClientOwner = true si el usuario tiene registros en embed_clients.user_id
// Por lo tanto, si el usuario solo está en client_team_members, NO puede crear clientes
```

## 📊 Casos de Uso

### Caso 1: Agencia con múltiples clientes

**Escenario**: Una agencia gestiona 10 tiendas online

**Solución**:
1. Admin crea los 10 clientes desde el portal
2. Admin contrata a un diseñador
3. Diseñador solicita acceso
4. Admin aprueba y le asigna **5 de los 10 clientes** con rol "Editor"
5. Diseñador entra al portal y solo ve esos 5 clientes
6. Diseñador puede editar productos y branding, pero NO:
   - Crear nuevos clientes
   - Gestionar el equipo
   - Ver los otros 5 clientes

### Caso 2: Cliente individual con empleados

**Escenario**: Una tienda quiere que varios empleados gestionen su probador virtual

**Solución**:
1. Dueño de tienda solicita acceso
2. Admin aprueba y crea el cliente "Mi Tienda"
3. Admin asigna al dueño como **Admin** de ese cliente
4. Dueño contrata empleados
5. Empleados solicitan acceso
6. Admin vincula a los empleados a "Mi Tienda" con rol **Viewer**
7. Empleados solo ven ese cliente y solo pueden ver analytics

### Caso 3: Freelancer temporal

**Escenario**: Contratas a un freelancer para configurar productos en 3 clientes

**Solución**:
1. Freelancer solicita acceso
2. Admin vincula al freelancer a 3 clientes específicos con rol **Editor**
3. Freelancer configura productos
4. Admin elimina al freelancer de `client_team_members` cuando termina el trabajo
5. Freelancer pierde acceso instantáneamente

## 🛡️ Seguridad

### Lo que los usuarios NO pueden hacer:
- ❌ Ver clientes que no les fueron asignados
- ❌ Crear nuevos clientes
- ❌ Cambiar su propio rol
- ❌ Ver otros miembros del equipo (según el rol)
- ❌ Eliminar el cliente

### Lo que el admin SÍ puede hacer:
- ✅ Crear cualquier cantidad de clientes
- ✅ Asignar/remover usuarios a clientes
- ✅ Cambiar roles de usuarios
- ✅ Ver y gestionar todos los clientes
- ✅ Eliminar clientes y usuarios

## 🎨 UI/UX

### Portal para Usuarios con Acceso Limitado

**Header**:
```
Portal de Clientes
Gestiona tus tiendas virtuales
[NO HAY BOTÓN "Nuevo Cliente"]
```

**Lista de clientes**:
- Solo muestra clientes asignados
- Cada card muestra el rol del usuario
- Iconos diferentes según el rol:
  - 👑 Owner (solo si es admin)
  - 🛡️ Admin
  - ✏️ Editor
  - 👁️ Viewer

**Empty State** (sin clientes asignados):
```
No tienes clientes asignados
El administrador debe asignarte acceso a uno o más clientes
para que puedas gestionarlos desde aquí.
```

### Portal para Admins

**Header**:
```
Portal de Clientes
Gestiona tus tiendas virtuales
[BOTÓN: + Nuevo Cliente]
```

**Lista de clientes**:
- Muestra TODOS los clientes del sistema
- Badge: "Owner" en los que el admin creó

## 🔄 Flujo Completo de Ejemplo

```
1. Juan (Admin) crea 3 clientes:
   - cliente-a (vestidoronline.com)
   - cliente-b (fashionstore.com)
   - cliente-c (trendy.com)

2. María solicita acceso al portal

3. Juan revisa la solicitud y decide:
   - Opción A: Vincular a cliente-a y cliente-b como "Editor"
   - Opción B: Crear cliente-d y asignar a María como "Admin"

   Juan elige Opción A

4. Sistema ejecuta:
   INSERT INTO client_team_members VALUES
     (cliente-a, maria_id, 'editor', NOW()),
     (cliente-b, maria_id, 'editor', NOW());

   INSERT INTO user_roles VALUES (maria_id, 'client');

   UPDATE access_requests SET status='approved' WHERE id=maria_request_id;

5. María entra al portal:
   - Ve 2 clientes: cliente-a y cliente-b
   - NO ve cliente-c (no asignado)
   - NO puede crear nuevos clientes
   - Puede editar productos en ambos

6. Pedro solicita acceso

7. Juan crea nuevo cliente "cliente-e" y lo asigna a Pedro como "Viewer"

8. Pedro entra al portal:
   - Ve 1 cliente: cliente-e
   - Solo puede ver analytics
   - No puede editar nada
```

## 📝 Notas Técnicas

### Queries Importantes

**Obtener clientes de un usuario**:
```sql
-- Clientes donde es owner
SELECT * FROM embed_clients WHERE user_id = $1;

-- Clientes donde es team member
SELECT ec.* FROM embed_clients ec
JOIN client_team_members ctm ON ec.id = ctm.client_id
WHERE ctm.user_id = $1 AND ctm.accepted_at IS NOT NULL;
```

**Verificar si puede crear clientes**:
```sql
-- Si tiene algún cliente como owner, puede crear más
SELECT COUNT(*) > 0 as can_create
FROM embed_clients
WHERE user_id = $1;

-- O si es admin
SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin';
```

### Migraciones Futuras

Si necesitas cambiar el sistema:

1. **Permitir que algunos usuarios creen clientes**:
   - Agregar campo `can_create_clients` en `user_roles`
   - Actualizar `useUserRole` para checkear ese campo

2. **Roles más granulares**:
   - Agregar más roles como 'analyst', 'developer', 'support'
   - Crear tabla `role_permissions` para definir qué puede hacer cada rol

3. **Límites por usuario**:
   - Agregar campo `max_clients` en `user_roles`
   - Validar en el backend antes de asignar más clientes

## 🚀 Deployment

No requiere migraciones de base de datos - el sistema usa las tablas existentes:
- `embed_clients`
- `client_team_members`
- `user_roles`
- `access_requests`

Solo necesitas desplegar el código actualizado.

## ✅ Testing

### Escenarios a probar:

1. **Usuario nuevo solicita acceso**
   - ✓ Admin puede crear cliente nuevo
   - ✓ Admin puede vincular a cliente(s) existente(s)
   - ✓ Usuario recibe acceso correcto

2. **Usuario con acceso limitado**
   - ✓ Solo ve clientes asignados
   - ✓ No ve botón "Nuevo Cliente"
   - ✓ Empty state correcto si no tiene clientes

3. **Usuario puede trabajar en su cliente**
   - ✓ Admin puede gestionar todo
   - ✓ Editor puede editar productos
   - ✓ Viewer solo puede ver

4. **Admin puede gestionar múltiples usuarios**
   - ✓ Asignar mismo cliente a varios usuarios
   - ✓ Asignar varios clientes a un usuario
   - ✓ Cambiar roles
   - ✓ Remover accesos

## 📞 Soporte

Si un usuario reporta que no ve sus clientes:
1. Verificar que su `access_request` esté `approved`
2. Verificar que tenga registros en `client_team_members`
3. Verificar que `accepted_at` no sea NULL
4. Verificar que el `client_id` exista en `embed_clients`
5. Verificar que tenga rol 'client' en `user_roles`
