import { useState, useMemo } from 'react';
import { Product } from '@/hooks/useProducts';
import { ClientConfig } from '@/hooks/useSubdomain';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TryOnWidget } from './TryOnWidget';

interface ProductDetailModalProps {
  product: Product | null;
  clientConfig: ClientConfig;
  onClose: () => void;
}

export const ProductDetailModal = ({ product, clientConfig, onClose }: ProductDetailModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  // Reset state when product changes
  useMemo(() => {
    if (product) {
      setSelectedSize(null);
      setShowTryOn(false);
    }
  }, [product?.id]);

  if (!product) return null;

  const stockBySize = product.stock_by_size || {};
  const sizes = product.sizes || [];
  
  const getStockForSize = (size: string): number => {
    return stockBySize[size] ?? 0;
  };

  const totalStock = Object.values(stockBySize).reduce((sum: number, qty: number) => sum + qty, 0) || product.total_stock;
  const isOutOfStock = totalStock === 0;

  const brandStyles = {
    '--client-primary': clientConfig.primary_color || '#8B5CF6',
    '--client-secondary': clientConfig.secondary_color || '#A78BFA',
  } as React.CSSProperties;

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0"
        style={brandStyles}
      >
        {showTryOn ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-xl">Probar prenda</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowTryOn(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <TryOnWidget
              product={product}
              selectedSize={selectedSize}
              clientConfig={clientConfig}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="aspect-square relative bg-muted">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Badge variant="destructive" className="text-lg py-2 px-4">
                    Agotado
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6 flex flex-col">
              <DialogHeader className="text-left mb-4">
                <DialogTitle className="text-2xl">{product.name}</DialogTitle>
                {product.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                )}
              </DialogHeader>

              {product.price && (
                <p 
                  className="text-3xl font-bold mb-4"
                  style={{ color: 'var(--client-primary)' }}
                >
                  ${product.price.toLocaleString()}
                </p>
              )}

              {product.description && (
                <p className="text-muted-foreground mb-6">{product.description}</p>
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Talle</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => {
                      const stock = getStockForSize(size);
                      const isAvailable = stock > 0;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                          className={cn(
                            "relative min-w-[60px] px-4 py-2 rounded-lg border-2 transition-all font-medium",
                            selectedSize === size
                              ? "border-primary bg-primary/10"
                              : isAvailable
                                ? "border-border hover:border-primary/50"
                                : "border-border/50 opacity-50 cursor-not-allowed line-through"
                          )}
                          style={selectedSize === size ? { borderColor: 'var(--client-primary)' } : undefined}
                        >
                          {size}
                          {isAvailable && stock <= 3 && (
                            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {stock}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {getStockForSize(selectedSize)} disponibles
                    </p>
                  )}
                </div>
              )}

              {/* Try-On Button */}
              <div className="mt-auto pt-4">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={isOutOfStock || (sizes.length > 0 && !selectedSize)}
                  onClick={() => setShowTryOn(true)}
                  style={{ 
                    backgroundColor: 'var(--client-primary)',
                    color: 'white'
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Probar prenda virtualmente
                </Button>
                {sizes.length > 0 && !selectedSize && !isOutOfStock && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Selecciona un talle para continuar
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
