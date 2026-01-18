import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Webhook, WEBHOOK_EVENTS, WebhookEvent } from '@/hooks/useWebhooks';

interface WebhookFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { url: string; events: WebhookEvent[] }) => Promise<void>;
  webhook?: Webhook | null;
}

export const WebhookForm = ({ open, onClose, onSave, webhook }: WebhookFormProps) => {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (webhook) {
      setUrl(webhook.url);
      setSelectedEvents(webhook.events);
    } else {
      setUrl('');
      setSelectedEvents([]);
    }
  }, [webhook, open]);

  const toggleEvent = (eventId: WebhookEvent) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAll = () => {
    setSelectedEvents(WEBHOOK_EVENTS.map(e => e.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || selectedEvents.length === 0) return;

    setSaving(true);
    try {
      await onSave({ url, events: selectedEvents });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {webhook ? 'Editar Webhook' : 'Nuevo Webhook'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>URL del Endpoint</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tu-servidor.com/webhook"
              required
            />
            <p className="text-xs text-muted-foreground">
              Las solicitudes se enviarán via POST con firma HMAC
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Eventos</Label>
              <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                Seleccionar todos
              </Button>
            </div>
            
            <div className="space-y-2">
              {WEBHOOK_EVENTS.map(event => (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                  onClick={() => toggleEvent(event.id)}
                >
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving || !url || selectedEvents.length === 0}
            >
              {saving ? 'Guardando...' : webhook ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
