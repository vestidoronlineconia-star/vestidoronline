import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CATEGORIES } from '@/lib/categories';
import type { Product, CreateProductData, StockBySize } from '@/hooks/useProducts';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProductData) => Promise<void>;
  product?: Product | null;
}

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const ProductModal = ({ open, onClose, onSave, product }: ProductModalProps) => {
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    sku: '',
    image_url: '',
    category: 'remeras',
    description: '',
    subcategory: '',
    sizes: [],
    stock_by_size: {},
    price: undefined,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku || '',
        image_url: product.image_url,
        category: product.category,
        description: product.description || '',
        subcategory: product.subcategory || '',
        sizes: product.sizes,
        stock_by_size: product.stock_by_size || {},
        price: product.price || undefined,
        is_active: product.is_active,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        image_url: '',
        category: 'remeras',
        description: '',
        subcategory: '',
        sizes: [],
        stock_by_size: {},
        price: undefined,
        is_active: true,
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image_url || !formData.category) return;

    // Calculate total_stock from stock_by_size
    const totalStock = Object.values(formData.stock_by_size || {}).reduce(
      (sum, qty) => sum + qty, 
      0
    );

    setSaving(true);
    try {
      await onSave({
        ...formData,
        total_stock: totalStock,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = (size: string) => {
    setFormData(prev => {
      const sizes = prev.sizes || [];
      const stockBySize = { ...(prev.stock_by_size || {}) };
      
      if (sizes.includes(size)) {
        // Remove size
        delete stockBySize[size];
        return {
          ...prev,
          sizes: sizes.filter(s => s !== size),
          stock_by_size: stockBySize,
        };
      } else {
        // Add size with 0 stock
        stockBySize[size] = 0;
        return {
          ...prev,
          sizes: [...sizes, size],
          stock_by_size: stockBySize,
        };
      }
    });
  };

  const updateStockForSize = (size: string, stock: number) => {
    setFormData(prev => ({
      ...prev,
      stock_by_size: {
        ...(prev.stock_by_size || {}),
        [size]: Math.max(0, stock),
      },
    }));
  };

  const selectedSizes = formData.sizes || [];
  const stockBySize = formData.stock_by_size || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del producto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del producto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="ABC-123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  price: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="99.99"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL de Imagen *</Label>
            <div className="flex gap-2">
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://ejemplo.com/imagen.jpg"
                required
              />
            </div>
            {formData.image_url && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Input
                id="subcategory"
                value={formData.subcategory || ''}
                onChange={e => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                placeholder="Ej: Deportivo, Casual"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Talles Disponibles</Label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(size => (
                <Badge
                  key={size}
                  variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stock by Size */}
          {selectedSizes.length > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <Label>Stock por Talle</Label>
              <div className="grid grid-cols-4 gap-3">
                {SIZE_OPTIONS.filter(s => selectedSizes.includes(s)).map(size => (
                  <div key={size} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{size}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={stockBySize[size] || 0}
                      onChange={e => updateStockForSize(size, parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Stock total: {Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0)} unidades
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Producto activo</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : product ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
