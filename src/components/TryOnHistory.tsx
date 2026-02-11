import { useState } from 'react';
import { useTryOnHistory, TryOnHistoryItem } from '@/hooks/useTryOnHistory';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Download, Trash2, X, Eye, RotateCw, Calendar, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    buzo: 'Buzo/Hoodie',
    remera: 'Remera',
    camisa: 'Camisa',
    vestido: 'Vestido',
    falda: 'Falda',
    pantalon: 'Pantalón',
    zapatos: 'Calzado',
  };
  return labels[category] || category;
};

const getFitColor = (fit: string | null): string => {
  if (!fit) return 'bg-muted text-muted-foreground';
  if (fit.toLowerCase().includes('ideal') || fit.toLowerCase().includes('perfecto')) {
    return 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30';
  }
  if (fit.toLowerCase().includes('ajustado') || fit.toLowerCase().includes('holgado')) {
    return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30';
  }
  return 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30';
};

interface HistoryItemCardProps {
  item: TryOnHistoryItem;
  onView: (item: TryOnHistoryItem) => void;
  onDelete: (id: string) => void;
}

function HistoryItemCard({ item, onView, onDelete }: HistoryItemCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-[3/4]">
        <img
          src={item.generated_image_signed_url || item.generated_image_url}
          alt={`Try-on ${getCategoryLabel(item.category)}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
            onClick={() => onView(item)}
          >
            <Eye className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
            onClick={() => handleDownload(item.generated_image_signed_url || item.generated_image_url, `tryon-${item.id}.jpg`)}
          >
            <Download className="h-5 w-5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 bg-red-500/20 hover:bg-red-500/40 text-red-300"
                disabled={deleting}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta prueba?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente esta imagen del historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* 360 badge */}
        {item.view360_image_url && (
          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
            360
          </div>
        )}
      </div>

      {/* Card footer info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{getCategoryLabel(item.category)}</span>
          {item.fit_result && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getFitColor(item.fit_result)}`}>
              {item.fit_result}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(item.created_at), 'dd MMM yyyy', { locale: es })}
          </span>
          {(item.user_size || item.garment_size) && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {item.user_size} → {item.garment_size}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

interface DetailModalProps {
  item: TryOnHistoryItem | null;
  open: boolean;
  onClose: () => void;
}

function DetailModal({ item, open, onClose }: DetailModalProps) {
  const [showView360, setShowView360] = useState(false);

  if (!item) return null;

  const currentImage = showView360 && item.view360_image_url 
    ? item.view360_image_url 
    : (item.generated_image_signed_url || item.generated_image_url);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = showView360 ? `tryon-360-${item.id}.jpg` : `tryon-${item.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Detalle de prueba virtual</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="p-4 grid md:grid-cols-2 gap-4">
          {/* Main image */}
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            <img
              src={currentImage}
              alt="Generated try-on"
              className="w-full h-full object-cover"
            />
            
            {/* Toggle 360 */}
            {item.view360_image_url && (
              <div className="absolute top-2 left-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20"
                  onClick={() => setShowView360(!showView360)}
                >
                  {showView360 ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver original
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Ver 360
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Details sidebar */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{getCategoryLabel(item.category)}</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block text-xs mb-1">Tu talle</span>
                  <span className="font-medium">{item.user_size || '—'}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block text-xs mb-1">Talle prenda</span>
                  <span className="font-medium">{item.garment_size || '—'}</span>
                </div>
              </div>

              {item.fit_result && (
                <div className={`p-3 rounded-lg ${getFitColor(item.fit_result)}`}>
                  <span className="text-xs block mb-1 opacity-80">Resultado de calce</span>
                  <span className="font-medium">{item.fit_result}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Creado el {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-2 gap-2">
              {item.user_image_signed_url && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Tu foto</span>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={item.user_image_signed_url} 
                      alt="User" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {item.garment_image_url && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Prenda</span>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={item.garment_image_url} 
                      alt="Garment" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TryOnHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TryOnHistory({ isOpen, onClose }: TryOnHistoryProps) {
  const { user } = useAuth();
  const { history, loading, deleteItem } = useTryOnHistory();
  const [selectedItem, setSelectedItem] = useState<TryOnHistoryItem | null>(null);

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de pruebas</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Inicia sesión para ver tu historial de pruebas virtuales.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <DialogTitle>Historial de pruebas</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[3/4] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-light mb-2">Sin historial aún</p>
                <p className="text-sm">Tus pruebas virtuales aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => (
                  <HistoryItemCard
                    key={item.id}
                    item={item}
                    onView={setSelectedItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DetailModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
