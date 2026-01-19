import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface InstallStepProps {
  slug: string;
  onNext: () => void;
  onPrevious: () => void;
}

const getSubdomainUrl = (slug: string) => {
  const hostname = window.location.hostname;
  
  if (hostname.includes('lovable.app')) {
    if (hostname.includes('-preview--')) {
      const projectPart = hostname.split('-preview--')[1];
      return `https://${slug}-preview--${projectPart}`;
    } else {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        parts[0] = slug;
        return `https://${parts.join('.')}`;
      }
      return `https://${slug}.${hostname}`;
    }
  }
  return `https://${slug}.${hostname}`;
};

export const InstallStep = ({ slug, onNext, onPrevious }: InstallStepProps) => {
  const [copied, setCopied] = useState(false);

  const storeUrl = getSubdomainUrl(slug);

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success('URL copiada al portapapeles');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">URL de tu Tienda</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Tu tienda ya está lista. Comparte esta URL con tus clientes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="bg-muted p-4 rounded-lg flex items-center justify-between gap-4">
            <code className="text-sm font-mono break-all">{storeUrl}</code>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={copyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(storeUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Tu tienda incluye automáticamente el probador virtual integrado. Los clientes pueden navegar tu catálogo y probarse las prendas directamente.
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-sm">¿Qué incluye tu tienda?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Catálogo de productos con filtros por categoría</li>
          <li>• Probador virtual integrado en cada producto</li>
          <li>• Diseño personalizado con tu branding</li>
          <li>• Compatible con todos los dispositivos</li>
        </ul>
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
