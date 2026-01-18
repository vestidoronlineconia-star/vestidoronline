import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SizesStepProps {
  showSizeSelector: boolean;
  showFitResult: boolean;
  onUpdate: (data: { show_size_selector: boolean; show_fit_result: boolean }) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export const SizesStep = ({ 
  showSizeSelector, 
  showFitResult, 
  onUpdate, 
  onNext, 
  onPrevious,
  onSkip 
}: SizesStepProps) => {
  const [localShowSize, setLocalShowSize] = useState(showSizeSelector);
  const [localShowFit, setLocalShowFit] = useState(showFitResult);

  const handleNext = () => {
    onUpdate({ show_size_selector: localShowSize, show_fit_result: localShowFit });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Configuración de Talles</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Configura cómo el widget maneja los talles y las recomendaciones de ajuste.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="show_size_selector" className="font-medium">
              Mostrar selector de talle
            </Label>
            <p className="text-sm text-muted-foreground">
              Permite a los usuarios seleccionar su talle antes de probarse la prenda
            </p>
          </div>
          <Switch
            id="show_size_selector"
            checked={localShowSize}
            onCheckedChange={setLocalShowSize}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="show_fit_result" className="font-medium">
              Mostrar resultado de ajuste
            </Label>
            <p className="text-sm text-muted-foreground">
              Muestra una estimación de cómo le quedará la prenda al usuario
            </p>
          </div>
          <Switch
            id="show_fit_result"
            checked={localShowFit}
            onCheckedChange={setLocalShowFit}
          />
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota:</strong> Puedes configurar una guía de talles personalizada más adelante desde el panel de configuración.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Omitir
          </Button>
          <Button onClick={handleNext}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};
