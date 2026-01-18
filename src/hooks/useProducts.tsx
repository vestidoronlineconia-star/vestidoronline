import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  client_id: string;
  name: string;
  sku: string | null;
  image_url: string;
  category: string;
  sizes: string[];
  price: number | null;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  sku?: string;
  image_url: string;
  category: string;
  sizes?: string[];
  price?: number;
  is_active?: boolean;
  metadata?: Json;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

const mapDbToProduct = (data: any): Product => ({
  id: data.id,
  client_id: data.client_id,
  name: data.name,
  sku: data.sku,
  image_url: data.image_url,
  category: data.category,
  sizes: data.sizes || [],
  price: data.price,
  is_active: data.is_active,
  metadata: data.metadata || {},
  created_at: data.created_at,
  updated_at: data.updated_at,
});

export const useProducts = (clientId: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!clientId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_products')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProducts((data || []).map(mapDbToProduct));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading products';
      setError(message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (productData: CreateProductData): Promise<Product | null> => {
    if (!clientId) return null;

    try {
      const { data, error: createError } = await supabase
        .from('client_products')
        .insert({
          client_id: clientId,
          ...productData,
        })
        .select()
        .single();

      if (createError) throw createError;

      const product = mapDbToProduct(data);
      setProducts(prev => [product, ...prev]);
      toast.success('Producto creado correctamente');
      return product;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating product';
      toast.error(message);
      console.error('Error creating product:', err);
      return null;
    }
  };

  const updateProduct = async (productData: UpdateProductData): Promise<Product | null> => {
    const { id, ...updateData } = productData;

    try {
      const { data, error: updateError } = await supabase
        .from('client_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const product = mapDbToProduct(data);
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      toast.success('Producto actualizado correctamente');
      return product;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating product';
      toast.error(message);
      console.error('Error updating product:', err);
      return null;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('client_products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Producto eliminado correctamente');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting product';
      toast.error(message);
      console.error('Error deleting product:', err);
      return false;
    }
  };

  const toggleProductStatus = async (productId: string): Promise<boolean> => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    try {
      const { error: updateError } = await supabase
        .from('client_products')
        .update({ is_active: !product.is_active })
        .eq('id', productId);

      if (updateError) throw updateError;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_active: !p.is_active } : p
      ));
      toast.success(product.is_active ? 'Producto desactivado' : 'Producto activado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating product status';
      toast.error(message);
      console.error('Error toggling product status:', err);
      return false;
    }
  };

  const bulkDelete = async (productIds: string[]): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('client_products')
        .delete()
        .in('id', productIds);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
      toast.success(`${productIds.length} productos eliminados`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting products';
      toast.error(message);
      console.error('Error bulk deleting products:', err);
      return false;
    }
  };

  const bulkToggleStatus = async (productIds: string[], isActive: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('client_products')
        .update({ is_active: isActive })
        .in('id', productIds);

      if (updateError) throw updateError;

      setProducts(prev => prev.map(p => 
        productIds.includes(p.id) ? { ...p, is_active: isActive } : p
      ));
      toast.success(`${productIds.length} productos ${isActive ? 'activados' : 'desactivados'}`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating products';
      toast.error(message);
      console.error('Error bulk updating products:', err);
      return false;
    }
  };

  const importProducts = async (productsData: CreateProductData[]): Promise<number> => {
    if (!clientId) return 0;

    try {
      const productsWithClientId = productsData.map(p => ({
        ...p,
        client_id: clientId,
      }));

      const { data, error: insertError } = await supabase
        .from('client_products')
        .insert(productsWithClientId)
        .select();

      if (insertError) throw insertError;

      setProducts(prev => [...(data || []).map(mapDbToProduct), ...prev]);
      toast.success(`${data?.length || 0} productos importados correctamente`);
      return data?.length || 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error importing products';
      toast.error(message);
      console.error('Error importing products:', err);
      return 0;
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    bulkDelete,
    bulkToggleStatus,
    importProducts,
  };
};

// Hook for fetching products in the embed widget (public access)
export const usePublicProducts = (clientId: string | null, category: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!clientId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('client_products')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .order('name');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProducts((data || []).map(mapDbToProduct));
      } catch (err) {
        console.error('Error fetching public products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [clientId, category]);

  return { products, loading };
};
