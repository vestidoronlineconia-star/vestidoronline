import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Plus, 
  Settings, 
  Store, 
  BarChart3, 
  Trash2, 
  Copy, 
  Check,
  Loader2,
  Lock,
  Users,
  Crown,
  Shield,
  Eye,
  Pencil,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccessRequestForm } from '@/components/portal/AccessRequestForm';

interface EmbedClient {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  allowed_domains: string[];
  is_active: boolean;
  monthly_limit: number;
  current_month_usage: number;
  created_at: string;
  // Extended properties for team membership
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
  isOwner?: boolean;
}

const ClientPortal = () => {
  const { user } = useAuth();
  const { isAdmin, isClient, canCreateClients, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [clients, setClients] = useState<EmbedClient[]>([]);
  const [clientUsage, setClientUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientSlug, setNewClientSlug] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasAccess = isAdmin || isClient;

  useEffect(() => {
    if (hasAccess) {
      loadClients();
    } else {
      setLoading(false);
    }
  }, [user, hasAccess]);

  const loadClients = async () => {
    if (!user) return;
    
    try {
      // 1. Fetch clients where user is the owner
      const { data: ownClients, error: ownError } = await supabase
        .from('embed_clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      // 2. Fetch clients where user is a team member (by user_id OR email)
      const userEmail = user.email?.toLowerCase() || '';
      const { data: teamMemberships, error: teamError } = await supabase
        .from('client_team_members')
        .select(`
          client_id,
          role,
          embed_clients (*)
        `)
        .or(`user_id.eq.${user.id},email.eq.${userEmail}`)
        .not('accepted_at', 'is', null);

      if (teamError) throw teamError;

      // Combine both lists, avoiding duplicates
      const ownClientsWithRole: EmbedClient[] = (ownClients || []).map(c => ({
        ...c,
        userRole: 'owner' as const,
        isOwner: true,
      }));

      const teamClientsWithRole: EmbedClient[] = (teamMemberships || [])
        .filter(m => m.embed_clients && !ownClients?.some(oc => oc.id === m.client_id))
        .map(m => ({
          ...(m.embed_clients as any),
          userRole: m.role as 'owner' | 'admin' | 'editor' | 'viewer',
          isOwner: false,
        }));

      const allClients = [...ownClientsWithRole, ...teamClientsWithRole];
      setClients(allClients);

      // Calculate real monthly usage for each client
      if (allClients.length > 0) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const usagePromises = allClients.map(async (client) => {
          const { count } = await supabase
            .from('embed_usage')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .eq('action', 'tryon')
            .gte('created_at', monthStart.toISOString());
          return { id: client.id, count: count || 0 };
        });

        const usageResults = await Promise.all(usagePromises);
        const usageMap: Record<string, number> = {};
        usageResults.forEach(({ id, count }) => {
          usageMap[id] = count;
        });
        setClientUsage(usageMap);
      }
    } catch (e) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewClientName(name);
    setNewClientSlug(generateSlug(name));
  };

  const createClient = async () => {
    if (!user || !newClientName.trim() || !newClientSlug.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('embed_clients')
        .insert({
          user_id: user.id,
          name: newClientName.trim(),
          slug: newClientSlug.trim(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('El slug ya está en uso');
        } else {
          throw error;
        }
        return;
      }

      setClients([data, ...clients]);
      setNewClientName('');
      setNewClientSlug('');
      setDialogOpen(false);
      toast.success('Cliente creado exitosamente');
    } catch (e) {
      toast.error('Error al crear cliente');
    } finally {
      setCreating(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const { error } = await supabase
        .from('embed_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(clients.filter(c => c.id !== id));
      toast.success('Cliente eliminado');
    } catch (e) {
      toast.error('Error al eliminar cliente');
    }
  };


  const copySubdomainUrl = (client: EmbedClient) => {
    // Get the base domain from current hostname
    const hostname = window.location.hostname;
    let subdomainUrl = '';
    
    if (hostname.includes('lovable.app')) {
      // For Lovable preview/published URLs
      if (hostname.includes('-preview--')) {
        // Preview URL format: {slug}-preview--{project-id}.lovable.app
        const projectPart = hostname.split('-preview--')[1];
        subdomainUrl = `https://${client.slug}-preview--${projectPart}`;
      } else {
        // Published URL format: {slug}.{domain}.lovable.app
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          parts[0] = client.slug;
          subdomainUrl = `https://${parts.join('.')}`;
        } else {
          subdomainUrl = `https://${client.slug}.${hostname}`;
        }
      }
    } else {
      // For custom domains
      subdomainUrl = `https://${client.slug}.${hostname}`;
    }
    
    navigator.clipboard.writeText(subdomainUrl);
    setCopiedId(client.id + '-url');
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('URL del subdominio copiada');
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Vista para usuarios SIN acceso
  if (!hasAccess) {
    return (
      <>
        <div className="bg-ambient" />
        <div className="min-h-screen flex items-center justify-center p-4 relative">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 w-fit">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
              <CardDescription className="text-base">
                El Portal de Clientes está disponible para tiendas online 
                que desean integrar el probador virtual en su sitio web.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">¿Qué incluye?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Widget embebible para tu tienda</li>
                  <li>Personalización de marca y colores</li>
                  <li>Analytics de uso</li>
                  <li>Soporte técnico</li>
                </ul>
              </div>
              <AccessRequestForm />
              <p className="text-xs text-center text-muted-foreground">
                Revisaremos tu solicitud y te contactaremos pronto.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-ambient" />
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Portal de Clientes</h1>
              <p className="text-muted-foreground">Gestiona tus tiendas virtuales</p>
            </div>
            {canCreateClients && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nuevo cliente</DialogTitle>
                  <DialogDescription>
                    Crea una nueva configuración de embed para un cliente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del cliente</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Tienda Fashion"
                      value={newClientName}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Identificador (slug)</Label>
                    <Input
                      id="slug"
                      placeholder="tienda-fashion"
                      value={newClientSlug}
                      onChange={(e) => setNewClientSlug(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este identificador se usará en la URL del embed
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createClient} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear cliente
                  </Button>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Client Cards */}
          {clients.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Store className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Sin clientes aún</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-sm">
                  Crea tu primer cliente para obtener el código de embed y comenzar a integrar el probador virtual.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => {
                const roleConfig = {
                  owner: { label: 'Propietario', icon: Crown, color: 'text-amber-500' },
                  admin: { label: 'Admin', icon: Shield, color: 'text-blue-500' },
                  editor: { label: 'Editor', icon: Pencil, color: 'text-green-500' },
                  viewer: { label: 'Viewer', icon: Eye, color: 'text-muted-foreground' },
                };
                const role = client.userRole || 'owner';
                const RoleIcon = roleConfig[role].icon;
                const canDelete = client.isOwner;
                const canConfigure = role !== 'viewer';
                
                return (
                  <Card key={client.id} className="relative group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {client.slug}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.is_active 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {client.is_active ? 'Activo' : 'Inactivo'}
                          </div>
                          {/* Role badge */}
                          <div className={`flex items-center gap-1 text-xs ${roleConfig[role].color}`}>
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleConfig[role].label}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Usage Stats */}
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Uso mensual:</span>
                        <span className="font-medium">
                          {clientUsage[client.id] ?? 0} / {client.monthly_limit}
                        </span>
                      </div>

                      {/* Domains */}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Dominios:</span>
                        <span className="ml-2 font-medium">
                          {client.allowed_domains.length === 0 
                            ? 'Todos permitidos' 
                            : client.allowed_domains.join(', ')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySubdomainUrl(client)}
                        >
                          {copiedId === client.id + '-url' ? (
                            <Check className="w-4 h-4 mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          URL
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/client-portal/products/${client.id}`)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-1" />
                          Productos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/client-portal/analytics/${client.id}`)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Analytics
                        </Button>
                        {canConfigure && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/client-portal/settings/${client.id}`)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Configurar
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteClient(client.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientPortal;
