import { useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useClientBySlug } from '@/hooks/useClientBySlug';
import { useAuth } from '@/hooks/useAuth';
import { usePublicProducts, Product } from '@/hooks/useProducts';
import { CATEGORIES } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, Menu, X, Sparkles, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductDetailModal } from '@/components/store/ProductDetailModal';

const ClientStore = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const authRedirect = `/auth?redirect=${encodeURIComponent(location.pathname)}`;
  const { clientConfig, loading: configLoading, error } = useClientBySlug(slug);
  const { products, loading: productsLoading } = usePublicProducts(
    clientConfig?.id || null,
    null // Load all products, filter by category in UI
  );
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get unique categories from products
  const availableCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return CATEGORIES.filter(c => cats.includes(c.value));
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Calculate total stock for a product
  const getTotalStock = (product: Product): number => {
    if (product.total_stock > 0) return product.total_stock;
    const stockBySize = product.stock_by_size || {};
    return Object.values(stockBySize).reduce((sum: number, qty: number) => sum + qty, 0);
  };

  if (configLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && (error || !clientConfig)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <LogIn className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Iniciá sesión para continuar</h1>
          <p className="text-muted-foreground mb-6">
            Necesitás una cuenta para acceder a esta tienda.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to={authRedirect}>Iniciar sesión</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿No tenés cuenta?{' '}
              <Link to={authRedirect} className="text-primary underline">
                Registrate
              </Link>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !clientConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
          <p className="text-muted-foreground">
            {error || 'La tienda que buscas no existe o no está disponible.'}
          </p>
        </Card>
      </div>
    );
  }

  // Apply client branding
  const brandStyles = {
    '--client-primary': clientConfig.primary_color || '#8B5CF6',
    '--client-secondary': clientConfig.secondary_color || '#A78BFA',
    '--client-bg': clientConfig.background_color || '#0A0A0F',
    '--client-text': clientConfig.text_color || '#FFFFFF',
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen"
      style={{
        ...brandStyles,
        backgroundColor: 'var(--client-bg)',
        color: 'var(--client-text)',
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{ 
          borderColor: 'rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(0,0,0,0.8)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clientConfig.logo_url ? (
              <img 
                src={clientConfig.logo_url} 
                alt={clientConfig.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <ShoppingBag className="w-8 h-8" style={{ color: 'var(--client-primary)' }} />
            )}
            <h1 className="text-xl font-bold">{clientConfig.name}</h1>
          </div>
          
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - Categories */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 pt-20 pb-4 px-4 transform transition-transform md:static md:translate-x-0 md:pt-4",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            "md:border-r"
          )}
          style={{ 
            backgroundColor: 'var(--client-bg)',
            borderColor: 'rgba(255,255,255,0.1)'
          }}
        >
          <nav className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-muted-foreground">
              Categorías
            </h2>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                selectedCategory === null 
                  ? "bg-white/10 font-medium" 
                  : "hover:bg-white/5"
              )}
            >
              <span className="text-lg">🛍️</span>
              <span>Todos los productos</span>
              <Badge variant="secondary" className="ml-auto">
                {products.length}
              </Badge>
            </button>
            
            {availableCategories.map(cat => {
              const count = products.filter(p => p.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                    selectedCategory === cat.value 
                      ? "bg-white/10 font-medium" 
                      : "hover:bg-white/5"
                  )}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile menu */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content - Product Grid */}
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory 
                ? CATEGORIES.find(c => c.value === selectedCategory)?.label || 'Productos'
                : 'Todos los productos'
              }
            </h2>
            <p className="text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--client-primary)' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay productos</h3>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? 'No hay productos en esta categoría'
                  : 'El catálogo está vacío'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const stock = getTotalStock(product);
                const isOutOfStock = stock === 0;
                
                return (
                  <Card 
                    key={product.id}
                    className={cn(
                      "group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-white/20",
                      isOutOfStock && "opacity-60"
                    )}
                    onClick={() => setSelectedProduct(product)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Badge variant="destructive">Agotado</Badge>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ 
                          backgroundColor: 'var(--client-primary)',
                          color: 'white'
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Probar
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        {product.price && (
                          <span className="font-bold" style={{ color: 'var(--client-primary)' }}>
                            ${product.price.toLocaleString()}
                          </span>
                        )}
                        {product.sizes && product.sizes.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {product.sizes.join(' · ')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Product Detail Modal with Try-On */}
      <ProductDetailModal
        product={selectedProduct}
        clientConfig={clientConfig}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default ClientStore;
