import { useState } from 'react';
import { Link, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mapProductFields, type MappedProduct, type RawProductData } from '@/lib/productFieldMapping';

interface UrlImporterProps {
  onParse: (products: MappedProduct[], errors: string[], warnings: string[]) => void;
}

export const UrlImporter = ({ onParse }: UrlImporterProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('URL no válida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('La URL no devuelve JSON válido');
      }

      const data = await response.json();
      
      let products: RawProductData[];
      
      if (Array.isArray(data)) {
        products = data;
      } else if (data.products && Array.isArray(data.products)) {
        products = data.products;
      } else if (data.data && Array.isArray(data.data)) {
        products = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        products = data.items;
      } else {
        throw new Error('No se encontró un array de productos en la respuesta');
      }

      const result = mapProductFields(products);
      onParse(result.products, result.errors, result.warnings);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('No se pudo acceder a la URL. Verifica que permita CORS o que sea accesible públicamente.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al obtener datos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ingresa la URL de un endpoint JSON que devuelva tus productos.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://mi-tienda.com/api/productos.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleFetch} disabled={!url.trim() || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Obtener'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium">Formatos de respuesta soportados:</p>
        <div className="space-y-2 text-xs text-muted-foreground font-mono">
          <div className="bg-muted p-2 rounded">
            {'[{ "name": "...", "image_url": "..." }]'}
          </div>
          <div className="bg-muted p-2 rounded">
            {'{ "products": [...] }'}
          </div>
          <div className="bg-muted p-2 rounded">
            {'{ "data": [...] }'}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          La URL debe permitir acceso CORS o ser pública.
        </p>
      </div>
    </div>
  );
};
