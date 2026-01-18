import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  BookOpen,
  Code,
  Zap,
  AlertCircle,
  CheckCircle2,
  Settings,
  MessageSquare,
  Download
} from 'lucide-react';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { DocSection } from '@/components/docs/DocSection';
import { IntegrationDiagram } from '@/components/docs/IntegrationDiagram';
import { getEmbedBaseUrl } from '@/lib/embedUrl';

interface ClientInfo {
  id: string;
  name: string;
  slug: string;
  allowed_domains: string[];
}

const ClientPortalDocs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { url: baseUrl, isPreview } = getEmbedBaseUrl();

  useEffect(() => {
    loadClient();
  }, [clientId, user]);

  const loadClient = async () => {
    if (!user || !clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('embed_clients')
        .select('id, name, slug, allowed_domains')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (e) {
      navigate('/client-portal');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) return null;

  const embedUrl = `${baseUrl}/embed?clientId=${client.slug}`;

  // Code examples
  const basicIframeCode = `<!-- Probador Virtual - ${client.name} -->
<iframe 
  id="virtual-tryon"
  src="${embedUrl}"
  style="width: 100%; height: 700px; border: none; border-radius: 12px;"
  allow="camera"
></iframe>`;

  const customPageCode = `<!-- Página personalizada en Tienda Nube -->
<div class="virtual-tryon-container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1>Probador Virtual</h1>
  <p>Subí tu foto y probate nuestras prendas sin salir de casa</p>
  
  <iframe 
    id="virtual-tryon"
    src="${embedUrl}"
    style="width: 100%; height: 700px; border: none; border-radius: 12px;"
    allow="camera"
  ></iframe>
</div>`;

  const productPageCode = `<!-- Integración en página de producto -->
<div id="tryon-widget-container"></div>

<script>
(function() {
  // Obtener imagen del producto actual
  const productImage = document.querySelector('.product-image img, .js-product-image, [data-product-image]');
  const productImageUrl = productImage ? productImage.src : null;
  
  // Crear iframe del probador
  const iframe = document.createElement('iframe');
  iframe.id = 'virtual-tryon';
  iframe.src = '${embedUrl}' + (productImageUrl ? '&garment=' + encodeURIComponent(productImageUrl) : '');
  iframe.style.cssText = 'width: 100%; height: 700px; border: none; border-radius: 12px;';
  iframe.allow = 'camera';
  
  document.getElementById('tryon-widget-container').appendChild(iframe);
})();
</script>`;

  const postMessageCode = `// Cargar una prenda programáticamente
function loadGarment(imageUrl) {
  const iframe = document.getElementById('virtual-tryon');
  iframe.contentWindow.postMessage({
    type: 'SET_GARMENT',
    garmentUrl: imageUrl
  }, '*');
}

// Establecer categoría
function setCategory(category) {
  const iframe = document.getElementById('virtual-tryon');
  iframe.contentWindow.postMessage({
    type: 'SET_CATEGORY',
    category: category // 'remera', 'pantalon', 'vestido', etc.
  }, '*');
}

// Establecer talles para calcular fit
function setSizes(userSize, garmentSize) {
  const iframe = document.getElementById('virtual-tryon');
  iframe.contentWindow.postMessage({
    type: 'SET_SIZES',
    userSize: userSize,
    garmentSize: garmentSize
  }, '*');
}`;

  const eventsCode = `// Escuchar eventos del widget
window.addEventListener('message', function(event) {
  // Verificar origen por seguridad
  if (!event.origin.includes('${new URL(baseUrl).hostname}')) return;
  
  const { type, ...data } = event.data;
  
  switch(type) {
    case 'READY':
      console.log('Widget listo para usar');
      break;
      
    case 'TRYON_START':
      console.log('Generando prueba virtual...');
      // Mostrar loading en tu UI
      break;
      
    case 'TRYON_COMPLETE':
      console.log('Imagen generada:', data.imageUrl);
      // Mostrar imagen o habilitar descarga
      break;
      
    case 'TRYON_ERROR':
      console.error('Error:', data.error);
      // Mostrar mensaje de error
      break;
      
    case 'VIEW360_COMPLETE':
      console.log('Vista 360 generada:', data.imageUrl);
      break;
  }
});`;

  const buttonIntegrationCode = `<!-- Botón para abrir probador en modal -->
<button onclick="openTryOn()" class="btn-tryon">
  👕 Probar esta prenda
</button>

<div id="tryon-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999;">
  <div style="position: relative; max-width: 900px; margin: 20px auto; height: calc(100vh - 40px);">
    <button onclick="closeTryOn()" style="position: absolute; top: 10px; right: 10px; z-index: 1;">✕</button>
    <iframe 
      id="virtual-tryon"
      src="${embedUrl}"
      style="width: 100%; height: 100%; border: none; border-radius: 12px;"
      allow="camera"
    ></iframe>
  </div>
</div>

<script>
function openTryOn() {
  document.getElementById('tryon-modal').style.display = 'block';
  // Cargar la imagen del producto actual
  const productImg = document.querySelector('.product-image img');
  if (productImg) {
    setTimeout(() => {
      document.getElementById('virtual-tryon').contentWindow.postMessage({
        type: 'SET_GARMENT',
        garmentUrl: productImg.src
      }, '*');
    }, 1000);
  }
}

function closeTryOn() {
  document.getElementById('tryon-modal').style.display = 'none';
}
</script>`;

  return (
    <>
      <div className="bg-ambient" />
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/client-portal/settings/${clientId}`)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Documentación de Integración
                </h1>
                <p className="text-muted-foreground">{client.name}</p>
              </div>
            </div>
            {isPreview && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                <AlertCircle className="w-3 h-3 mr-1" />
                Modo Preview
              </Badge>
            )}
          </div>

          {/* Warning for preview mode */}
          {isPreview && (
            <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Aplicación en modo preview</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Para que el widget funcione en sitios externos, debes publicar tu aplicación primero.
                    Las URLs de preview requieren autenticación.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="start" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="start">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Inicio
              </TabsTrigger>
              <TabsTrigger value="install">
                <Code className="w-4 h-4 mr-2" />
                Instalación
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <Zap className="w-4 h-4 mr-2" />
                Avanzado
              </TabsTrigger>
              <TabsTrigger value="troubleshooting">
                <Settings className="w-4 h-4 mr-2" />
                Problemas
              </TabsTrigger>
            </TabsList>

            {/* START TAB */}
            <TabsContent value="start" className="space-y-6">
              <DocSection 
                title="Requisitos Previos" 
                description="Antes de comenzar la integración"
                icon={<CheckCircle2 className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
                    <div>
                      <p className="font-medium">Dominio autorizado</p>
                      <p className="text-sm text-muted-foreground">
                        Tu dominio de Tienda Nube debe estar en la lista de dominios permitidos.
                      </p>
                      {client.allowed_domains.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {client.allowed_domains.map((domain) => (
                            <Badge key={domain} variant="secondary">{domain}</Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="mt-2 text-yellow-500 border-yellow-500/30">
                          Sin dominios configurados
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
                    <div>
                      <p className="font-medium">Aplicación publicada</p>
                      <p className="text-sm text-muted-foreground">
                        La aplicación debe estar publicada en producción para que el widget funcione sin requerir login.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
                    <div>
                      <p className="font-medium">Acceso al panel de Tienda Nube</p>
                      <p className="text-sm text-muted-foreground">
                        Necesitarás acceso para editar el HTML de tu tienda o crear páginas personalizadas.
                      </p>
                    </div>
                  </div>
                </div>
              </DocSection>

              <DocSection 
                title="Flujo de Integración" 
                description="Cómo funciona el widget"
                icon={<MessageSquare className="w-5 h-5" />}
              >
                <IntegrationDiagram />
              </DocSection>

              <DocSection 
                title="Tu código de integración"
                description="Copia este código para comenzar"
                icon={<Code className="w-5 h-5" />}
              >
                <CodeBlock code={basicIframeCode} language="html" title="Código básico" />
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm">
                    <strong>Tu Client ID:</strong>{' '}
                    <code className="bg-primary/20 px-2 py-0.5 rounded text-primary">{client.slug}</code>
                  </p>
                </div>
              </DocSection>
            </TabsContent>

            {/* INSTALL TAB */}
            <TabsContent value="install" className="space-y-6">
              <DocSection 
                title="Opción A: Página Personalizada" 
                description="Crear una página dedicada para el probador"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Pasos en Tienda Nube:</strong>
                    </p>
                    <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                      <li>Ir a <strong>Contenido → Páginas</strong></li>
                      <li>Crear nueva página "Probador Virtual"</li>
                      <li>Cambiar a modo HTML (botón <code>&lt; &gt;</code>)</li>
                      <li>Pegar el código del widget</li>
                      <li>Guardar y publicar</li>
                    </ol>
                  </div>
                  <CodeBlock code={customPageCode} language="html" title="Código para página personalizada" />
                </div>
              </DocSection>

              <DocSection 
                title="Opción B: Página de Producto" 
                description="Integrar el probador en las fichas de producto"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Este código detecta automáticamente la imagen del producto actual y la carga en el probador.
                  </p>
                  <CodeBlock code={productPageCode} language="html" title="Integración en página de producto" />
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-blue-400">
                      <strong>Tip:</strong> Puedes agregar este código en <strong>Diseño → Personalizar → HTML Personalizado</strong> 
                      y usar CSS para mostrarlo solo en páginas de producto.
                    </p>
                  </div>
                </div>
              </DocSection>

              <DocSection 
                title="Opción C: Botón + Modal" 
                description="Abrir el probador en una ventana modal"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ideal para no ocupar espacio en la página. El usuario hace clic en un botón y se abre el probador.
                  </p>
                  <CodeBlock code={buttonIntegrationCode} language="html" title="Integración con modal" />
                </div>
              </DocSection>
            </TabsContent>

            {/* ADVANCED TAB */}
            <TabsContent value="advanced" className="space-y-6">
              <DocSection 
                title="API de Comunicación (postMessage)" 
                description="Controla el widget programáticamente"
                icon={<Zap className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Usa <code>postMessage</code> para enviar comandos al widget desde tu sitio.
                  </p>
                  <CodeBlock code={postMessageCode} language="javascript" title="Comandos disponibles" />
                </div>
              </DocSection>

              <DocSection 
                title="Eventos del Widget" 
                description="Escucha eventos para reaccionar en tu sitio"
                icon={<MessageSquare className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3">Evento</th>
                          <th className="text-left py-2 px-3">Descripción</th>
                          <th className="text-left py-2 px-3">Datos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">READY</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Widget cargado y listo</td>
                          <td className="py-2 px-3 text-muted-foreground">-</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">TRYON_START</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Inicio de generación</td>
                          <td className="py-2 px-3 text-muted-foreground">-</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">TRYON_COMPLETE</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Imagen generada</td>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">{"{ imageUrl }"}</code></td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">TRYON_ERROR</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Error en generación</td>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">{"{ error }"}</code></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">VIEW360_COMPLETE</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Vista 360 generada</td>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">{"{ imageUrl }"}</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <CodeBlock code={eventsCode} language="javascript" title="Ejemplo de escucha de eventos" />
                </div>
              </DocSection>

              <DocSection 
                title="Parámetros URL" 
                description="Configura el widget mediante URL"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3">Parámetro</th>
                        <th className="text-left py-2 px-3">Descripción</th>
                        <th className="text-left py-2 px-3">Ejemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">clientId</code></td>
                        <td className="py-2 px-3 text-muted-foreground">Tu identificador de cliente (requerido)</td>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">{client.slug}</code></td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">garment</code></td>
                        <td className="py-2 px-3 text-muted-foreground">URL de imagen de prenda precargada</td>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">https://...</code></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">category</code></td>
                        <td className="py-2 px-3 text-muted-foreground">Categoría preseleccionada</td>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">remera</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DocSection>
            </TabsContent>

            {/* TROUBLESHOOTING TAB */}
            <TabsContent value="troubleshooting" className="space-y-6">
              <DocSection 
                title="Problemas Comunes" 
                description="Soluciones a errores frecuentes"
                icon={<AlertCircle className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border">
                    <p className="font-medium text-destructive">❌ "Dominio no autorizado"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Causa:</strong> El dominio desde donde se carga el widget no está en la lista de dominios permitidos.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Solución:</strong> Agrega tu dominio en Configuración → Dominios. Recuerda incluir tanto 
                      <code className="bg-muted px-1 rounded mx-1">tutienda.mitiendanube.com</code> como cualquier dominio personalizado.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <p className="font-medium text-destructive">❌ "Cliente no encontrado"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Causa:</strong> El <code className="bg-muted px-1 rounded">clientId</code> en la URL es incorrecto o el cliente está inactivo.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Solución:</strong> Verifica que estés usando el slug correcto: <code className="bg-primary/20 px-1 rounded text-primary">{client.slug}</code>
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <p className="font-medium text-destructive">❌ Widget no carga / Pantalla en blanco</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Causa:</strong> La aplicación no está publicada o hay un error de conexión.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Solución:</strong> Asegúrate de que la aplicación esté publicada. Las URLs de preview requieren autenticación.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <p className="font-medium text-destructive">❌ Cámara no funciona</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Causa:</strong> El iframe no tiene permisos de cámara o el sitio no usa HTTPS.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Solución:</strong> Asegúrate de incluir <code className="bg-muted px-1 rounded">allow="camera"</code> en el iframe y que tu sitio use HTTPS.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <p className="font-medium text-destructive">❌ postMessage no funciona</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Causa:</strong> El iframe no ha terminado de cargar o el evento no se está enviando correctamente.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Solución:</strong> Espera al evento <code className="bg-muted px-1 rounded">READY</code> antes de enviar comandos, y usa <code className="bg-muted px-1 rounded">contentWindow.postMessage</code>.
                    </p>
                  </div>
                </div>
              </DocSection>

              <DocSection 
                title="¿Necesitas ayuda?" 
                description="Contacta con soporte"
              >
                <p className="text-sm text-muted-foreground">
                  Si sigues teniendo problemas, contacta con soporte técnico proporcionando:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Tu Client ID: <code className="bg-primary/20 px-1 rounded text-primary">{client.slug}</code></li>
                  <li>URL de tu tienda</li>
                  <li>Capturas de pantalla del error</li>
                  <li>Consola del navegador (F12 → Console)</li>
                </ul>
              </DocSection>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ClientPortalDocs;
