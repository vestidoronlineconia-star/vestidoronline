// Smart field mapping for product imports
// Maps common alternative field names to our standard schema

export interface RawProductData {
  [key: string]: unknown;
}

export interface MappedProduct {
  name: string;
  image_url: string;
  category: string;
  sku?: string;
  price?: number;
  sizes?: string[];
  is_active?: boolean;
  description?: string;
}

export interface MappingResult {
  products: MappedProduct[];
  errors: string[];
  warnings: string[];
}

// Field mapping configuration
const FIELD_MAPPINGS: Record<keyof MappedProduct, string[]> = {
  name: ['name', 'nombre', 'title', 'titulo', 'producto', 'product_name', 'product'],
  image_url: ['image_url', 'imagen', 'img', 'photo', 'picture', 'url_imagen', 'image', 'foto', 'thumbnail'],
  category: ['category', 'categoria', 'type', 'tipo', 'cat'],
  sku: ['sku', 'codigo', 'code', 'id_producto', 'product_id', 'ref', 'referencia'],
  price: ['price', 'precio', 'cost', 'valor', 'amount', 'monto'],
  sizes: ['sizes', 'talles', 'tallas', 'variantes', 'variants', 'size', 'talle'],
  is_active: ['is_active', 'activo', 'active', 'enabled', 'habilitado', 'visible'],
  description: ['description', 'descripcion', 'desc', 'detalle', 'details'],
};

// Valid categories (should match CATEGORIES in lib/categories.ts)
const VALID_CATEGORIES = [
  'buzo', 'remera', 'camisa', 'vestido', 'falda', 
  'pantalon', 'zapatos', 'abrigo', 'top', 'short'
];

// Category mapping for common alternatives
const CATEGORY_MAPPING: Record<string, string> = {
  'sweater': 'buzo',
  'hoodie': 'buzo',
  'sudadera': 'buzo',
  'tshirt': 'remera',
  't-shirt': 'remera',
  'camiseta': 'remera',
  'shirt': 'camisa',
  'blusa': 'camisa',
  'blouse': 'camisa',
  'dress': 'vestido',
  'skirt': 'falda',
  'pants': 'pantalon',
  'trousers': 'pantalon',
  'jeans': 'pantalon',
  'shoes': 'zapatos',
  'sneakers': 'zapatos',
  'zapatillas': 'zapatos',
  'coat': 'abrigo',
  'jacket': 'abrigo',
  'chaqueta': 'abrigo',
  'campera': 'abrigo',
  'shorts': 'short',
};

function findFieldValue(obj: RawProductData, fieldNames: string[]): unknown {
  const lowerObj: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    lowerObj[key.toLowerCase().trim()] = obj[key];
  }
  
  for (const fieldName of fieldNames) {
    if (lowerObj[fieldName.toLowerCase()] !== undefined) {
      return lowerObj[fieldName.toLowerCase()];
    }
  }
  return undefined;
}

function normalizeCategory(category: string): string | null {
  const lower = category.toLowerCase().trim();
  
  // Check if it's already a valid category
  if (VALID_CATEGORIES.includes(lower)) {
    return lower;
  }
  
  // Try to map to a valid category
  if (CATEGORY_MAPPING[lower]) {
    return CATEGORY_MAPPING[lower];
  }
  
  return null;
}

function parseSizes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    // Try to parse as JSON array first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(Boolean);
      }
    } catch {
      // Not JSON, try splitting by common delimiters
      return value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Remove currency symbols and parse
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return ['true', '1', 'yes', 'si', 'sí', 'activo', 'active'].includes(lower);
  }
  if (typeof value === 'number') return value === 1;
  return true; // Default to active
}

export function mapProductFields(rawProducts: RawProductData[]): MappingResult {
  const products: MappedProduct[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  rawProducts.forEach((raw, index) => {
    const rowNum = index + 1;
    
    // Extract required fields
    const name = findFieldValue(raw, FIELD_MAPPINGS.name);
    const imageUrl = findFieldValue(raw, FIELD_MAPPINGS.image_url);
    const category = findFieldValue(raw, FIELD_MAPPINGS.category);

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push(`Fila ${rowNum}: Campo 'name' es requerido`);
      return;
    }
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      errors.push(`Fila ${rowNum}: Campo 'image_url' es requerido`);
      return;
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      errors.push(`Fila ${rowNum}: Campo 'category' es requerido`);
      return;
    }

    // Normalize category
    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      errors.push(`Fila ${rowNum}: Categoría '${category}' no es válida. Usa: ${VALID_CATEGORIES.join(', ')}`);
      return;
    }

    // Validate image URL format
    try {
      new URL(imageUrl);
    } catch {
      errors.push(`Fila ${rowNum}: URL de imagen no es válida: ${imageUrl}`);
      return;
    }

    // Extract optional fields
    const sku = findFieldValue(raw, FIELD_MAPPINGS.sku);
    const price = findFieldValue(raw, FIELD_MAPPINGS.price);
    const sizes = findFieldValue(raw, FIELD_MAPPINGS.sizes);
    const isActive = findFieldValue(raw, FIELD_MAPPINGS.is_active);
    const description = findFieldValue(raw, FIELD_MAPPINGS.description);

    const product: MappedProduct = {
      name: String(name).trim(),
      image_url: String(imageUrl).trim(),
      category: normalizedCategory,
    };

    if (sku !== undefined) {
      product.sku = String(sku).trim();
    }

    const parsedPrice = parsePrice(price);
    if (parsedPrice !== undefined) {
      product.price = parsedPrice;
    }

    const parsedSizes = parseSizes(sizes);
    if (parsedSizes.length > 0) {
      product.sizes = parsedSizes;
    }

    product.is_active = parseBoolean(isActive);

    if (description !== undefined && typeof description === 'string') {
      product.description = description.trim();
    }

    // Add warning if category was mapped
    if (category.toLowerCase() !== normalizedCategory) {
      warnings.push(`Fila ${rowNum}: Categoría '${category}' mapeada a '${normalizedCategory}'`);
    }

    products.push(product);
  });

  return { products, errors, warnings };
}

export function parseJsonInput(input: string): { data: RawProductData[] | null; error: string | null } {
  try {
    const parsed = JSON.parse(input);
    
    if (Array.isArray(parsed)) {
      return { data: parsed, error: null };
    }
    
    // If it's an object with a products array
    if (parsed.products && Array.isArray(parsed.products)) {
      return { data: parsed.products, error: null };
    }
    
    // If it's a single object, wrap in array
    if (typeof parsed === 'object' && parsed !== null) {
      return { data: [parsed], error: null };
    }
    
    return { data: null, error: 'El JSON debe ser un array de productos o un objeto con la propiedad "products"' };
  } catch (e) {
    return { data: null, error: `JSON inválido: ${e instanceof Error ? e.message : 'Error de sintaxis'}` };
  }
}
