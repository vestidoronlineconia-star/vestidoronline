import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SizeGuide, SizeDefinition } from '@/lib/calculateFit';

interface UseSizeGuideResult {
  sizeGuides: SizeGuide[];
  loading: boolean;
  error: string | null;
  getSizeGuideForCategory: (category: string) => SizeGuide | null;
  saveSizeGuide: (guide: Omit<SizeGuide, 'id'>) => Promise<boolean>;
  deleteSizeGuide: (category: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useSizeGuide = (clientId: string | undefined): UseSizeGuideResult => {
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSizeGuides = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('size_guides')
        .select('*')
        .eq('client_id', clientId);

      if (fetchError) throw fetchError;

      // Parse the sizes JSONB field
      const parsed: SizeGuide[] = (data || []).map((row: any) => ({
        id: row.id,
        client_id: row.client_id,
        category: row.category,
        size_system: row.size_system as 'letter' | 'numeric' | 'cm',
        sizes: row.sizes as SizeDefinition[],
      }));

      setSizeGuides(parsed);
    } catch (e) {
      console.error('Error fetching size guides:', e);
      setError('Error al cargar guías de talles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizeGuides();
  }, [clientId]);

  const getSizeGuideForCategory = (category: string): SizeGuide | null => {
    return sizeGuides.find(g => g.category === category) || null;
  };

  const saveSizeGuide = async (guide: Omit<SizeGuide, 'id'>): Promise<boolean> => {
    if (!clientId) return false;

    try {
      // Check if guide already exists for this category
      const existing = sizeGuides.find(g => g.category === guide.category);

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('size_guides')
          .update({
            size_system: guide.size_system,
            sizes: JSON.parse(JSON.stringify(guide.sizes)),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('size_guides')
          .insert([{
            client_id: clientId,
            category: guide.category,
            size_system: guide.size_system,
            sizes: JSON.parse(JSON.stringify(guide.sizes)),
          }]);

        if (insertError) throw insertError;
      }

      await fetchSizeGuides();
      return true;
    } catch (e) {
      console.error('Error saving size guide:', e);
      return false;
    }
  };

  const deleteSizeGuide = async (category: string): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('size_guides')
        .delete()
        .eq('client_id', clientId)
        .eq('category', category);

      if (deleteError) throw deleteError;

      await fetchSizeGuides();
      return true;
    } catch (e) {
      console.error('Error deleting size guide:', e);
      return false;
    }
  };

  return {
    sizeGuides,
    loading,
    error,
    getSizeGuideForCategory,
    saveSizeGuide,
    deleteSizeGuide,
    refetch: fetchSizeGuides,
  };
};
