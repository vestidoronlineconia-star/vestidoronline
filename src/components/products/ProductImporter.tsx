import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Code, Zap, Link, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportPreview } from './ImportPreview';
import { JsonImporter } from './JsonImporter';
import { UrlImporter } from './UrlImporter';
import { ApiImporter } from './ApiImporter';
import { mapProductFields, type MappedProduct } from '@/lib/productFieldMapping';
import type { CreateProductData } from '@/hooks/useProducts';

interface ProductImporterProps {
  open: boolean;
  onClose: () => void;
  onImport: (products: CreateProductData[]) => Promise<number>;
  apiKey?: string;
  clientId?: string;
}

interface ParseResult {
  products: MappedProduct[];
  errors: string[];
  warnings: string[];
}

export const ProductImporter = ({ open, onClose, onImport, apiKey = '', clientId = '' }: ProductImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): ParseResult => {
    const lines = content.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    const warnings: string[] = [];

    if (lines.length < 2) {
      errors.push('El archivo debe tener al menos una fila de encabezados y una de datos');
      return { products: [], errors, warnings };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'image_url', 'category'];
    const alternativeHeaders = {
      name: ['name', 'nombre', 'producto'],
      image_url: ['image_url', 'imagen', 'img'],
      category: ['category', 'categoria', 'tipo'],
    };

    // Check for required headers with alternatives
    const hasName = alternativeHeaders.name.some(h => headers.includes(h));
    const hasImage = alternativeHeaders.image_url.some(h => headers.includes(h));
    const hasCategory = alternativeHeaders.category.some(h => headers.includes(h));

    if (!hasName || !hasImage || !hasCategory) {
      errors.push('Faltan columnas requeridas: name/nombre, image_url/imagen, category/categoria');
      return { products: [], errors, warnings };
    }

    const rawProducts = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        rawProducts.push(row);
      } catch (err) {
        errors.push(`Fila ${i + 1}: Error al procesar la fila`);
      }
    }

    const result = mapProductFields(rawProducts);
    return {
      products: result.products,
      errors: [...errors, ...result.errors],
      warnings: [...warnings, ...result.warnings],
    };
  };

  // Handle CSV values with quotes and commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    const content = await selectedFile.text();
    const result = parseCSV(content);
    setParseResult(result);
    
    if (result.products.length > 0) {
      setShowPreview(true);
    }
  };

  const handleJsonParse = (products: MappedProduct[], errors: string[], warnings: string[]) => {
    setParseResult({ products, errors, warnings });
    setShowPreview(true);
  };

  const handleUrlParse = (products: MappedProduct[], errors: string[], warnings: string[]) => {
    setParseResult({ products, errors, warnings });
    setShowPreview(true);
  };

  const handleImport = async (productsData: CreateProductData[]): Promise<number> => {
    return await onImport(productsData);
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setImportProgress(0);
    setShowPreview(false);
    onClose();
  };

  const handleBackFromPreview = () => {
    setShowPreview(false);
  };

  const downloadTemplate = () => {
    const template = 'name,sku,image_url,category,sizes,price,is_active\n';
    const example = 'Remera Básica,REM-001,https://ejemplo.com/imagen.jpg,remera,S;M;L;XL,29.99,true\n';
    const blob = new Blob([template + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Productos</DialogTitle>
          <DialogDescription>
            {showPreview 
              ? 'Revisa los productos antes de importar'
              : 'Elige el método de importación que mejor se adapte a tu flujo de trabajo'
            }
          </DialogDescription>
        </DialogHeader>

        {showPreview && parseResult ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={handleBackFromPreview}>
              ← Volver
            </Button>
            <ImportPreview
              products={parseResult.products}
              errors={parseResult.errors}
              warnings={parseResult.warnings}
              onConfirm={handleImport}
              onCancel={handleClose}
            />
          </div>
        ) : (
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="csv" className="text-xs">
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                CSV
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="api" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                API
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs">
                <Link className="h-3 w-3 mr-1" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4 mt-4">
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Descargar Plantilla CSV
              </Button>

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Haz clic para seleccionar un archivo CSV
                  </p>
                )}
              </div>

              {parseResult && !showPreview && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {parseResult.products.length} productos listos para importar
                    </span>
                  </div>
                  
                  {parseResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="text-sm">
                          {parseResult.errors.length} errores encontrados
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={() => setShowPreview(true)} 
                    className="w-full"
                    disabled={parseResult.products.length === 0}
                  >
                    Ver Preview
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <JsonImporter onParse={handleJsonParse} />
            </TabsContent>

            <TabsContent value="api" className="mt-4">
              <ApiImporter apiKey={apiKey} clientId={clientId} />
            </TabsContent>

            <TabsContent value="url" className="mt-4">
              <UrlImporter onParse={handleUrlParse} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
