import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminAccessRequests, AccessRequest } from '@/hooks/useAccessRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Globe, 
  Mail,
  MessageSquare,
  Loader2,
  RefreshCw,
  UserPlus,
  Link2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ApprovalMode = 'create' | 'link';
type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export default function AdminRequests() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { requests, existingClients, loading, approveRequest, approveRequestWithExistingClient, rejectRequest, refetch } = useAdminAccessRequests();
  
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Approval mode: create new client or link to existing
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('create');
  
  // Create new client form
  const [approveForm, setApproveForm] = useState({
    name: '',
    slug: '',
    allowed_domains: '',
  });
  
  // Link to existing client form
  const [linkForm, setLinkForm] = useState({
    clientId: '',
    role: 'editor' as TeamRole,
  });
  
  const [rejectReason, setRejectReason] = useState('');

  // Check for request ID in URL params
  useEffect(() => {
    const requestId = searchParams.get('id');
    if (requestId && requests.length > 0) {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        openApproveModal(request);
      }
    }
  }, [searchParams, requests]);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (role !== 'admin') {
        navigate('/');
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  const openApproveModal = (request: AccessRequest) => {
    setSelectedRequest(request);
    setApprovalMode('create');
    setApproveForm({
      name: request.company_name || '',
      slug: generateSlug(request.company_name || request.email),
      allowed_domains: request.website_url ? extractDomain(request.website_url) : '',
    });
    setLinkForm({
      clientId: '',
      role: 'editor',
    });
    setApproveModalOpen(true);
  };

  const openRejectModal = (request: AccessRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    
    if (approvalMode === 'create') {
      const domains = approveForm.allowed_domains
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      const result = await approveRequest(selectedRequest.id, {
        name: approveForm.name,
        slug: approveForm.slug,
        allowed_domains: domains,
      });

      if (result) {
        setApproveModalOpen(false);
        setSelectedRequest(null);
      }
    } else {
      // Link to existing client
      const result = await approveRequestWithExistingClient(
        selectedRequest.id,
        linkForm.clientId,
        linkForm.role
      );

      if (result) {
        setApproveModalOpen(false);
        setSelectedRequest(null);
      }
    }
    
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    const success = await rejectRequest(selectedRequest.id, rejectReason);
    setProcessing(false);
    
    if (success) {
      setRejectModalOpen(false);
      setSelectedRequest(null);
    }
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 30);
  };

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Rechazada</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Solicitudes de Acceso</h1>
              <p className="text-muted-foreground">Gestiona las solicitudes de acceso al portal</p>
            </div>
          </div>
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendientes ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprobadas ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rechazadas ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No hay solicitudes pendientes</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map(request => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  onApprove={() => openApproveModal(request)}
                  onReject={() => openRejectModal(request)}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No hay solicitudes aprobadas</p>
                </CardContent>
              </Card>
            ) : (
              approvedRequests.map(request => (
                <RequestCard 
                  key={request.id} 
                  request={request}
                  getStatusBadge={getStatusBadge}
                  showActions={false}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No hay solicitudes rechazadas</p>
                </CardContent>
              </Card>
            ) : (
              rejectedRequests.map(request => (
                <RequestCard 
                  key={request.id} 
                  request={request}
                  getStatusBadge={getStatusBadge}
                  showActions={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Approve Modal */}
        <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Aprobar Solicitud</DialogTitle>
              <DialogDescription>
                Configura el acceso para {selectedRequest?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* User info summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedRequest?.email}</span>
                </div>
                {selectedRequest?.company_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRequest.company_name}</span>
                  </div>
                )}
                {selectedRequest?.website_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={selectedRequest.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedRequest.website_url}
                    </a>
                  </div>
                )}
              </div>

              {/* Approval mode selector */}
              <RadioGroup 
                value={approvalMode} 
                onValueChange={(v) => setApprovalMode(v as ApprovalMode)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="create" id="create" className="peer sr-only" />
                  <Label
                    htmlFor="create"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <UserPlus className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Crear nuevo cliente</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="link" id="link" className="peer sr-only" />
                  <Label
                    htmlFor="link"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Link2 className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Vincular a existente</span>
                  </Label>
                </div>
              </RadioGroup>

              {/* Create new client form */}
              {approvalMode === 'create' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Nombre del Cliente</Label>
                    <Input
                      id="client_name"
                      value={approveForm.name}
                      onChange={(e) => setApproveForm({ ...approveForm, name: e.target.value })}
                      placeholder="Mi Tienda Online"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_slug">Slug (URL única)</Label>
                    <Input
                      id="client_slug"
                      value={approveForm.slug}
                      onChange={(e) => setApproveForm({ ...approveForm, slug: e.target.value })}
                      placeholder="mi-tienda-online"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allowed_domains">Dominios Permitidos (separados por coma)</Label>
                    <Input
                      id="allowed_domains"
                      value={approveForm.allowed_domains}
                      onChange={(e) => setApproveForm({ ...approveForm, allowed_domains: e.target.value })}
                      placeholder="mitienda.com, www.mitienda.com"
                    />
                  </div>
                </div>
              )}

              {/* Link to existing client form */}
              {approvalMode === 'link' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Cliente existente</Label>
                    <Select
                      value={linkForm.clientId}
                      onValueChange={(v) => setLinkForm({ ...linkForm, clientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingClients.length === 0 ? (
                          <SelectItem value="none" disabled>No hay clientes disponibles</SelectItem>
                        ) : (
                          existingClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.slug})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rol en el equipo</Label>
                    <Select
                      value={linkForm.role}
                      onValueChange={(v) => setLinkForm({ ...linkForm, role: v as TeamRole })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner - Control total</SelectItem>
                        <SelectItem value="admin">Admin - Gestión completa</SelectItem>
                        <SelectItem value="editor">Editor - Productos y branding</SelectItem>
                        <SelectItem value="viewer">Viewer - Solo lectura</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {linkForm.role === 'owner' && 'Puede eliminar el cliente y gestionar todo'}
                      {linkForm.role === 'admin' && 'Puede gestionar equipo, productos y configuración'}
                      {linkForm.role === 'editor' && 'Puede editar productos y branding'}
                      {linkForm.role === 'viewer' && 'Solo puede ver analytics e información'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setApproveModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleApprove} 
                  disabled={
                    processing || 
                    (approvalMode === 'create' && (!approveForm.name || !approveForm.slug)) ||
                    (approvalMode === 'link' && !linkForm.clientId)
                  } 
                  className="flex-1"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {approvalMode === 'create' ? 'Aprobar y Crear' : 'Aprobar y Vincular'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rechazar Solicitud</DialogTitle>
              <DialogDescription>
                Indica el motivo del rechazo para {selectedRequest?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reject_reason">Motivo del Rechazo</Label>
                <Textarea
                  id="reject_reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explica por qué se rechaza la solicitud..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={processing} className="flex-1">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Rechazar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface RequestCardProps {
  request: AccessRequest;
  onApprove?: () => void;
  onReject?: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  showActions?: boolean;
}

function RequestCard({ request, onApprove, onReject, getStatusBadge, showActions = true }: RequestCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {request.company_name || request.email}
              {getStatusBadge(request.status)}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {request.email}
              </span>
              <span>
                {format(new Date(request.created_at), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {request.website_url && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a href={request.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {request.website_url}
              </a>
            </div>
          )}
          {request.company_name && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{request.company_name}</span>
            </div>
          )}
        </div>

        {request.message && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">{request.message}</p>
            </div>
          </div>
        )}

        {request.rejection_reason && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              <strong>Motivo:</strong> {request.rejection_reason}
            </p>
          </div>
        )}

        {showActions && request.status === 'pending' && (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onReject} className="flex-1">
              <XCircle className="w-4 h-4 mr-2" />
              Rechazar
            </Button>
            <Button onClick={onApprove} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprobar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
