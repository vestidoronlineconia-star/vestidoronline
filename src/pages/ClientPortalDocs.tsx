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

  // Generate subdomain URL
  const getSubdomainUrl = () => {
    if (!client) return '';
    const hostname = window.location.hostname;
    
    if (hostname.includes('lovable.app')) {
      if (hostname.includes('-preview--')) {
        const projectPart = hostname.split('-preview--')[1];
        return `https://${client.slug}-preview--${projectPart}`;
      } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          parts[0] = client.slug;
          return `https://${parts.join('.')}`;
        }
        return `https://${client.slug}.${hostname}`;
      }
    }
    return `https://${client.slug}.${hostname}`;
  };

  const storeUrl = getSubdomainUrl();
  const isPreview = window.location.hostname.includes('-preview--');

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

  // Code examples for API integration
  const apiIntegrationCode = `// Ejemplo de integración con la API
const API_KEY = 'tu-api-key';
const CLIENT_ID = '${client.slug}';

// Obtener productos del cliente
async function getProducts() {
  const response = await fetch(\`https://tu-backend.com/api/products?client=\${CLIENT_ID}\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`
    }
  });
  return response.json();
}`;

  const webhookExampleCode = `// Ejemplo de webhook para eventos de try-on
// Tu servidor recibirá eventos cuando un usuario complete un try-on

// Payload del webhook:
{
  "event": "tryon.completed",
  "client_id": "${client.slug}",
  "data": {
    "user_id": "anonymous-123",
    "product_id": "producto-abc",
    "category": "remera",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`;

  const linkIntegrationCode = `<!-- Enlace directo a tu tienda -->
<a href="${storeUrl}" target="_blank" class="btn-tryon">
  👕 Probador Virtual
</a>

<!-- O incrustar en un botón de tu e-commerce -->
<button onclick="window.open('${storeUrl}', '_blank')">
  Abrir Probador
</button>`;

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
                title="URL de tu tienda"
                description="Acceso directo a tu tienda virtual"
                icon={<Code className="w-5 h-5" />}
              >
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm mb-2">
                    <strong>Tu tienda está disponible en:</strong>
                  </p>
                  <code className="bg-primary/20 px-3 py-2 rounded text-primary block break-all">{storeUrl}</code>
                  <p className="text-sm text-muted-foreground mt-3">
                    Comparte esta URL con tus clientes para que accedan directamente a tu tienda con el probador virtual integrado.
                  </p>
                </div>
              </DocSection>
            </TabsContent>

            {/* INSTALL TAB */}
            <TabsContent value="install" className="space-y-6">
              <DocSection 
                title="Enlace desde tu sitio" 
                description="Agrega un enlace a tu tienda desde tu e-commerce"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Puedes agregar un enlace o botón en tu tienda existente que dirija a los clientes a tu tienda virtual.
                  </p>
                  <CodeBlock code={linkIntegrationCode} language="html" title="Enlace a tu tienda" />
                </div>
              </DocSection>

              <DocSection 
                title="API de Integración" 
                description="Integra programáticamente con nuestra API"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Usa nuestra API para sincronizar productos o recibir notificaciones de eventos.
                  </p>
                  <CodeBlock code={apiIntegrationCode} language="javascript" title="Ejemplo de integración API" />
                </div>
              </DocSection>

              <DocSection 
                title="Webhooks" 
                description="Recibe notificaciones de eventos en tiempo real"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configura webhooks para recibir notificaciones cuando un usuario complete un try-on.
                  </p>
                  <CodeBlock code={webhookExampleCode} language="javascript" title="Ejemplo de payload de webhook" />
                </div>
              </DocSection>
            </TabsContent>

            {/* ADVANCED TAB */}
            <TabsContent value="advanced" className="space-y-6">
              <DocSection 
                title="Configuración Avanzada" 
                description="Personaliza tu tienda"
                icon={<Zap className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Desde el panel de configuración puedes personalizar:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Colores y branding de tu tienda</li>
                    <li>Categorías de productos habilitadas</li>
                    <li>Guía de talles personalizada</li>
                    <li>Webhooks para integraciones</li>
                  </ul>
                </div>
              </DocSection>

              <DocSection 
                title="Eventos de Webhook" 
                description="Tipos de eventos disponibles"
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
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">tryon.started</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Usuario inició un try-on</td>
                          <td className="py-2 px-3 text-muted-foreground">product_id, category</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">tryon.completed</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Try-on completado exitosamente</td>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">product_id, result_url</code></td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">tryon.error</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Error en el try-on</td>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">error_message</code></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded">product.viewed</code></td>
                          <td className="py-2 px-3 text-muted-foreground">Producto visto en tienda</td>
                          <td className="py-2 px-3"><code className="bg-muted px-1 rounded text-xs">product_id</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
