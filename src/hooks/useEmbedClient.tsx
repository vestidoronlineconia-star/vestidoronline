import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmbedClientConfig {
  id: string;
  name: string;
  slug: string;
  allowed_domains: string[];
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  custom_title: string;
  cta_text: string;
  enabled_categories: string[];
  show_size_selector: boolean;
  show_fit_result: boolean;
  is_active: boolean;
  monthly_limit: number;
  current_month_usage: number;
  // New customization fields
  placeholder_photo: string;
  placeholder_garment: string;
  error_message: string;
  button_style: 'rounded' | 'square' | 'pill';
  entry_animation: 'fade' | 'slide' | 'none';
  theme_mode: 'dark' | 'light' | 'auto';
}

interface UseEmbedClientResult {
  config: EmbedClientConfig | null;
  loading: boolean;
  error: string | null;
  isValidDomain: boolean;
  trackUsage: (action: string, category?: string) => Promise<void>;
}

export function useEmbedClient(clientId: string | null): UseEmbedClientResult {
  const [config, setConfig] = useState<EmbedClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidDomain, setIsValidDomain] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setError('No client ID provided');
      return;
    }

    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('embed_clients')
          .select('*')
          .eq('slug', clientId)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) {
          throw new Error('Failed to load client configuration');
        }

        if (!data) {
          throw new Error('Client not found or inactive');
        }

        // Validate referrer domain
        const referrer = document.referrer;
        let referrerDomain = '';
        
        if (referrer) {
          try {
            const url = new URL(referrer);
            referrerDomain = url.hostname;
          } catch {
            referrerDomain = '';
          }
        }

        // Check if we're in development or the domain is allowed
        const isDev = window.location.hostname === 'localhost' || 
                      window.location.hostname.includes('lovable');
        const domainAllowed = data.allowed_domains.length === 0 || 
                              data.allowed_domains.some((d: string) => 
                                referrerDomain === d || 
                                referrerDomain.endsWith('.' + d)
                              );

        if (!isDev && !domainAllowed && referrer) {
          setIsValidDomain(false);
          throw new Error('Domain not authorized');
        }

        setIsValidDomain(true);
        setConfig(data as EmbedClientConfig);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [clientId]);

  const trackUsage = async (action: string, category?: string) => {
    if (!config) return;

    const referrer = document.referrer;
    let referrerDomain = '';
    
    if (referrer) {
      try {
        const url = new URL(referrer);
        referrerDomain = url.hostname;
      } catch {
        referrerDomain = '';
      }
    }

    await supabase.from('embed_usage').insert({
      client_id: config.id,
      action,
      category: category || null,
      referer_domain: referrerDomain || null,
    });
  };

  return { config, loading, error, isValidDomain, trackUsage };
}
