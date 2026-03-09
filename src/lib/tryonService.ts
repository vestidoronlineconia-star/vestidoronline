/**
 * Virtual Try-On Service
 *
 * In production: calls the Supabase Edge Function `virtual-tryon`.
 * In development: calls the Google Gemini API directly from the browser,
 * bypassing the Edge Function that isn't deployed in dev.
 *
 * Required env var for dev: VITE_GOOGLE_API_KEY
 */

import { supabase } from '@/integrations/supabase/client';

const isDev = import.meta.env.DEV;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

interface TryonResult {
  data: Record<string, unknown> | null;
  error: Error | null;
}

/**
 * Call the virtual-tryon service (Edge Function in prod, Gemini direct in dev).
 */
export async function invokeTryon(body: Record<string, unknown>): Promise<TryonResult> {
  if (isDev && GOOGLE_API_KEY) {
    return callGeminiDirect(body);
  }
  // Production path — use Edge Function
  const { data, error } = await supabase.functions.invoke('virtual-tryon', { body });
  return { data, error };
}

// ─── Direct Gemini calls for dev ──────────────────────────────────────────────

async function callGeminiDirect(body: Record<string, unknown>): Promise<TryonResult> {
  const { action } = body;
  try {
    switch (action) {
      case 'analyze':
        return await handleAnalyze(body);
      case 'generate':
        return await handleGenerate(body);
      case 'generate360':
        return await handleGenerate360(body);
      default:
        return { data: { error: 'Invalid action' }, error: null };
    }
  } catch (e) {
    console.error('[tryonService] Error en acción', action, ':', e);
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

async function geminiRequest(
  model: string,
  contents: unknown[],
  config?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(config ? { generationConfig: config } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[tryonService] Gemini API error ${res.status} for ${model}:`, text.slice(0, 500));
    if (res.status === 429) throw Object.assign(new Error('rate_limit'), { name: 'rate_limit' });
    if (res.status === 403) throw Object.assign(new Error('invalid_api_key'), { name: 'invalid_api_key' });
    throw new Error(`Gemini API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  console.log(`[tryonService] Gemini ${model} response OK, candidates:`, json.candidates?.length ?? 0);
  return json;
}

// ── Analyze ────────────────────────────────────────────────────────────────────

async function handleAnalyze(body: Record<string, unknown>): Promise<TryonResult> {
  const { userImage, clothImage, category } = body as {
    userImage: string; clothImage: string; category: string;
  };

  const categoryLabel = category?.toUpperCase() || 'PRENDA';
  const visionPrompt = buildAnalyzePrompt(categoryLabel);

  const startTime = Date.now();
  const data = await geminiRequest('gemini-2.5-flash', [{
    role: 'user',
    parts: [
      { text: visionPrompt },
      { inlineData: { mimeType: 'image/jpeg', data: userImage } },
      { inlineData: { mimeType: 'image/jpeg', data: clothImage } },
    ],
  }]);

  const content = (data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse analysis');

  const analysis = JSON.parse(jsonMatch[0]);
  return {
    data: {
      analysis,
      debug: { prompt: visionPrompt.trim(), rawResponse: content, model: 'gemini-2.5-flash', duration: Date.now() - startTime },
    },
    error: null,
  };
}

// ── Generate ───────────────────────────────────────────────────────────────────

async function handleGenerate(body: Record<string, unknown>): Promise<TryonResult> {
  const { userImage, clothImage, category, analysis, userSize, garmentSize } = body as {
    userImage: string; clothImage: string; category: string;
    analysis: any; userSize: string; garmentSize: string;
  };

  const finalPrompt = buildGeneratePrompt(category, analysis, userSize, garmentSize);

  const startTime = Date.now();
  const data = await geminiRequest(
    'gemini-3-pro-image-preview',
    [{
      role: 'user',
      parts: [
        { text: finalPrompt },
        { inlineData: { mimeType: 'image/jpeg', data: userImage } },
        { inlineData: { mimeType: 'image/jpeg', data: clothImage } },
      ],
    }],
    { responseModalities: ['TEXT', 'IMAGE'] },
  );

  const parts = (data as any).candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData);

  if (!imagePart?.inlineData) throw new Error('No image generated');

  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  const image = `data:${mimeType};base64,${imagePart.inlineData.data}`;

  return {
    data: {
      image,
      debug: { prompt: finalPrompt.trim(), model: 'gemini-3-pro-image-preview', duration: Date.now() - startTime, userSize, garmentSize, category },
    },
    error: null,
  };
}

// ── Generate 360 ───────────────────────────────────────────────────────────────

async function handleGenerate360(body: Record<string, unknown>): Promise<TryonResult> {
  const { generatedImage, category, analysis } = body as {
    generatedImage: string; category: string; analysis: any;
  };

  const prompt = buildGenerate360Prompt(category, analysis);
  const imageData = (generatedImage as string).replace(/^data:image\/[^;]+;base64,/, '');

  const startTime = Date.now();
  const data = await geminiRequest(
    'gemini-3-pro-image-preview',
    [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: imageData } },
      ],
    }],
    { responseModalities: ['TEXT', 'IMAGE'] },
  );

  let generated360Image: string | null = null;
  for (const candidate of ((data as any).candidates || [])) {
    for (const part of (candidate.content?.parts || [])) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        generated360Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    if (generated360Image) break;
  }

  if (!generated360Image) throw new Error('No image generated for 360 view');

  return {
    data: {
      image: generated360Image,
      debug: { prompt, model: 'gemini-3-pro-image-preview', duration: Date.now() - startTime, category },
    },
    error: null,
  };
}

