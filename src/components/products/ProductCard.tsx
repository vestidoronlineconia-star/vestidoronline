import { Package, MoreVertical, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export const ProductCard = ({
  product,
  selected,
  onSelect,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductCardProps) => {
  return (
    <Card className={`relative overflow-hidden transition-all ${selected ? 'ring-2 ring-primary' : ''} ${!product.is_active ? 'opacity-60' : ''}`}>
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="bg-background"
        />
      </div>
      
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleStatus}>
              {product.is_active ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="aspect-square bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <div className="space-y-1">
          <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            {!product.is_active && (
              <Badge variant="outline" className="text-xs">
                Inactivo
              </Badge>
            )}
          </div>
          
          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
          
          {product.sizes.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Talles: {product.sizes.join(', ')}
            </p>
          )}
          
          {product.price && (
            <p className="text-sm font-medium">${product.price.toFixed(2)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
