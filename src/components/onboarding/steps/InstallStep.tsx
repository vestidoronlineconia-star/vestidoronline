import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { generateEmbedCode } from '@/lib/embedUrl';

interface InstallStepProps {
  slug: string;
  onNext: () => void;
  onPrevious: () => void;
}

export const InstallStep = ({ slug, onNext, onPrevious }: InstallStepProps) => {
  const [copiedBasic, setCopiedBasic] = useState(false);
  const [copiedAdvanced, setCopiedAdvanced] = useState(false);

  const { code: embedCode } = generateEmbedCode(slug);
  
  const basicCode = `<iframe 
  src="${window.location.origin}/embed?clientId=${slug}"
  style="width: 100%; height: 700px; border: none; border-radius: 12px;"
  allow="camera"
></iframe>`;

  const copyCode = (code: string, type: 'basic' | 'advanced') => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
    if (type === 'basic') {
      setCopiedBasic(true);
      setTimeout(() => setCopiedBasic(false), 2000);
    } else {
      setCopiedAdvanced(true);
      setTimeout(() => setCopiedAdvanced(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Código de Instalación</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Copia el código e insértalo en tu sitio web donde quieras mostrar el widget.
        </p>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{basicCode}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyCode(basicCode, 'basic')}
            >
              {copiedBasic ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Código simple para insertar el widget. Ideal para la mayoría de los casos.
          </p>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-80">
              <code>{embedCode}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyCode(embedCode, 'advanced')}
            >
              {copiedAdvanced ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Código completo con eventos JavaScript para integraciones avanzadas.
          </p>
        </TabsContent>
      </Tabs>

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-sm">Plataformas Soportadas:</h4>
        <div className="flex flex-wrap gap-2">
          {['Tienda Nube', 'Shopify', 'WooCommerce', 'Wix', 'Custom HTML'].map(platform => (
            <span key={platform} className="text-xs bg-background px-2 py-1 rounded border">
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={onNext}>
          Finalizar
        </Button>
      </div>
    </div>
  );
};
