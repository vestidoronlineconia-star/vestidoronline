import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts, Product, CreateProductData } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, Search, Upload, Download } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductModal } from '@/components/products/ProductModal';
import { ProductImporter } from '@/components/products/ProductImporter';
import { CATEGORIES } from '@/lib/categories';

const ClientPortalProducts = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  
  const { products, loading, createProduct, updateProduct, deleteProduct, toggleProductStatus, importProducts } = useProducts(clientId || '');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Omit<Product, 'id' | 'client_id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      await updateProduct({ id: editingProduct.id, ...data });
    } else {
      await createProduct(data);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleToggleSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleExportCSV = () => {
    const headers = ['name', 'sku', 'category', 'sizes', 'price', 'image_url', 'is_active'];
    const rows = products.map(p => [
      p.name,
      p.sku || '',
      p.category,
      p.sizes?.join(';') || '',
      p.price?.toString() || '',
      p.image_url,
      p.is_active ? 'true' : 'false'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (productsData: CreateProductData[]): Promise<number> => {
    const count = await importProducts(productsData);
    setIsImporterOpen(false);
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-ambient" />
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/client-portal')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
                <p className="text-muted-foreground">
                  {products.length} productos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImporterOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No hay productos</h3>
              <p className="text-muted-foreground mb-6">
                {products.length === 0 
                  ? 'Agrega tu primer producto o importa desde un CSV'
                  : 'No se encontraron productos con los filtros aplicados'
                }
              </p>
              {products.length === 0 && (
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setIsImporterOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProducts.includes(product.id)}
                  onSelect={() => handleToggleSelect(product.id)}
                  onEdit={() => handleEdit(product)}
                  onDelete={() => deleteProduct(product.id)}
                  onToggleStatus={() => toggleProductStatus(product.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <ProductModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSave}
          product={editingProduct}
        />

        <ProductImporter
          open={isImporterOpen}
          onClose={() => setIsImporterOpen(false)}
          onImport={handleImport}
        />
      </div>
    </>
  );
};

export default ClientPortalProducts;
