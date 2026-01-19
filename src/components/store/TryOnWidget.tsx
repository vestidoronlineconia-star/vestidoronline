import { useState, useEffect } from 'react';
import { Product } from '@/hooks/useProducts';
import { ClientConfig } from '@/hooks/useSubdomain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { LoadingProgress } from '@/components/LoadingProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, RotateCcw, Download } from 'lucide-react';
import type { FileData, TryOnStatus } from '@/types';

interface TryOnWidgetProps {
  product: Product;
  selectedSize: string | null;
  clientConfig: ClientConfig;
}

export const TryOnWidget = ({ product, selectedSize, clientConfig }: TryOnWidgetProps) => {
  const [userPhoto, setUserPhoto] = useState<FileData | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulate progress based on status
  useEffect(() => {
    if (status === 'analyzing') setProgress(20);
    else if (status === 'creating') setProgress(60);
    else if (status === 'adjusting') setProgress(90);
    else if (status === 'complete') setProgress(100);
    else setProgress(0);
  }, [status]);

  const handleTryOn = async () => {
    if (!userPhoto) {
      toast.error('Por favor sube una foto tuya');
      return;
    }

    setStatus('analyzing');
    setErrorMessage(null);

    try {
      // Get public URL for garment image
      const garmentUrl = product.image_url;
      
      // Upload user photo if it's a blob
      let userPhotoUrl = userPhoto.preview;
      if (userPhoto.preview.startsWith('blob:')) {
        const fileName = `tryon/${Date.now()}-user.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, userPhoto.file, { contentType: userPhoto.file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);
        
        userPhotoUrl = urlData.publicUrl;
      }

      setStatus('creating');

      // Call the virtual-tryon edge function
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          userImageUrl: userPhotoUrl,
          garmentImageUrl: garmentUrl,
          category: product.category,
        },
      });

      if (error) throw error;

      if (data?.resultImageUrl) {
        setResultImage(data.resultImageUrl);
        setStatus('complete');
        
        // Log usage
        await supabase.from('embed_usage').insert({
          client_id: clientConfig.id,
          action: 'tryon',
          category: product.category,
          referer_domain: window.location.hostname,
        });
      } else {
        throw new Error('No se recibió la imagen resultado');
      }
    } catch (err) {
      console.error('Try-on error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Error al procesar');
      toast.error('Error al procesar la prueba virtual');
    }
  };

  const handleReset = () => {
    setUserPhoto(null);
    setResultImage(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `tryon-${product.name}.jpg`;
    link.click();
  };

  const brandStyles = {
    '--client-primary': clientConfig.primary_color || '#8B5CF6',
  } as React.CSSProperties;

  // Show result
  if (status === 'complete' && resultImage) {
    return (
      <div className="space-y-4" style={brandStyles}>
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
          <img
            src={resultImage}
            alt="Resultado del probador virtual"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Probar otra vez
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleDownload}
            style={{ backgroundColor: 'var(--client-primary)' }}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        </div>
      </div>
    );
  }

  // Show loading
  if (status !== 'idle' && status !== 'error') {
    return (
      <div className="py-12">
        <LoadingProgress status={status} progress={progress} />
      </div>
    );
  }

  // Show upload form
  return (
    <div className="space-y-6" style={brandStyles}>
      <div className="grid md:grid-cols-2 gap-4">
      {/* User Photo */}
      <Card className="p-4">
        <h3 className="font-medium mb-3 text-center">Tu foto</h3>
        {userPhoto ? (
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            <img
                src={userPhoto.preview}
                alt="Tu foto"
                className="w-full h-full object-cover"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => setUserPhoto(null)}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <FileUpload
              onFileSelect={setUserPhoto}
              label="Sube tu foto"
              preview={null}
              id="tryon-user-photo"
              icon="user"
            />
          )}
        </Card>

        {/* Garment Preview */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-center">Prenda seleccionada</h3>
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {selectedSize && (
              <div 
                className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--client-primary)' }}
              >
                Talle {selectedSize}
              </div>
            )}
          </div>
        </Card>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-center">
          {errorMessage}
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!userPhoto}
        onClick={handleTryOn}
        style={{ backgroundColor: 'var(--client-primary)' }}
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Generar prueba virtual
      </Button>
    </div>
  );
};
