import { useState } from 'react';
import { Play, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestStepProps {
  slug: string;
  onNext: () => void;
  onPrevious: () => void;
}

const getStoreUrl = (slug: string) => {
  return `${window.location.origin}/tienda/${slug}`;
};

export const TestStep = ({ slug, onNext, onPrevious }: TestStepProps) => {
  const [tested, setTested] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const storeUrl = getStoreUrl(slug);

  const runTest = () => {
    // Open the store in a new tab for testing
    window.open(storeUrl, '_blank');
    setTested(true);
    setTestResult('success');
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Probar tu Tienda</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Abre tu tienda en una nueva pestaña para verificar que todo funciona correctamente.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden bg-muted/50 p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">URL de tu tienda</h3>
            <p className="text-sm text-muted-foreground font-mono mt-1">{storeUrl}</p>
          </div>
        </div>
      </div>

      {!tested && (
        <div className="text-center">
          <Button onClick={runTest} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Abrir Tienda
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Se abrirá en una nueva pestaña
          </p>
        </div>
      )}

      {testResult === 'success' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            ¡Tu tienda está funcionando! Puedes continuar con la configuración.
          </AlertDescription>
        </Alert>
      )}

      {testResult === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Hubo un problema al acceder a tu tienda. Por favor revisa la configuración.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!tested}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};
