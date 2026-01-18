import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TryOnHistoryItem {
  id: string;
  created_at: string;
  generated_image_url: string;
  user_image_url: string | null;
  garment_image_url: string | null;
  view360_image_url: string | null;
  category: string;
  user_size: string | null;
  garment_size: string | null;
  fit_result: string | null;
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
        console.error('Error fetching history:', error);
        toast.error('Error al cargar el historial');
        return;
      }

      setHistory(data || []);
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tryon_history')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error al eliminar');
        return false;
      }

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Eliminado del historial');
      return true;
    } catch (e) {
      console.error('Error deleting:', e);
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
        console.error('Error saving to history:', error);
        return false;
      }

      await fetchHistory();
      return true;
    } catch (e) {
      console.error('Error saving:', e);
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
