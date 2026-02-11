import { useState, useEffect } from 'react';
import { Product } from '@/hooks/useProducts';
import { ClientConfig } from '@/hooks/useClientBySlug';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { LoadingProgress } from '@/components/LoadingProgress';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import { toast } from 'sonner';
import { Sparkles, RotateCcw, Download } from 'lucide-react';
import type { FileData, TryOnStatus } from '@/types';

// Convert a data URL (base64) to a Blob
const base64ToBlob = (dataUrl: string): Blob => {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
};

// Save images to storage and history in background (non-blocking)
const saveToStorageAndHistory = async (
  userId: string,
  userEmail: string | undefined,
  userPhotoFile: File,
  resultBase64: string,
  category: string,
  selectedSize: string | null,
) => {
  try {
    const timestamp = Date.now();
    const compressed = await compressImage(userPhotoFile, 1024, 0.7);
    const resultBlob = base64ToBlob(resultBase64);

    const userPath = `${userId}/${timestamp}-user.jpg`;
    const resultPath = `${userId}/${timestamp}-result.jpg`;

    const [userUpload, resultUpload] = await Promise.all([
      supabase.storage.from('tryon-results').upload(userPath, compressed.blob, { contentType: 'image/jpeg' }),
      supabase.storage.from('tryon-results').upload(resultPath, resultBlob, { contentType: 'image/jpeg' }),
    ]);

    if (userUpload.error) {
      console.error('User photo upload error:', userUpload.error);
      toast.warning('No se pudo guardar la foto en el historial');
      return;
    }
    if (resultUpload.error) {
      console.error('Result upload error:', resultUpload.error);
      toast.warning('No se pudo guardar el resultado en el historial');
      return;
    }

    const { error: insertError } = await supabase.from('tryon_history').insert({
      user_id: userId,
      user_email: userEmail || null,
      user_image_url: userPath,
      generated_image_url: resultPath,
      category,
      user_size: selectedSize || null,
      garment_size: selectedSize || null,
    });

    if (insertError) {
      console.error('History insert error:', insertError);
      toast.warning('No se pudo registrar en el historial');
    } else {
      toast.success('Resultado guardado en tu historial');
    }
  } catch (e) {
    console.error('Error saving to storage/history:', e);
    toast.warning('No se pudo guardar en el historial');
  }
};

interface TryOnWidgetProps {
  product: Product;
  selectedSize: string | null;
  clientConfig: ClientConfig;
}

// Convert image URL to base64
const imageToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 without the data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const TryOnWidget = ({ product, selectedSize, clientConfig }: TryOnWidgetProps) => {
  const { user } = useAuth();
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
      // Convert user photo to base64
      let userBase64: string;
      if (userPhoto.preview.startsWith('blob:')) {
        // For blob URLs, read from the file directly
        userBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(userPhoto.file);
        });
      } else {
        userBase64 = await imageToBase64(userPhoto.preview);
      }

      // Convert garment image to base64
      const garmentBase64 = await imageToBase64(product.image_url);

      // Step 1: Analyze images
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'analyze',
          userImage: userBase64,
          clothImage: garmentBase64,
          category: product.category,
          clientId: clientConfig.id,
        },
      });

      if (analyzeError) throw analyzeError;
      if (!analyzeData?.analysis) throw new Error('No se pudo analizar las imágenes');

      setStatus('creating');

      // Step 2: Generate try-on image
      const { data: generateData, error: generateError } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'generate',
          userImage: userBase64,
          clothImage: garmentBase64,
          category: product.category,
          analysis: analyzeData.analysis,
          userSize: selectedSize || 'M',
          garmentSize: selectedSize || 'M',
          clientId: clientConfig.id,
        },
      });

      if (generateError) throw generateError;

      if (generateData?.image) {
        setResultImage(generateData.image);
        setStatus('complete');
        
        // Log usage
        await supabase.from('embed_usage').insert({
          client_id: clientConfig.id,
          action: 'tryon',
          category: product.category,
          referer_domain: window.location.hostname,
        });

        // Save to storage and history
        if (user && userPhoto?.file) {
          console.log('Saving to storage and history for user:', user.id);
          try {
            await saveToStorageAndHistory(
              user.id,
              user.email,
              userPhoto.file,
              generateData.image,
              product.category,
              selectedSize,
            );
          } catch (saveErr) {
            console.error('Failed to save to history:', saveErr);
            toast.warning('No se pudo guardar en el historial');
          }
        } else {
          console.log('Skipping history save - user:', !!user, 'userPhoto.file:', !!userPhoto?.file);
        }
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
