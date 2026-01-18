import { useState } from 'react';
import { Package, Search, Upload, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePublicProducts, type Product } from '@/hooks/useProducts';

interface ProductSelectorProps {
  clientId: string;
  category: string | null;
  onSelect: (product: Product) => void;
  onManualUpload: () => void;
}

export const ProductSelector = ({
  clientId,
  category,
  onSelect,
  onManualUpload,
}: ProductSelectorProps) => {
  const { products, loading } = usePublicProducts(clientId, category);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Button
        variant="outline"
        className="w-full h-auto py-4 flex flex-col gap-2"
        onClick={onManualUpload}
      >
        <Upload className="h-6 w-6" />
        <span>Subir imagen de prenda</span>
      </Button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Seleccionar del catálogo ({products.length})</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <div className="space-y-2 border rounded-lg p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-48">
            <div className="grid grid-cols-3 gap-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    setIsOpen(false);
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <p className="text-[10px] text-white font-medium line-clamp-1">
                      {product.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No se encontraron productos
              </div>
            )}
          </ScrollArea>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onManualUpload}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir imagen manual
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