// ─── Prompt builders (mirrored from Edge Function) ─────────────────────────────

function buildAnalyzePrompt(categoryLabel: string): string {
  return `
Eres un analista experto de moda y prendas de vestir. Tu tarea es analizar 2 imágenes para un sistema de Virtual Try-On.

⚠️ REGLA DE COLORES ESTRICTA (APLICA A TODO EL ANÁLISIS):
- SOLO reporta colores que REALMENTE EXISTEN y puedas ver claramente en la imagen
- NO inventes colores que no veas con 100% de certeza
- IGNORA sombras, reflejos de luz, artefactos de compresión JPEG, y gradientes de iluminación
- Si el borde de un estampado parece de otro color pero es efecto de la imagen (anti-aliasing, compresión), NO lo reportes
- Si hay duda sobre si un color existe o es artefacto visual, NO lo incluyas
- Presta especial atención a los bordes de textos/logos - los "halos" o colores de borde suelen ser artefactos

📷 IMAGEN 1 - PERSONA (Usuario):
Analiza:
- Género aparente (hombre/mujer/no binario)
- Pose corporal (frontal, perfil, 3/4, sentado, parado)
- Tipo de iluminación (natural, estudio, cálida, fría, dura, suave)
- Fondo/escenario (descripción breve)
- Contextura corporal (delgado, promedio, robusto)
- Volumen abdominal (plano, leve, pronunciado)
- ENCUADRE Y COMPOSICIÓN (CRÍTICO):
  * Tipo de plano (cuerpo completo, plano medio/cintura arriba, plano americano/3/4, primer plano)
  * Distancia de cámara (cercana, media, lejana)
  * Composición (centrado, descentrado izquierda/derecha)
  * Orientación (vertical, horizontal, cuadrada)
- ROSTRO (CRÍTICO): Describe detalladamente:
  * Color y forma de ojos
  * Forma de cejas
  * Nariz (forma general)
  * Boca/labios
  * Barba/bigote si tiene (color, estilo, largo)
  * Pecas, lunares, marcas visibles
  * Tono de piel
- Expresión facial (sonrisa, serio, neutral, etc.)
- Cabello (color exacto, largo, estilo, peinado, textura)
- Accesorios faciales (lentes/gafas, aretes, piercings, maquillaje notable)

📷 IMAGEN 2 - PRENDA:
⚠️ CRÍTICO: El usuario indicó que la prenda es: **${categoryLabel}**
BUSCA EXCLUSIVAMENTE esa prenda en la imagen. IGNORA completamente:
- Otras prendas que puedan aparecer
- La persona si la hay (solo extrae datos de LA PRENDA)
- Accesorios que no sean la prenda indicada

Analiza EN DETALLE la prenda ${categoryLabel}:
1. TIPO: Confirma que es ${categoryLabel} y especifica el estilo exacto

2. ⚠️ COLORES (ANÁLISIS ESTRICTO - NO INVENTAR):
   a) COLOR BASE DE LA TELA: El color del material/tela SIN contar estampados
   b) COLORES DEL ESTAMPADO/GRÁFICO: SOLO si tiene, lista ÚNICAMENTE colores con 100% certeza
      - NO incluyas colores de bordes/contornos dudosos
      - NO incluyas sombras o gradientes de compresión
   c) COLORES DEL LOGO/TEXTO: Si tiene texto/logo, lista SOLO los colores reales
      - Color del relleno del texto
      - Color del contorno SOLO SI claramente existe como parte del diseño
   d) CONTEO TOTAL: Número exacto de colores distintos en toda la prenda

3. MATERIAL: Tipo de tela/material
4. TEXTURA: Lisa, rugosa, brillante, mate, afelpada, satinada, etc.

5. LOGOS/TEXTOS: ¿Tiene logos, marcas, textos impresos o bordados?
   - Texto exacto (qué dice literalmente)
   - Color principal del texto (SOLO el color real del relleno)
   - ¿Tiene contorno visible real? (no artefacto)
   - Ángulo/orientación, tamaño, posición exacta

6. ESTAMPADOS/PATRONES: ¿Tiene patrones, gráficos, estampados?
   - Descripción precisa
   - ⚠️ COLORES: SOLO colores 100% confirmados, NO bordes dudosos

7. DETALLES ESPECIALES: Costuras, cremalleras, botones, bordados, parches, bolsillos
8. ACABADOS: Tipo de lavado, desgaste, cortes, flecos

Responde ÚNICAMENTE con este JSON válido:
{
  "user_analysis": {
    "gender": "...",
    "pose": "...",
    "lighting": "...",
    "background": "...",
    "body_type": "...",
    "abdominal_volume": "...",
    "facial_features": "descripción detallada del rostro",
    "expression": "...",
    "hair": "descripción del cabello",
    "facial_accessories": "lentes, aretes, etc. o ninguno",
    "framing": "cuerpo completo/plano medio/plano americano/primer plano",
    "camera_distance": "cercana/media/lejana",
    "composition": "centrado/descentrado izquierda/descentrado derecha",
    "orientation": "vertical/horizontal/cuadrada"
  },
  "cloth_analysis": {
    "type": "${categoryLabel}",
    "style": "...",
    "colors": {
      "base_fabric": "color exacto de la tela base",
      "print_colors": ["colores del estampado 100% confirmados"],
      "logo_text_colors": {
        "fill": "color del relleno del texto/logo",
        "outline": "color del contorno SOLO si realmente existe, null si no"
      },
      "total_distinct_colors": "número entero"
    },
    "material": "...",
    "texture": "...",
    "logos_texts": {
      "has_logos": true,
      "exact_text": "...",
      "description": "...",
      "has_real_outline": true,
      "angle": "horizontal/diagonal/vertical/curvo",
      "size": "pequeño/mediano/grande",
      "position": "..."
    },
    "patterns": {
      "has_patterns": true,
      "description": "..."
    },
    "special_details": ["..."],
    "finishing": "..."
  }
}
`;
}

