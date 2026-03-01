import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TryOnHistoryItem {
  id: string;
  created_at: string;
  generated_image_url: string;
  generated_image_signed_url?: string;
  user_image_url: string | null;
  user_image_signed_url?: string | null;
  garment_image_url: string | null;
  view360_image_url: string | null;
  category: string;
  user_size: string | null;
  garment_size: string | null;
  fit_result: string | null;
  user_email: string | null;
}

export function useTryOnHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tryon_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error al cargar el historial');
        return;
      }

      // Generate signed URLs for storage paths
      const itemsWithUrls = await Promise.all(
        (data || []).map(async (item: any) => {
          const result: TryOnHistoryItem = { ...item };

          // If the URL looks like a storage path (not a full URL), generate signed URL
          if (item.generated_image_url && !item.generated_image_url.startsWith('http') && !item.generated_image_url.startsWith('data:')) {
            const { data: signedUrl } = await supabase.storage
              .from('tryon-results')
              .createSignedUrl(item.generated_image_url, 3600);
            result.generated_image_signed_url = signedUrl?.signedUrl || item.generated_image_url;
          } else {
            result.generated_image_signed_url = item.generated_image_url;
          }

          if (item.user_image_url && !item.user_image_url.startsWith('http') && !item.user_image_url.startsWith('data:')) {
            const { data: signedUrl } = await supabase.storage
              .from('tryon-results')
              .createSignedUrl(item.user_image_url, 3600);
            result.user_image_signed_url = signedUrl?.signedUrl || item.user_image_url;
          } else {
            result.user_image_signed_url = item.user_image_url;
          }

          return result;
        })
      );

      setHistory(itemsWithUrls);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteItem = async (id: string) => {
    try {
      // Find the item to get storage paths before deleting
      const itemToDelete = history.find(item => item.id === id);

      const { error } = await supabase
        .from('tryon_history')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error al eliminar');
        return false;
      }

      // Clean up storage files
      if (itemToDelete) {
        const pathsToRemove: string[] = [];
        if (itemToDelete.generated_image_url && !itemToDelete.generated_image_url.startsWith('http') && !itemToDelete.generated_image_url.startsWith('data:')) {
          pathsToRemove.push(itemToDelete.generated_image_url);
        }
        if (itemToDelete.user_image_url && !itemToDelete.user_image_url.startsWith('http') && !itemToDelete.user_image_url.startsWith('data:')) {
          pathsToRemove.push(itemToDelete.user_image_url);
        }
        if (pathsToRemove.length > 0) {
          await supabase.storage.from('tryon-results').remove(pathsToRemove);
        }
      }

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Eliminado del historial');
      return true;
    } catch (e) {
      toast.error('Error al eliminar');
      return false;
    }
  };

  const saveToHistory = async (data: Omit<TryOnHistoryItem, 'id' | 'created_at'> & { user_id: string }) => {
    try {
      const { error } = await supabase
        .from('tryon_history')
        .insert(data);

      if (error) {
        return false;
      }

      await fetchHistory();
      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    history,
    loading,
    deleteItem,
    saveToHistory,
    refetch: fetchHistory,
  };
}
