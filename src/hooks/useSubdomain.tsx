import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientConfig {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  custom_title: string | null;
  theme_mode: string | null;
  enabled_categories: string[] | null;
  is_active: boolean;
}

interface UseSubdomainResult {
  clientConfig: ClientConfig | null;
  isSubdomain: boolean;
  subdomain: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to detect subdomain from URL and load the corresponding client configuration.
 * 
 * Examples:
 * - "tienda.tuapp.lovable.app" -> subdomain: "tienda"
 * - "localhost:8080" -> subdomain: null (not a subdomain)
 * - "tuapp.lovable.app" -> subdomain: null (main app)
 */
export const useSubdomain = (): UseSubdomainResult => {
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Extract subdomain from hostname
  const getSubdomain = (): string | null => {
    // Skip for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    const parts = hostname.split('.');
    
    // Check for Lovable preview/published URLs
    // Format: {subdomain}-preview--{project-id}.lovable.app or {subdomain}.{domain}.lovable.app
    if (hostname.includes('lovable.app')) {
      // For preview URLs like: tienda-preview--abc123.lovable.app
      if (hostname.includes('-preview--')) {
        const subdomainPart = hostname.split('-preview--')[0];
        // If it's just "id-preview--..." then no client subdomain
        if (subdomainPart === 'id') return null;
        return subdomainPart;
      }
      
      // For published URLs like: tienda.tudominio.lovable.app
      // We expect at least 4 parts: subdomain.app.lovable.app
      if (parts.length >= 4) {
        return parts[0];
      }
      return null;
    }

    // For custom domains: subdomain.customdomain.com
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  };

  const subdomain = getSubdomain();
  const isSubdomain = subdomain !== null;

  useEffect(() => {
    const loadClientConfig = async () => {
      if (!subdomain) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('embed_clients')
          .select(`
            id,
            name,
            slug,
            logo_url,
            primary_color,
            secondary_color,
            background_color,
            text_color,
            custom_title,
            theme_mode,
            enabled_categories,
            is_active
          `)
          .eq('slug', subdomain)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Tienda no encontrada');
          setClientConfig(null);
        } else {
          setClientConfig(data as ClientConfig);
        }
      } catch (err) {
        console.error('Error loading client config:', err);
        setError('Error al cargar la tienda');
      } finally {
        setLoading(false);
      }
    };

    loadClientConfig();
  }, [subdomain]);

  return {
    clientConfig,
    isSubdomain,
    subdomain,
    loading,
    error,
  };
};
