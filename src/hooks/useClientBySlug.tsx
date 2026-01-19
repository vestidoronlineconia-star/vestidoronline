import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientConfig {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  logo_url: string | null;
  custom_title: string | null;
  cta_text: string | null;
  enabled_categories: string[] | null;
  show_size_selector: boolean | null;
  show_fit_result: boolean | null;
  is_active: boolean | null;
  theme_mode: string | null;
}

interface UseClientBySlugResult {
  clientConfig: ClientConfig | null;
  loading: boolean;
  error: string | null;
}

export const useClientBySlug = (slug: string | undefined): UseClientBySlugResult => {
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Tienda no especificada');
      return;
    }

    const loadClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('embed_clients')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching client:', fetchError);
          setError('Error al cargar la tienda');
          setClientConfig(null);
        } else if (!data) {
          setError('Tienda no encontrada');
          setClientConfig(null);
        } else {
          setClientConfig(data as ClientConfig);
          setError(null);
        }
      } catch (e) {
        console.error('Unexpected error:', e);
        setError('Error inesperado');
        setClientConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [slug]);

  return { clientConfig, loading, error };
};
