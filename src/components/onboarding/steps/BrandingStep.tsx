import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BrandingStepProps {
  clientData: {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    text_color: string | null;
    background_color: string | null;
  };
  onUpdate: (data: Partial<BrandingStepProps['clientData']>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const BrandingStep = ({ clientData, onUpdate, onNext, onPrevious }: BrandingStepProps) => {
  const [localData, setLocalData] = useState({
    name: clientData.name || '',
    logo_url: clientData.logo_url || '',
    primary_color: clientData.primary_color || '#6366f1',
    secondary_color: clientData.secondary_color || '#8b5cf6',
    text_color: clientData.text_color || '#ffffff',
    background_color: clientData.background_color || '#1a1a2e',
  });

  const handleChange = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    onUpdate(localData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de tu tienda</Label>
          <Input
            id="name"
            value={localData.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Mi Tienda de Moda"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo_url">URL del Logo</Label>
          <Input
            id="logo_url"
            value={localData.logo_url}
            onChange={e => handleChange('logo_url', e.target.value)}
            placeholder="https://tu-dominio.com/logo.png"
          />
          {localData.logo_url && (
            <div className="w-20 h-20 rounded-lg border overflow-hidden bg-muted">
              <img
                src={localData.logo_url}
                alt="Logo preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Color de Botones</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="primary_color"
                value={localData.primary_color}
                onChange={e => handleChange('primary_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={localData.primary_color}
                onChange={e => handleChange('primary_color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Color Secundario</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="secondary_color"
                value={localData.secondary_color}
                onChange={e => handleChange('secondary_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={localData.secondary_color}
                onChange={e => handleChange('secondary_color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_color">Color de Texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="text_color"
                value={localData.text_color}
                onChange={e => handleChange('text_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={localData.text_color}
                onChange={e => handleChange('text_color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background_color">Color de Fondo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="background_color"
                value={localData.background_color}
                onChange={e => handleChange('background_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={localData.background_color}
                onChange={e => handleChange('background_color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: localData.background_color }}>
        <div className="flex items-center gap-3 mb-4">
          {localData.logo_url && (
            <img src={localData.logo_url} alt="" className="h-8 w-8 object-contain" />
          )}
          <span style={{ color: localData.text_color }} className="font-semibold">
            {localData.name || 'Tu Tienda'}
          </span>
        </div>
        <div 
          className="px-4 py-2 rounded-lg text-center font-medium"
          style={{ backgroundColor: localData.primary_color, color: localData.text_color }}
        >
          Probar Prenda
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={handleNext}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};