function buildGeneratePrompt(category: string, analysis: any, userSize: string, garmentSize: string): string {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const userIndex = sizes.indexOf(userSize || 'M');
  const garmentIndex = sizes.indexOf(garmentSize || 'M');
  const sizeDiff = garmentIndex - userIndex;

  let fitDescription = '';
  let fitInstructions = '';

  if (sizeDiff <= -2) {
    fitDescription = 'MUY AJUSTADO - la prenda es demasiado pequeña';
    fitInstructions = 'Show fabric stretching visibly. Seams under tension. Fabric pulling at stress points. May not close completely. Uncomfortable tight appearance.';
  } else if (sizeDiff === -1) {
    fitDescription = 'AJUSTADO - ceñido al cuerpo';
    fitInstructions = 'Show fitted, body-hugging silhouette. Fabric follows body contours closely. Slightly stretched but not uncomfortable.';
  } else if (sizeDiff === 0) {
    fitDescription = 'IDEAL - calce regular';
    fitInstructions = 'Show comfortable standard fit. Natural drape. Appropriate room for movement. Not too tight, not too loose.';
  } else if (sizeDiff === 1) {
    fitDescription = 'HOLGADO - corte relajado';
    fitInstructions = 'Show relaxed fit with extra room. Some fabric bunching. Looser silhouette. Comfortable oversized appearance.';
  } else {
    fitDescription = 'MUY GRANDE - oversized extremo';
    fitInstructions = 'Show very loose fit. Significant excess fabric. Baggy appearance. Shoulders may drop. Length may be too long.';
  }

  let categoryFit = '';
  if (['buzo', 'hoodie'].includes(category)) {
    categoryFit = 'Hoodie style - consider typical oversized aesthetic but adjusted by size selection.';
  } else if (category === 'vestido') {
    categoryFit = 'Dress - natural drape responsive to gravity. Waist alignment varies by fit.';
  } else if (category === 'falda') {
    categoryFit = 'Skirt - anchor to waistline. Drape naturally over hips.';
  } else {
    categoryFit = 'Standard garment fit.';
  }

  const cloth = analysis.cloth_analysis;
  const colors = cloth.colors || {};

  const colorSpec = `
⚠️ GARMENT COLORS (USE ONLY THESE - DO NOT ADD ANY OTHER COLORS):
- Base fabric color: ${colors.base_fabric || cloth.primary_color || 'as shown in image'}
- Print/graphic colors: ${colors.print_colors?.length ? colors.print_colors.join(', ') : 'none'}
- Logo/text fill color: ${colors.logo_text_colors?.fill || 'N/A'}
- Logo/text outline: ${colors.logo_text_colors?.outline || 'NONE - no outline exists'}
- Total distinct colors in garment: ${colors.total_distinct_colors || 'few'}

⚠️ CRITICAL COLOR RULES:
- Use EXACTLY ${colors.total_distinct_colors || 'the same number of'} distinct colors in the garment
- DO NOT add colors that are not listed above
- DO NOT add shadow colors, gradient colors, or "in-between" colors
- DO NOT add outline colors to text/logos unless specifically listed above
- If no outline color is listed for text/logo, render text/logo WITHOUT any outline
- Maintain exact color fidelity - the generated garment must have the EXACT same colors as analyzed`;

  const logoInfo = cloth.logos_texts?.has_logos
    ? `
⚠️ CRITICAL - LOGO/TEXT REPRODUCTION:
This garment has text/logos that MUST appear EXACTLY as described:
- Exact text: "${cloth.logos_texts.exact_text || 'N/A'}"
- Description: ${cloth.logos_texts.description || 'N/A'}
- Text fill color: ${colors.logo_text_colors?.fill || 'as analyzed'}
- Has real outline: ${cloth.logos_texts.has_real_outline ? 'YES - outline color: ' + (colors.logo_text_colors?.outline || 'as shown') : 'NO - do NOT add any outline'}
- Angle/Orientation: ${cloth.logos_texts.angle || 'horizontal'}
- Size: ${cloth.logos_texts.size || 'as shown'}
- Position: ${cloth.logos_texts.position || 'N/A'}
DO NOT alter, remove, or modify any text/logo. Reproduce with 100% fidelity.
${!cloth.logos_texts.has_real_outline ? '⚠️ NO OUTLINE ON TEXT - render text cleanly without any border/outline color' : ''}`
    : '';

  const patternInfo = cloth.patterns?.has_patterns
    ? `
- Pattern/Print: ${cloth.patterns.description}
- Pattern colors: ${colors.print_colors?.join(', ') || 'as analyzed'} (use ONLY these colors)`
    : '';

  return `
Generate photorealistic virtual try-on image.

SUBJECT (from Image 1):
- Gender: ${analysis.user_analysis.gender}
- Pose: ${analysis.user_analysis.pose}
- Body type: ${analysis.user_analysis.body_type || 'average'}
- Abdominal volume: ${analysis.user_analysis.abdominal_volume}
- Lighting: ${analysis.user_analysis.lighting}
- Background: ${analysis.user_analysis.background}
- Facial features: ${analysis.user_analysis.facial_features || 'preserve exactly from photo'}
- Expression: ${analysis.user_analysis.expression || 'preserve exactly'}
- Hair: ${analysis.user_analysis.hair || 'preserve exactly from photo'}
- Facial accessories: ${analysis.user_analysis.facial_accessories || 'none'}
- Framing: ${analysis.user_analysis.framing || 'same as original'}
- Camera distance: ${analysis.user_analysis.camera_distance || 'same as original'}
- Composition: ${analysis.user_analysis.composition || 'centered'}

GARMENT DETAILS (MUST BE REPRODUCED EXACTLY from Image 2):
- Type: ${cloth.type} (${cloth.style || category})
- Material: ${cloth.material || 'fabric'}
- Texture: ${cloth.texture || 'standard'}
${colorSpec}${logoInfo}${patternInfo}
- Special details: ${cloth.special_details?.join(', ') || 'none'}
- Finishing: ${cloth.finishing || 'standard'}

SIZE & FIT:
- User typical size: ${userSize}
- Garment size: ${garmentSize}
- Expected fit: ${fitDescription}

CRITICAL GENERATION RULES:

⚠️ RULE 0 - FACE PRESERVATION (HIGHEST PRIORITY):
- The person's face MUST remain EXACTLY IDENTICAL to Image 1
- Preserve ALL facial features: eyes (color, shape), nose, mouth, eyebrows, skin tone, freckles, moles, wrinkles, scars
- Maintain the EXACT same facial expression: ${analysis.user_analysis.expression || 'as shown'}
- Keep hair EXACTLY as shown: ${analysis.user_analysis.hair || 'same style, color, arrangement'}
- Preserve facial accessories: ${analysis.user_analysis.facial_accessories || 'if any'}
- DO NOT alter, beautify, smooth, age, de-age, or modify the face in ANY way
- DO NOT change skin texture, remove imperfections, or apply any "beautification"
- The face must be recognizable as the EXACT same person, not a similar-looking person

1. PRESERVE THE EXACT GARMENT DESIGN - colors, logos, texts, patterns must match the original image perfectly
2. RETAIN USER'S EXACT BODY VOLUME - do not slim, idealize, or modify the person's body shape
3. ${fitInstructions}
4. ${categoryFit}
5. Match the exact lighting (${analysis.user_analysis.lighting}) and background from the user's photo
6. Natural, realistic appearance - fabric should behave naturally according to its material (${cloth.material || 'fabric'})
7. The result must look like a real photograph, not AI-generated

⚠️ RULE 8 - FRAMING & COMPOSITION PRESERVATION (CRITICAL):
- MAINTAIN THE EXACT SAME FRAMING as Image 1: ${analysis.user_analysis.framing || 'preserve original'}
- Keep the SAME CAMERA DISTANCE: ${analysis.user_analysis.camera_distance || 'same as original'} - DO NOT zoom in or out
- Preserve the EXACT composition: ${analysis.user_analysis.composition || 'as shown'}
- The generated image must show the SAME body parts visible in the original photo
- If original shows full body, generated MUST show full body
- If original shows waist-up, generated MUST show waist-up
- DO NOT crop, zoom, reframe, or change the perspective in any way
- The person should occupy the SAME amount of space in the frame as in Image 1
- Maintain the same orientation: ${analysis.user_analysis.orientation || 'same as original'}
`;
}

