import { useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { MappedProduct } from '@/lib/productFieldMapping';
import type { CreateProductData } from '@/hooks/useProducts';

interface ImportPreviewProps {
  products: MappedProduct[];
  errors: string[];
  warnings: string[];
  onConfirm: (products: CreateProductData[]) => Promise<number>;
  onCancel: () => void;
}

export const ImportPreview = ({ 
  products, 
  errors, 
  warnings, 
  onConfirm, 
  onCancel 
}: ImportPreviewProps) => {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; total: number } | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
  };

  const handleConfirm = async () => {
    setImporting(true);
    setImportProgress(10);

    try {
      const productData: CreateProductData[] = products.map(p => ({
        name: p.name,
        image_url: p.image_url,
        category: p.category,
        sku: p.sku,
        price: p.price,
        sizes: p.sizes || [],
        is_active: p.is_active ?? true,
      }));

      setImportProgress(50);
      const count = await onConfirm(productData);
      setImportProgress(100);
      setImportResult({ success: count, total: products.length });
    } catch (err) {
      setImportResult({ success: 0, total: products.length });
    } finally {
      setImporting(false);
    }
  };

  if (importResult) {
    return (
      <div className="space-y-4">
        <Alert variant={importResult.success === importResult.total ? 'default' : 'destructive'}>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {importResult.success} de {importResult.total} productos importados exitosamente.
          </AlertDescription>
        </Alert>
        <Button onClick={onCancel} className="w-full">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>{products.length} productos válidos</span>
        </div>
        {errors.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>{errors.length} errores</span>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>{warnings.length} advertencias</span>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-1">
              {errors.slice(0, 5).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
              {errors.length > 5 && (
                <li>...y {errors.length - 5} errores más</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-1">
              {warnings.slice(0, 3).map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
              {warnings.length > 3 && (
                <li>...y {warnings.length - 3} más</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Product Preview Grid */}
      {products.length > 0 && (
        <ScrollArea className="h-[300px] border rounded-lg p-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.slice(0, 12).map((product, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-2 bg-card text-card-foreground"
              >
                <div className="aspect-square relative bg-muted rounded overflow-hidden mb-2">
                  {failedImages.has(index) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                    />
                  )}
                </div>
                <p className="text-xs font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {product.category}
                  </Badge>
                  {product.price && (
                    <span className="text-[10px] text-muted-foreground">
                      ${product.price}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {products.length > 12 && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              ...y {products.length - 12} productos más
            </p>
          )}
        </ScrollArea>
      )}

      {/* Progress */}
      {importing && (
        <div className="space-y-2">
          <Progress value={importProgress} />
          <p className="text-sm text-center text-muted-foreground">
            Importando productos...
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={importing}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          className="flex-1"
          disabled={products.length === 0 || importing}
        >
          {importing ? 'Importando...' : `Importar ${products.length} Productos`}
        </Button>
      </div>
    </div>
  );
};
