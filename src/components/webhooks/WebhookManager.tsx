import { useState } from 'react';
import { useWebhooks, Webhook, WEBHOOK_EVENTS, WebhookEvent } from '@/hooks/useWebhooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Play, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { WebhookForm } from './WebhookForm';
import { WebhookHistory } from './WebhookHistory';
import { toast } from 'sonner';

interface WebhookManagerProps {
  clientId: string;
}

export const WebhookManager = ({ clientId }: WebhookManagerProps) => {
  const { 
    webhooks, 
    loading, 
    createWebhook, 
    updateWebhook, 
    deleteWebhook, 
    toggleWebhookStatus, 
    regenerateSecret,
    testWebhook 
  } = useWebhooks(clientId);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleCreate = async (data: { url: string; events: WebhookEvent[] }) => {
    await createWebhook(data);
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: { url: string; events: WebhookEvent[] }) => {
    if (editingWebhook) {
      await updateWebhook(editingWebhook.id, data);
      setEditingWebhook(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este webhook?')) {
      await deleteWebhook(id);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const success = await testWebhook(id);
    setTestingId(null);
    if (success) {
      toast.success('Webhook de prueba enviado correctamente');
    }
  };

  const handleRegenerateSecret = async (id: string) => {
    if (confirm('¿Regenerar secret? Deberás actualizar la verificación en tu servidor.')) {
      await regenerateSecret(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await toggleWebhookStatus(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Recibe notificaciones HTTP cuando ocurran eventos en tu widget
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h4 className="text-lg font-medium mb-2">No hay webhooks configurados</h4>
            <p className="text-muted-foreground mb-4">
              Configura webhooks para recibir notificaciones en tiempo real
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {webhook.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-base font-mono">
                        {webhook.url}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {webhook.last_triggered_at && (
                          <>
                            <Clock className="w-3 h-3" />
                            Último: {new Date(webhook.last_triggered_at).toLocaleString()}
                            {webhook.last_status_code && (
                              <Badge variant={webhook.last_status_code < 300 ? 'default' : 'destructive'}>
                                {webhook.last_status_code}
                              </Badge>
                            )}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingId === webhook.id}
                    >
                      {testingId === webhook.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWebhook(selectedWebhook === webhook.id ? null : webhook.id)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingWebhook(webhook)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {webhook.events.map(event => (
                    <Badge key={event} variant="secondary">
                      {WEBHOOK_EVENTS.find(e => e.id === event)?.label || event}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Secret:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {webhook.secret.substring(0, 8)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateSecret(webhook.id)}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(webhook.id)}
                  >
                    {webhook.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>

                {selectedWebhook === webhook.id && (
                  <div className="mt-4 pt-4 border-t">
                    <WebhookHistory webhookId={webhook.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      <WebhookForm
        open={isFormOpen || !!editingWebhook}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWebhook(null);
        }}
        onSave={editingWebhook ? handleUpdate : handleCreate}
        webhook={editingWebhook}
      />
    </div>
  );
};
