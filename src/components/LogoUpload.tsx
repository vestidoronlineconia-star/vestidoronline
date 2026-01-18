import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react';

interface LogoUploadProps {
  clientId: string;
  userId: string;
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

export const LogoUpload = ({ clientId, userId, currentLogoUrl, onLogoChange }: LogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadLogo = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande (máx 5MB)');
      return;
    }

    setUploading(true);
    try {
      // Compress image
      const compressed = await compressImage(file, 512, 0.8);
      
      // Generate unique filename
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${userId}/logos/${clientId}-${Date.now()}.${ext}`;

      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split('/user-uploads/')[1];
        if (oldPath) {
          await supabase.storage.from('user-uploads').remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, compressed.blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      onLogoChange(publicUrl);
      toast.success('Logo subido correctamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir el logo');
    } finally {
      setUploading(false);
    }
  }, [clientId, userId, currentLogoUrl, onLogoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadLogo(file);
  }, [uploadLogo]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
    e.target.value = '';
  }, [uploadLogo]);

  const removeLogo = useCallback(async () => {
    if (!currentLogoUrl) return;

    setUploading(true);
    try {
      const path = currentLogoUrl.split('/user-uploads/')[1];
      if (path) {
        await supabase.storage.from('user-uploads').remove([path]);
      }
      onLogoChange(null);
      toast.success('Logo eliminado');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Error al eliminar el logo');
    } finally {
      setUploading(false);
    }
  }, [currentLogoUrl, onLogoChange]);

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`
          relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer
          ${dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
        `}
        onClick={() => document.getElementById('logo-input')?.click()}
      >
        <input
          id="logo-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Subiendo...</p>
          </div>
        ) : currentLogoUrl ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              <img 
                src={currentLogoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Logo actual</p>
              <p className="text-xs text-muted-foreground">
                Arrastra o haz clic para reemplazar
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Arrastra tu logo aquí</p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, SVG, WebP (máx 5MB)
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('logo-input')?.click()}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir logo
        </Button>
        {currentLogoUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); removeLogo(); }}
            disabled={uploading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
