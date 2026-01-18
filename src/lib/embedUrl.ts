/**
 * Get the base URL for embed codes
 * Uses production URL if configured, otherwise detects custom domain
 */
export const getEmbedBaseUrl = (): { url: string; isPreview: boolean } => {
  // Check for configured production URL
  const productionUrl = import.meta.env.VITE_PRODUCTION_URL;
  if (productionUrl) {
    return { url: productionUrl, isPreview: false };
  }

  const hostname = window.location.hostname;

  // If on a custom domain (not lovable.app or localhost), use current origin
  if (!hostname.includes('lovable.app') && !hostname.includes('localhost')) {
    return { url: window.location.origin, isPreview: false };
  }

  // We're on preview environment
  return { url: window.location.origin, isPreview: true };
};

/**
 * Generate embed code for a client
 */
export const generateEmbedCode = (slug: string): { code: string; isPreview: boolean } => {
  const { url, isPreview } = getEmbedBaseUrl();
  
  const code = `<!-- Virtual Try-On Widget -->
<iframe 
  id="virtual-tryon"
  src="${url}/embed?clientId=${slug}"
  style="width: 100%; height: 700px; border: none; border-radius: 12px;"
  allow="camera"
></iframe>

<script>
// Escuchar eventos del widget
window.addEventListener('message', (event) => {
  if (event.data.type === 'READY') {
    console.log('Widget listo');
  }
  if (event.data.type === 'TRYON_COMPLETE') {
    console.log('Imagen generada:', event.data.imageUrl);
  }
  if (event.data.type === 'VIEW360_COMPLETE') {
    console.log('Vista 360:', event.data.imageUrl);
  }
});

// Cargar prenda programáticamente
function loadGarment(imageUrl) {
  document.getElementById('virtual-tryon').contentWindow.postMessage({
    type: 'SET_GARMENT',
    garmentUrl: imageUrl
  }, '*');
}
</script>`;

  return { code, isPreview };
};
