import { useWebhookDeliveries } from '@/hooks/useWebhooks';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock } from 'lucide-react';

interface WebhookHistoryProps {
  webhookId: string;
}

export const WebhookHistory = ({ webhookId }: WebhookHistoryProps) => {
  const { deliveries, loading } = useWebhookDeliveries(webhookId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No hay entregas recientes
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Últimas entregas</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
          >
            <div className="flex items-center gap-3">
              <Badge 
                variant={delivery.status_code && delivery.status_code < 300 ? 'default' : 'destructive'}
              >
                {delivery.status_code || 'Error'}
              </Badge>
              <span className="font-medium">{delivery.event_type}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              {delivery.duration_ms && (
                <span className="text-xs">{delivery.duration_ms}ms</span>
              )}
              <span className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {new Date(delivery.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
