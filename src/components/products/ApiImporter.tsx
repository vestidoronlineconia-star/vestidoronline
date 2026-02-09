import { useState } from 'react';
import { Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiImporterProps {
  apiKey: string;
  clientId: string;
}

export const ApiImporter = ({ apiKey, clientId }: ApiImporterProps) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`;

  const exampleRequest = `curl -X POST "${baseUrl}" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "products": [
      {
        "name": "Remera Básica",
        "sku": "REM-001",
        "image_url": "https://ejemplo.com/remera.jpg",
        "category": "remera",
        "sizes": ["S", "M", "L", "XL"],
        "price": 2500
      }
    ]
  }'`;

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(exampleRequest);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Usa nuestra API REST para sincronizar productos desde tu sistema de forma automática.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tu API Key</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={apiKey}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyKey}>
              {copiedKey ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Endpoint</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={baseUrl}
              readOnly
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Ejemplo de Request</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopyExample}
            className="h-7 text-xs"
          >
            {copiedExample ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </>
            )}
          </Button>
        </div>
        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
          {exampleRequest}
        </pre>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>POST</strong> envía productos nuevos. Usa el campo <code className="bg-muted px-1 rounded">sku</code> para identificar productos existentes y actualizarlos.
        </AlertDescription>
      </Alert>

      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs font-medium mb-2">Respuesta exitosa:</p>
        <pre className="bg-muted p-2 rounded text-xs font-mono">
{`{
  "success": true,
  "imported": 5,
  "updated": 2,
  "errors": []
}`}
        </pre>
      </div>
    </div>
  );
};