function buildGenerate360Prompt(category: string, analysis: any): string {
  const garmentColors = analysis?.garment?.colors?.base_fabric || 'como se muestra en la imagen';
  const garmentPatterns = analysis?.garment?.patterns || 'sin patrones específicos';
  const garmentLogos = analysis?.garment?.logo_text?.content || 'sin logos/texto';

  return `INSTRUCCIÓN PRINCIPAL: Usando la imagen de referencia adjunta, genera una ÚNICA imagen cuadrada con una composición de 4 vistas del mismo outfit desde diferentes ángulos.

IMAGEN DE REFERENCIA: La imagen adjunta muestra a una persona usando un/una ${category || 'prenda'}. Esta es tu ÚNICA referencia visual - debes mantener EXACTAMENTE la misma persona, prenda y estilo.

COMPOSICIÓN REQUERIDA (imagen cuadrada 1:1):
╔═══════════════════╦═══════════════════╗
║                   ║                   ║
║   VISTA FRONTAL   ║   VISTA LATERAL   ║
║   (0° - Frente)   ║   IZQUIERDA (90°) ║
║                   ║                   ║
╠═══════════════════╬═══════════════════╣
║                   ║                   ║
║   VISTA TRASERA   ║   VISTA LATERAL   ║
║   (180° - Espalda)║   DERECHA (270°)  ║
║                   ║                   ║
╚═══════════════════╩═══════════════════╝

REQUISITOS CRÍTICOS DE CONSISTENCIA:

1. PERSONA IDÉNTICA EN LAS 4 VISTAS:
   - Mismo tono de piel exacto
   - Mismo color y estilo de cabello
   - Misma complexión física y altura
   - Misma postura corporal (de pie, natural)

2. PRENDA IDÉNTICA (${category || 'prenda'}):
   - Colores exactos: ${garmentColors}
   - Patrones/estampados: ${garmentPatterns}
   - Logos/texto: ${garmentLogos}
   - El ajuste y caída de la prenda debe ser consistente

3. AMBIENTE CONSISTENTE:
   - Fondo neutro uniforme (gris claro tipo estudio fotográfico)
   - Iluminación suave y uniforme desde el frente
   - Sin sombras dramáticas
   - Piso visible y consistente

4. ESPECIFICACIONES POR CUADRANTE:

   FRONTAL (arriba-izquierda):
   - Vista directa de frente, igual que la imagen de referencia
   - Mostrar cara, prenda completa

   LATERAL IZQUIERDA (arriba-derecha):
   - Perfil izquierdo (persona mirando hacia la derecha del cuadro)
   - Mostrar silueta y cómo ajusta la prenda en el costado

   TRASERA (abajo-izquierda):
   - Vista desde atrás, espalda completa
   - Mostrar cómo se ve la prenda por detrás
   - Cabello visible si aplica

   LATERAL DERECHA (abajo-derecha):
   - Perfil derecho (persona mirando hacia la izquierda del cuadro)
   - Mostrar silueta opuesta

5. SEPARACIÓN VISUAL:
   - Líneas blancas finas (2-3px) separando los 4 cuadrantes
   - Cada cuadrante debe tener el mismo tamaño exacto

RESULTADO: Una imagen fotorrealista tipo catálogo de moda mostrando la misma persona con la misma ${category || 'prenda'} desde 4 ángulos diferentes.`;
}
