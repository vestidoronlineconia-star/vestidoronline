import { useState, useEffect } from 'react';
import { Code, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseJsonInput, mapProductFields, type MappedProduct } from '@/lib/productFieldMapping';

interface JsonImporterProps {
  onParse: (products: MappedProduct[], errors: string[], warnings: string[]) => void;
}

const EXAMPLE_JSON = `[
  {
    "name": "Remera Básica",
    "sku": "REM-001",
    "image_url": "https://ejemplo.com/remera.jpg",
    "category": "remera",
    "sizes": ["S", "M", "L", "XL"],
    "price": 2500
  }
]`;

export const JsonImporter = ({ onParse }: JsonImporterProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!jsonInput.trim()) {
      setParseError(null);
      return;
    }

    const { data, error } = parseJsonInput(jsonInput);
    
    if (error) {
      setParseError(error);
      return;
    }

    if (data) {
      setParseError(null);
    }
  }, [jsonInput]);

  const handleParse = () => {
    const { data, error } = parseJsonInput(jsonInput);
    
    if (error || !data) {
      setParseError(error || 'Error desconocido');
      return;
    }

    const { products, errors, warnings } = mapProductFields(data);
    onParse(products, errors, warnings);
  };

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(EXAMPLE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasteExample = () => {
    setJsonInput(EXAMPLE_JSON);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pega un array JSON con tus productos. El sistema mapeará campos automáticamente.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyExample}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? 'Copiado' : 'Copiar ejemplo'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePasteExample}
          >
            <Code className="h-4 w-4 mr-1" />
            Usar ejemplo
          </Button>
        </div>
      </div>

      <Textarea
        placeholder={`Pega tu JSON aquí...\n\nEjemplo:\n${EXAMPLE_JSON}`}
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        className="min-h-[200px] font-mono text-sm"
      />

      {parseError && (
        <Alert variant="destructive">
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs font-medium mb-2">Campos soportados:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div><code className="bg-muted px-1 rounded">name</code> (requerido)</div>
          <div><code className="bg-muted px-1 rounded">image_url</code> (requerido)</div>
          <div><code className="bg-muted px-1 rounded">category</code> (requerido)</div>
          <div><code className="bg-muted px-1 rounded">sku</code></div>
          <div><code className="bg-muted px-1 rounded">price</code></div>
          <div><code className="bg-muted px-1 rounded">sizes</code> (array)</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          También acepta: nombre, imagen, categoria, precio, talles, etc.
        </p>
      </div>

      <Button 
        onClick={handleParse} 
        disabled={!jsonInput.trim() || !!parseError}
        className="w-full"
      >
        Validar y Previsualizar
      </Button>
    </div>
  );
};
