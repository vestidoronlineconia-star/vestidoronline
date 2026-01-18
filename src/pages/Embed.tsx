import { useSearchParams } from 'react-router-dom';
import { useEmbedClient } from '@/hooks/useEmbedClient';
import { EmbedTryOn } from '@/components/EmbedTryOn';
import { Loader2, AlertCircle } from 'lucide-react';

const Embed = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const garmentUrl = searchParams.get('garment');

  const { config, loading, error, trackUsage } = useEmbedClient(clientId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-semibold mb-2">Error de Configuración</h1>
          <p className="text-muted-foreground">
            {error === 'Domain not authorized' 
              ? 'Este dominio no está autorizado para usar este widget.'
              : error === 'Client not found or inactive'
              ? 'Cliente no encontrado o inactivo.'
              : 'No se pudo cargar la configuración del widget.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmbedTryOn
      config={config}
      initialGarmentUrl={garmentUrl || undefined}
      trackUsage={trackUsage}
    />
  );
};

export default Embed;
