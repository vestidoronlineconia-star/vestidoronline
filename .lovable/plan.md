

# Plan: Sistema de Importación Multi-Canal para Productos

## Objetivo

Crear un sistema de importación de productos que ofrezca **múltiples opciones** según el nivel técnico del cliente:
1. **CSV** (actual) - Para usuarios básicos
2. **JSON/SQL Directo** - Para usuarios técnicos con base de datos
3. **API REST** - Para sincronización automática desde sistemas externos
4. **URL Externa** - Importar desde un endpoint JSON público

---

## Arquitectura del Sistema

```text
                    ┌────────────────────────────────────────┐
                    │         PORTAL DE IMPORTACIÓN          │
                    │       (Modal con pestañas/tabs)        │
                    └────────────────────────────────────────┘
                                       │
           ┌───────────────┬───────────┼───────────┬──────────────┐
           ▼               ▼           ▼           ▼              ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │    CSV      │ │    JSON     │ │  API REST   │ │ URL Externa │
    │  (archivo)  │ │  (pegar)    │ │ (endpoint)  │ │  (fetch)    │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │               │
           └───────────────┴───────────────┴───────────────┘
                                   │
                                   ▼
                    ┌────────────────────────────────────────┐
                    │        PREVIEW / VALIDACIÓN            │
                    │   - Tabla con productos parseados      │
                    │   - Errores y advertencias             │
                    │   - Mapeo de columnas                  │
                    └────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌────────────────────────────────────────┐
                    │          BASE DE DATOS                 │
                    │        client_products                 │
                    └────────────────────────────────────────┘
```

---

## Opciones de Importación

### Opcion 1: CSV (Ya existe - Mejoras)
- Mantener funcionalidad actual
- Agregar preview visual de productos antes de importar
- Mejorar manejo de errores

### Opcion 2: JSON Directo
Para clientes técnicos que exportan desde su base de datos:

```json
[
  {
    "name": "Remera Básica",
    "sku": "REM-001",
    "image_url": "https://cdn.tienda.com/remera.jpg",
    "category": "remera",
    "sizes": ["S", "M", "L", "XL"],
    "price": 2500
  }
]
```

El cliente puede pegar este JSON directamente en un textarea.

### Opcion 3: API REST Endpoint
Crear un endpoint que sistemas externos pueden llamar:

```text
POST /functions/v1/import-products
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "client_id": "uuid-del-cliente",
  "products": [...]
}
```

El cliente puede automatizar la sincronización desde su sistema.

### Opcion 4: URL Externa (Fetch)
El cliente proporciona una URL que devuelve JSON con sus productos:

```text
https://mi-tienda.com/api/productos.json
```

El sistema hace fetch y parsea los productos automáticamente.

---

## Componentes a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/products/ProductImporter.tsx` | **Modificar** | Convertir a sistema multi-tab con todas las opciones |
| `src/components/products/ImportPreview.tsx` | **Crear** | Componente de preview visual antes de confirmar |
| `src/components/products/JsonImporter.tsx` | **Crear** | Tab para pegar JSON directo |
| `src/components/products/UrlImporter.tsx` | **Crear** | Tab para importar desde URL |
| `supabase/functions/import-products/index.ts` | **Crear** | Edge function para API REST |
| `src/pages/ClientPortalDocs.tsx` | **Modificar** | Agregar documentacion de la API de importacion |

---

## UI del Nuevo Importador

El modal tendrá 4 pestañas:

| Tab | Icono | Para quien |
|-----|-------|------------|
| CSV | FileSpreadsheet | Usuarios que exportan desde Excel/Sheets |
| JSON | Code | Desarrolladores con acceso a base de datos |
| API | Zap | Sistemas automatizados (Tienda Nube, etc.) |
| URL | Link | Clientes con endpoint JSON público |

---

## Flujo de Cada Opcion

### CSV
1. Descargar plantilla
2. Subir archivo
3. Ver preview con productos parseados
4. Confirmar importacion

### JSON
1. Pegar JSON en textarea
2. Validacion en tiempo real
3. Ver preview con productos parseados
4. Confirmar importacion

### API
1. Ver API Key del cliente
2. Copiar ejemplo de request
3. El cliente hace POST desde su sistema
4. Los productos se agregan automaticamente

### URL Externa
1. Ingresar URL del endpoint JSON
2. El sistema hace fetch y muestra preview
3. Mapear campos si es necesario
4. Confirmar importacion

---

## Edge Function: import-products

```typescript
// supabase/functions/import-products/index.ts
// Acepta POST con productos y API_KEY
// Valida API_KEY contra embed_clients
// Inserta productos en client_products
```

---

## Mapeo de Campos Inteligente

Para manejar diferentes formatos de JSON, el sistema intentara mapear campos automaticamente:

| Campo Esperado | Alternativas Aceptadas |
|----------------|------------------------|
| `name` | `nombre`, `title`, `producto`, `product_name` |
| `image_url` | `imagen`, `img`, `photo`, `picture`, `url_imagen` |
| `category` | `categoria`, `type`, `tipo` |
| `price` | `precio`, `cost`, `valor` |
| `sku` | `codigo`, `code`, `id_producto` |
| `sizes` | `talles`, `tallas`, `variantes` |

---

## Secuencia de Implementacion

1. Crear componentes nuevos (ImportPreview, JsonImporter, UrlImporter)
2. Refactorizar ProductImporter a sistema de tabs
3. Crear edge function import-products
4. Agregar documentacion de API en ClientPortalDocs
5. Agregar manejo de mapeo de campos

---

## Seccion Tecnica

### Estructura de Base de Datos (sin cambios)
La tabla `client_products` ya soporta todos los campos necesarios:
- `name`, `sku`, `image_url`, `category`, `sizes`, `price`, `is_active`

### RLS
La edge function usara service_role para insertar productos, validando la API_KEY del cliente.

### Validaciones
- Imagen URL valida y accesible
- Categoria dentro de las permitidas
- SKU unico por cliente (opcional)

