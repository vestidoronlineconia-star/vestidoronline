import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const WEBHOOK_EVENTS = [
  { id: 'tryon.completed', label: 'Try-On Completado', description: 'Cuando un usuario genera un try-on exitoso' },
  { id: 'tryon.failed', label: 'Try-On Fallido', description: 'Cuando un try-on falla' },
  { id: 'view360.completed', label: 'Vista 360 Completada', description: 'Cuando se genera una vista 360' },
  { id: 'usage.limit_warning', label: 'Alerta de Límite', description: 'Cuando se alcanza el 80% del límite mensual' },
  { id: 'usage.limit_reached', label: 'Límite Alcanzado', description: 'Cuando se alcanza el límite mensual' },
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]['id'];

export interface Webhook {
  id: string;
  client_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  last_status_code: number | null;
  failure_count: number;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface CreateWebhookData {
  url: string;
  events: WebhookEvent[];
  is_active?: boolean;
}

export const useWebhooks = (clientId: string | null) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    if (!clientId) {
      setWebhooks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_webhooks')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setWebhooks((data || []) as Webhook[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading webhooks';
      setError(message);
      console.error('Error fetching webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (webhookData: CreateWebhookData): Promise<Webhook | null> => {
    if (!clientId) return null;

    try {
      const { data, error: createError } = await supabase
        .from('client_webhooks')
        .insert({
          client_id: clientId,
          ...webhookData,
        })
        .select()
        .single();

      if (createError) throw createError;

      const typedData = data as Webhook;
      setWebhooks(prev => [typedData, ...prev]);
      toast.success('Webhook creado correctamente');
      return typedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating webhook';
      toast.error(message);
      console.error('Error creating webhook:', err);
      return null;
    }
  };

  const updateWebhook = async (webhookId: string, updateData: Partial<CreateWebhookData>): Promise<Webhook | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('client_webhooks')
        .update(updateData)
        .eq('id', webhookId)
        .select()
        .single();

      if (updateError) throw updateError;

      const typedData = data as Webhook;
      setWebhooks(prev => prev.map(w => w.id === webhookId ? typedData : w));
      toast.success('Webhook actualizado correctamente');
      return typedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating webhook';
      toast.error(message);
      console.error('Error updating webhook:', err);
      return null;
    }
  };

  const deleteWebhook = async (webhookId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('client_webhooks')
        .delete()
        .eq('id', webhookId);

      if (deleteError) throw deleteError;

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      toast.success('Webhook eliminado correctamente');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting webhook';
      toast.error(message);
      console.error('Error deleting webhook:', err);
      return false;
    }
  };

  const toggleWebhookStatus = async (webhookId: string): Promise<boolean> => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return false;

    try {
      const { error: updateError } = await supabase
        .from('client_webhooks')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhookId);

      if (updateError) throw updateError;

      setWebhooks(prev => prev.map(w => 
        w.id === webhookId ? { ...w, is_active: !w.is_active } : w
      ));
      toast.success(webhook.is_active ? 'Webhook desactivado' : 'Webhook activado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating webhook status';
      toast.error(message);
      console.error('Error toggling webhook status:', err);
      return false;
    }
  };

  const regenerateSecret = async (webhookId: string): Promise<string | null> => {
    try {
      const newSecret = crypto.randomUUID();
      
      const { error: updateError } = await supabase
        .from('client_webhooks')
        .update({ secret: newSecret })
        .eq('id', webhookId);

      if (updateError) throw updateError;

      setWebhooks(prev => prev.map(w => 
        w.id === webhookId ? { ...w, secret: newSecret } : w
      ));
      toast.success('Secret regenerado correctamente');
      return newSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error regenerating secret';
      toast.error(message);
      console.error('Error regenerating secret:', err);
      return null;
    }
  };

  const testWebhook = async (webhookId: string): Promise<boolean> => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return false;

    try {
      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook delivery',
          webhook_id: webhookId,
        },
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Timestamp': new Date().toISOString(),
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast.success('Webhook de prueba enviado correctamente');
        return true;
      } else {
        toast.error(`Error: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error testing webhook';
      toast.error(message);
      console.error('Error testing webhook:', err);
      return false;
    }
  };

  return {
    webhooks,
    loading,
    error,
    refetch: fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhookStatus,
    regenerateSecret,
    testWebhook,
  };
};

export const useWebhookDeliveries = (webhookId: string | null) => {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!webhookId) {
        setDeliveries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('webhook_deliveries')
          .select('*')
          .eq('webhook_id', webhookId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        setDeliveries((data || []) as WebhookDelivery[]);
      } catch (err) {
        console.error('Error fetching webhook deliveries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [webhookId]);

  return { deliveries, loading };
};
