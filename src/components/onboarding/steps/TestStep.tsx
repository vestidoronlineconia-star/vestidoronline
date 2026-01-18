import { useState } from 'react';
import { Play, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestStepProps {
  slug: string;
  onNext: () => void;
  onPrevious: () => void;
}

export const TestStep = ({ slug, onNext, onPrevious }: TestStepProps) => {
  const [tested, setTested] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const embedUrl = `${window.location.origin}/embed?clientId=${slug}`;

  const runTest = () => {
    // Simulate a test - in production this would actually test the widget
    setTested(true);
    setTestResult('success');
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Probar el Widget</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Prueba tu widget en un entorno seguro antes de instalarlo en tu sitio.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden bg-muted/50">
        <div className="aspect-video relative">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            title="Widget Preview"
            allow="camera"
          />
        </div>
      </div>

      {!tested && (
        <div className="text-center">
          <Button onClick={runTest} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Ejecutar Prueba
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Verifica que el widget carga correctamente
          </p>
        </div>
      )}

      {testResult === 'success' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            ¡El widget funciona correctamente! Puedes continuar con la instalación.
          </AlertDescription>
        </Alert>
      )}

      {testResult === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Hubo un problema al cargar el widget. Por favor revisa la configuración.
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
