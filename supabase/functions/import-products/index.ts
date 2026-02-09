import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Field mapping for flexible imports
const FIELD_MAPPINGS: Record<string, string[]> = {
  name: ["name", "nombre", "title", "titulo", "producto", "product_name"],
  image_url: ["image_url", "imagen", "img", "photo", "picture", "url_imagen", "image"],
  category: ["category", "categoria", "type", "tipo"],
  sku: ["sku", "codigo", "code", "id_producto", "product_id"],
  price: ["price", "precio", "cost", "valor"],
  sizes: ["sizes", "talles", "tallas", "variantes", "variants"],
  is_active: ["is_active", "activo", "active", "enabled"],
  description: ["description", "descripcion", "desc"],
};

const VALID_CATEGORIES = [
  "buzo", "remera", "camisa", "vestido", "falda",
  "pantalon", "zapatos", "abrigo", "top", "short"
];

const CATEGORY_MAPPING: Record<string, string> = {
  sweater: "buzo",
  hoodie: "buzo",
  sudadera: "buzo",
  tshirt: "remera",
  "t-shirt": "remera",
  camiseta: "remera",
  shirt: "camisa",
  blusa: "camisa",
  dress: "vestido",
  skirt: "falda",
  pants: "pantalon",
  trousers: "pantalon",
  jeans: "pantalon",
  shoes: "zapatos",
  sneakers: "zapatos",
  zapatillas: "zapatos",
  coat: "abrigo",
  jacket: "abrigo",
  chaqueta: "abrigo",
  campera: "abrigo",
  shorts: "short",
};

interface RawProduct {
  [key: string]: unknown;
}

interface MappedProduct {
  name: string;
  image_url: string;
  category: string;
  sku?: string;
  price?: number;
  sizes?: string[];
  is_active?: boolean;
  description?: string;
}

function findFieldValue(obj: RawProduct, fieldNames: string[]): unknown {
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
  if (VALID_CATEGORIES.includes(lower)) return lower;
  if (CATEGORY_MAPPING[lower]) return CATEGORY_MAPPING[lower];
  return null;
}

function parseSizes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      return value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return ["true", "1", "yes", "si", "sí", "activo", "active"].includes(lower);
  }
  if (typeof value === "number") return value === 1;
  return true;
}

function mapProduct(raw: RawProduct): { product: MappedProduct | null; error: string | null } {
  const name = findFieldValue(raw, FIELD_MAPPINGS.name);
  const imageUrl = findFieldValue(raw, FIELD_MAPPINGS.image_url);
  const category = findFieldValue(raw, FIELD_MAPPINGS.category);

  if (!name || typeof name !== "string" || !name.trim()) {
    return { product: null, error: "Campo 'name' es requerido" };
  }
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
    return { product: null, error: "Campo 'image_url' es requerido" };
  }
  if (!category || typeof category !== "string" || !category.trim()) {
    return { product: null, error: "Campo 'category' es requerido" };
  }

  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) {
    return { product: null, error: `Categoría '${category}' no es válida` };
  }

  try {
    new URL(imageUrl);
  } catch {
    return { product: null, error: `URL de imagen no es válida: ${imageUrl}` };
  }

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

  if (sku !== undefined) product.sku = String(sku).trim();
  const parsedPrice = parsePrice(price);
  if (parsedPrice !== undefined) product.price = parsedPrice;
  const parsedSizes = parseSizes(sizes);
  if (parsedSizes.length > 0) product.sizes = parsedSizes;
  product.is_active = parseBoolean(isActive);
  if (description !== undefined && typeof description === "string") {
    product.description = description.trim();
  }

  return { product, error: null };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get API key from Authorization header or X-API-Key header
    const authHeader = req.headers.get("Authorization");
    const xApiKey = req.headers.get("X-API-Key");
    
    let apiKey: string | null = null;
    
    if (xApiKey) {
      apiKey = xApiKey.trim();
    } else if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.replace("Bearer ", "").trim();
    }
    
    console.log("Received API key:", apiKey);
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key required in Authorization header (Bearer token) or X-API-Key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key and get client
    const { data: clients, error: clientError } = await supabase
      .from("embed_clients")
      .select("id, is_active")
      .eq("api_key", apiKey);

    console.log("Client lookup result:", { clients, error: clientError?.message });
    
    const client = clients?.[0];

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: "Invalid API key", details: clientError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!client.is_active) {
      return new Response(
        JSON.stringify({ error: "Client is inactive" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const products: RawProduct[] = body.products || body;

    if (!Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: "Request body must be an array or contain 'products' array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (products.length === 0) {
      return new Response(
        JSON.stringify({ error: "No products provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size
    if (products.length > 500) {
      return new Response(
        JSON.stringify({ error: "Maximum 500 products per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validProducts: MappedProduct[] = [];
    const errors: string[] = [];
    let updated = 0;

    // Map and validate products
    for (let i = 0; i < products.length; i++) {
      const { product, error } = mapProduct(products[i]);
      if (error) {
        errors.push(`Producto ${i + 1}: ${error}`);
      } else if (product) {
        validProducts.push(product);
      }
    }

    if (validProducts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, imported: 0, updated: 0, errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing products by SKU to update them
    const skus = validProducts.filter(p => p.sku).map(p => p.sku!);
    let existingProducts: Record<string, string> = {};

    if (skus.length > 0) {
      const { data: existing } = await supabase
        .from("client_products")
        .select("id, sku")
        .eq("client_id", client.id)
        .in("sku", skus);

      if (existing) {
        existingProducts = Object.fromEntries(existing.map(p => [p.sku, p.id]));
      }
    }

    const toInsert: (MappedProduct & { client_id: string })[] = [];
    const toUpdate: { id: string; data: MappedProduct }[] = [];

    for (const product of validProducts) {
      if (product.sku && existingProducts[product.sku]) {
        toUpdate.push({ id: existingProducts[product.sku], data: product });
      } else {
        toInsert.push({ ...product, client_id: client.id });
      }
    }

    // Insert new products
    let inserted = 0;
    if (toInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("client_products")
        .insert(toInsert)
        .select();

      if (insertError) {
        errors.push(`Error inserting products: ${insertError.message}`);
      } else {
        inserted = insertedData?.length || 0;
      }
    }

    // Update existing products
    for (const { id, data } of toUpdate) {
      const { error: updateError } = await supabase
        .from("client_products")
        .update(data)
        .eq("id", id);

      if (updateError) {
        errors.push(`Error updating product ${data.sku}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: inserted,
        updated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in import-products:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
