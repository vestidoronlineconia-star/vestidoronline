import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { CreateProductData } from '@/hooks/useProducts';

interface ProductImporterProps {
  open: boolean;
  onClose: () => void;
  onImport: (products: CreateProductData[]) => Promise<number>;
}

interface ParseResult {
  products: CreateProductData[];
  errors: string[];
}

export const ProductImporter = ({ open, onClose, onImport }: ProductImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): ParseResult => {
    const lines = content.split('\n').filter(line => line.trim());
    const products: CreateProductData[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push('El archivo debe tener al menos una fila de encabezados y una de datos');
      return { products, errors };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'image_url', 'category'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      errors.push(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      return { products, errors };
    }

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (!row.name || !row.image_url || !row.category) {
          errors.push(`Fila ${i + 1}: Faltan campos requeridos (name, image_url, category)`);
          continue;
        }

        const product: CreateProductData = {
          name: row.name,
          image_url: row.image_url,
          category: row.category,
          sku: row.sku || undefined,
          price: row.price ? parseFloat(row.price) : undefined,
          sizes: row.sizes ? row.sizes.split(';').map(s => s.trim()) : [],
          is_active: row.is_active !== 'false',
        };

        products.push(product);
      } catch (err) {
        errors.push(`Fila ${i + 1}: Error al procesar la fila`);
      }
    }

    return { products, errors };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    const content = await selectedFile.text();
    const result = parseCSV(content);
    setParseResult(result);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.products.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    try {
      const count = await onImport(parseResult.products);
      setImportProgress(100);
      setImportResult({ success: count, errors: parseResult.products.length - count });
    } catch (err) {
      setImportResult({ success: 0, errors: parseResult.products.length });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setImportProgress(0);
    onClose();
  };

  const downloadTemplate = () => {
    const template = 'name,sku,image_url,category,sizes,price,is_active\n';
    const example = 'Remera Básica,REM-001,https://ejemplo.com/imagen.jpg,remeras,S;M;L;XL,29.99,true\n';
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Productos desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con tus productos. Usa nuestra plantilla como referencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {parseResult && (
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
                      {parseResult.errors.length} errores encontrados:
                      <ul className="list-disc list-inside mt-1">
                        {parseResult.errors.slice(0, 3).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {parseResult.errors.length > 3 && (
                          <li>...y {parseResult.errors.length - 3} más</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Importando productos...
              </p>
            </div>
          )}

          {importResult && (
            <Alert variant={importResult.errors > 0 ? 'destructive' : 'default'}>
              <AlertDescription>
                {importResult.success} productos importados exitosamente.
                {importResult.errors > 0 && ` ${importResult.errors} fallaron.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!parseResult || parseResult.products.length === 0 || importing}
            >
              {importing ? 'Importando...' : `Importar ${parseResult?.products.length || 0} Productos`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
