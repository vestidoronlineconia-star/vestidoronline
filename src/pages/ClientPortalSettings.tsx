import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Palette, 
  Globe, 
  Sliders, 
  Store,
  X,
  Plus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Ruler,
  BookOpen,
  Eye,
  Bell,
  Users
} from 'lucide-react';
import { SizeGuideEditor } from '@/components/SizeGuideEditor';
import { Checkbox } from '@/components/ui/checkbox';
import { LogoUpload } from '@/components/LogoUpload';
import { EmbedPreview } from '@/components/EmbedPreview';
import { ResponsivePreview } from '@/components/ResponsivePreview';
import { GARMENT_CATEGORIES } from '@/lib/categories';
import { WebhookManager } from '@/components/webhooks/WebhookManager';
import { TeamManager } from '@/components/team/TeamManager';

interface EmbedClient {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  api_key: string;
  allowed_domains: string[];
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  custom_title: string;
  cta_text: string;
  enabled_categories: string[];
  show_size_selector: boolean;
  show_fit_result: boolean;
  is_active: boolean;
  monthly_limit: number;
  current_month_usage: number;
  // New customization fields
  placeholder_photo: string;
  placeholder_garment: string;
  error_message: string;
  button_style: 'rounded' | 'square' | 'pill';
  entry_animation: 'fade' | 'slide' | 'none';
  theme_mode: 'dark' | 'light' | 'auto';
}

// Use centralized categories
const allCategories = GARMENT_CATEGORIES;

const ClientPortalSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  
  const [client, setClient] = useState<EmbedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#8B5CF6',
    secondary_color: '#A78BFA',
    background_color: '#0A0A0F',
    text_color: '#FFFFFF',
    logo_url: '',
    custom_title: 'Virtual Try-On',
    cta_text: 'Probar prenda',
    enabled_categories: [] as string[],
    show_size_selector: true,
    show_fit_result: true,
    is_active: true,
    allowed_domains: [] as string[],
    // New customization fields
    placeholder_photo: 'Tu foto',
    placeholder_garment: 'Prenda',
    error_message: 'Error al procesar. Intenta de nuevo.',
    button_style: 'rounded' as 'rounded' | 'square' | 'pill',
    entry_animation: 'fade' as 'fade' | 'slide' | 'none',
    theme_mode: 'dark' as 'dark' | 'light' | 'auto',
  });

  useEffect(() => {
    loadClient();
  }, [clientId, user]);

  const loadClient = async () => {
    if (!user || !clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('embed_clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setClient(data as EmbedClient);
      setFormData({
        name: data.name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        background_color: data.background_color,
        text_color: data.text_color,
        logo_url: data.logo_url || '',
        custom_title: data.custom_title,
        cta_text: data.cta_text,
        enabled_categories: data.enabled_categories,
        show_size_selector: data.show_size_selector,
        show_fit_result: data.show_fit_result,
        is_active: data.is_active,
        allowed_domains: data.allowed_domains,
        // New customization fields
        placeholder_photo: data.placeholder_photo || 'Tu foto',
        placeholder_garment: data.placeholder_garment || 'Prenda',
        error_message: data.error_message || 'Error al procesar. Intenta de nuevo.',
        button_style: (data.button_style || 'rounded') as 'rounded' | 'square' | 'pill',
        entry_animation: (data.entry_animation || 'fade') as 'fade' | 'slide' | 'none',
        theme_mode: (data.theme_mode || 'dark') as 'dark' | 'light' | 'auto',
      });
    } catch (e) {
      toast.error('Error al cargar configuración');
      navigate('/client-portal');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!client) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('embed_clients')
        .update({
          name: formData.name,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          background_color: formData.background_color,
          text_color: formData.text_color,
          logo_url: formData.logo_url || null,
          custom_title: formData.custom_title,
          cta_text: formData.cta_text,
          enabled_categories: formData.enabled_categories,
          show_size_selector: formData.show_size_selector,
          show_fit_result: formData.show_fit_result,
          is_active: formData.is_active,
          allowed_domains: formData.allowed_domains,
          // New customization fields
          placeholder_photo: formData.placeholder_photo,
          placeholder_garment: formData.placeholder_garment,
          error_message: formData.error_message,
          button_style: formData.button_style,
          entry_animation: formData.entry_animation,
          theme_mode: formData.theme_mode,
        })
        .eq('id', client.id);

      if (error) throw error;
      toast.success('Configuración guardada');
    } catch (e) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;
    
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (formData.allowed_domains.includes(domain)) {
      toast.error('El dominio ya existe');
      return;
    }
    
    setFormData({
      ...formData,
      allowed_domains: [...formData.allowed_domains, domain],
    });
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowed_domains: formData.allowed_domains.filter(d => d !== domain),
    });
  };

  const toggleCategory = (categoryId: string) => {
    const current = formData.enabled_categories;
    const updated = current.includes(categoryId)
      ? current.filter(c => c !== categoryId)
      : [...current, categoryId];
    
    setFormData({ ...formData, enabled_categories: updated });
  };

  const regenerateApiKey = async () => {
    if (!client) return;
    if (!confirm('¿Estás seguro? Esto invalidará la API key actual.')) return;

    try {
      const newApiKey = crypto.randomUUID();
      const { error } = await supabase
        .from('embed_clients')
        .update({ api_key: newApiKey })
        .eq('id', client.id);

      if (error) throw error;
      
      setClient({ ...client, api_key: newApiKey });
      toast.success('API Key regenerada');
    } catch (e) {
      toast.error('Error al regenerar API Key');
    }
  };

  const getSubdomainUrl = () => {
    if (!client) return '';
    
    const hostname = window.location.hostname;
    
    if (hostname.includes('lovable.app')) {
      if (hostname.includes('-preview--')) {
        // Preview URL format: {slug}-preview--{project-id}.lovable.app
        const projectPart = hostname.split('-preview--')[1];
        return `https://${client.slug}-preview--${projectPart}`;
      } else {
        // Published URL format: {slug}.{domain}.lovable.app
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          parts[0] = client.slug;
          return `https://${parts.join('.')}`;
        }
        return `https://${client.slug}.${hostname}`;
      }
    }
    // Custom domain
    return `https://${client.slug}.${hostname}`;
  };

  const copySubdomainUrl = () => {
    const url = getSubdomainUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL de la tienda copiada');
  };

  const copyApiKey = () => {
    if (!client) return;
    navigator.clipboard.writeText(client.api_key);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
    toast.success('API Key copiada');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

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
                onClick={() => navigate('/client-portal')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <p className="text-muted-foreground font-mono text-sm">{client.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/client-portal/docs/${clientId}`)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Documentación
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(getSubdomainUrl(), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Tienda
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="branding" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="branding">
                <Palette className="w-4 h-4 mr-2" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Sliders className="w-4 h-4 mr-2" />
                Apariencia
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="domains">
                <Globe className="w-4 h-4 mr-2" />
                Dominios
              </TabsTrigger>
              <TabsTrigger value="sizes">
                <Ruler className="w-4 h-4 mr-2" />
                Talles
              </TabsTrigger>
              <TabsTrigger value="features">
                <Sliders className="w-4 h-4 mr-2" />
                Funciones
              </TabsTrigger>
              <TabsTrigger value="webhooks">
                <Bell className="w-4 h-4 mr-2" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="w-4 h-4 mr-2" />
                Equipo
              </TabsTrigger>
              <TabsTrigger value="store">
                <Store className="w-4 h-4 mr-2" />
                Tienda
              </TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Settings Column */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Identidad de Marca</CardTitle>
                      <CardDescription>
                        Configura el nombre y logo de tu tienda
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nombre del cliente</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Mi Tienda"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Título del widget</Label>
                          <Input
                            value={formData.custom_title}
                            onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
                            placeholder="Virtual Try-On"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Logo de marca</Label>
                          <LogoUpload
                            clientId={client.id}
                            userId={user?.id || ''}
                            currentLogoUrl={formData.logo_url || null}
                            onLogoChange={(url) => setFormData({ ...formData, logo_url: url || '' })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto del botón CTA</Label>
                          <Input
                            value={formData.cta_text}
                            onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                            placeholder="Probar prenda"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            El texto que aparece en el botón principal
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Colores</CardTitle>
                      <CardDescription>
                        Personaliza los colores del widget para que coincidan con tu marca
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Color primario</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.primary_color}
                              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer border border-border"
                            />
                            <Input
                              value={formData.primary_color}
                              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Color secundario</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.secondary_color}
                              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer border border-border"
                            />
                            <Input
                              value={formData.secondary_color}
                              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Color de fondo</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.background_color}
                              onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer border border-border"
                            />
                            <Input
                              value={formData.background_color}
                              onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Color de texto</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.text_color}
                              onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer border border-border"
                            />
                            <Input
                              value={formData.text_color}
                              onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Column */}
                <div className="space-y-4">
                  <div className="sticky top-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Vista previa</h3>
                    <EmbedPreview
                      title={formData.custom_title}
                      ctaText={formData.cta_text}
                      primaryColor={formData.primary_color}
                      secondaryColor={formData.secondary_color}
                      backgroundColor={formData.background_color}
                      textColor={formData.text_color}
                      logoUrl={formData.logo_url || null}
                    />
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Los cambios se verán reflejados al guardar
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Textos Personalizados</CardTitle>
                  <CardDescription>
                    Personaliza los textos que aparecen en el widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Placeholder foto de usuario</Label>
                      <Input
                        value={formData.placeholder_photo}
                        onChange={(e) => setFormData({ ...formData, placeholder_photo: e.target.value })}
                        placeholder="Tu foto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Placeholder prenda</Label>
                      <Input
                        value={formData.placeholder_garment}
                        onChange={(e) => setFormData({ ...formData, placeholder_garment: e.target.value })}
                        placeholder="Prenda"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje de error personalizado</Label>
                    <Input
                      value={formData.error_message}
                      onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
                      placeholder="Error al procesar. Intenta de nuevo."
                    />
                    <p className="text-xs text-muted-foreground">
                      Mensaje que se muestra cuando ocurre un error
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estilo Visual</CardTitle>
                  <CardDescription>
                    Configura la apariencia de los elementos del widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Estilo de botones</Label>
                    <div className="flex gap-3">
                      {[
                        { id: 'rounded', label: 'Redondeado' },
                        { id: 'square', label: 'Cuadrado' },
                        { id: 'pill', label: 'Píldora' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, button_style: style.id as 'rounded' | 'square' | 'pill' })}
                          className={`flex-1 px-4 py-3 border rounded-lg transition-all ${
                            formData.button_style === style.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <span className="text-sm font-medium">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Animación de entrada</Label>
                    <div className="flex gap-3">
                      {[
                        { id: 'fade', label: 'Desvanecimiento' },
                        { id: 'slide', label: 'Deslizamiento' },
                        { id: 'none', label: 'Ninguna' },
                      ].map((anim) => (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, entry_animation: anim.id as 'fade' | 'slide' | 'none' })}
                          className={`flex-1 px-4 py-3 border rounded-lg transition-all ${
                            formData.entry_animation === anim.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <span className="text-sm font-medium">{anim.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Modo de tema</Label>
                    <div className="flex gap-3">
                      {[
                        { id: 'dark', label: 'Oscuro' },
                        { id: 'light', label: 'Claro' },
                        { id: 'auto', label: 'Automático' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, theme_mode: theme.id as 'dark' | 'light' | 'auto' })}
                          className={`flex-1 px-4 py-3 border rounded-lg transition-all ${
                            formData.theme_mode === theme.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      "Automático" detecta la preferencia del navegador del usuario
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa Responsive</CardTitle>
                  <CardDescription>
                    Visualiza cómo se verá tu widget en diferentes dispositivos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsivePreview clientSlug={client.slug} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dominios Permitidos</CardTitle>
                  <CardDescription>
                    Controla desde qué dominios se puede embeber el widget. Deja vacío para permitir todos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="ejemplo.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                    />
                    <Button onClick={addDomain}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {formData.allowed_domains.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Sin restricciones de dominio. El widget puede ser embebido desde cualquier sitio.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.allowed_domains.map((domain) => (
                        <div
                          key={domain}
                          className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
                        >
                          <span className="text-sm">{domain}</span>
                          <button
                            onClick={() => removeDomain(domain)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sizes Tab */}
            <TabsContent value="sizes" className="space-y-6">
              <SizeGuideEditor 
                clientId={client.id} 
                enabledCategories={formData.enabled_categories}
              />
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Funcionalidades</CardTitle>
                  <CardDescription>
                    Configura qué funciones están disponibles en el widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Widget activo</Label>
                      <p className="text-sm text-muted-foreground">
                        Desactiva para suspender temporalmente el widget
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Selector de talles</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite seleccionar talle del usuario y de la prenda
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_size_selector}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_size_selector: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mostrar resultado de fit</Label>
                      <p className="text-sm text-muted-foreground">
                        Muestra si la prenda quedará ajustada, ideal o holgada
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_fit_result}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_fit_result: checked })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Categorías habilitadas</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {allCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={cat.id}
                            checked={formData.enabled_categories.includes(cat.id)}
                            onCheckedChange={() => toggleCategory(cat.id)}
                          />
                          <label
                            htmlFor={cat.id}
                            className="text-sm cursor-pointer"
                          >
                            {cat.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Store Tab */}
            <TabsContent value="store" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>URL de tu Tienda</CardTitle>
                  <CardDescription>
                    Esta es la dirección web de tu tienda con el probador virtual integrado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={getSubdomainUrl()}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={copySubdomainUrl}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button onClick={() => window.open(getSubdomainUrl(), '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Tienda
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comparte esta URL con tus clientes para que accedan a tu tienda virtual
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Key</CardTitle>
                  <CardDescription>
                    Usa esta clave para integraciones server-to-server
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={client.api_key}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={copyApiKey}>
                      {copiedApiKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" onClick={regenerateApiKey}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Regenerar la API key invalidará la anterior inmediatamente.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-6">
              <WebhookManager clientId={clientId || ''} />
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <TeamManager clientId={clientId || ''} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ClientPortalSettings;
