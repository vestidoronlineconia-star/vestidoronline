import { useState } from 'react';
import { Plus, X, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DomainsStepProps {
  domains: string[];
  onUpdate: (domains: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const DomainsStep = ({ domains, onUpdate, onNext, onPrevious }: DomainsStepProps) => {
  const [localDomains, setLocalDomains] = useState<string[]>(domains.length > 0 ? domains : []);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');

  const validateDomain = (domain: string): boolean => {
    // Simple domain validation
    const pattern = /^(?:\*\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/;
    return pattern.test(domain) || domain === 'localhost' || domain.startsWith('localhost:');
  };

  const addDomain = () => {
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (!domain) {
      setError('Ingresa un dominio');
      return;
    }

    if (!validateDomain(domain)) {
      setError('Formato de dominio inválido. Ejemplo: mitienda.com o *.mitienda.com');
      return;
    }

    if (localDomains.includes(domain)) {
      setError('Este dominio ya está agregado');
      return;
    }

    setLocalDomains(prev => [...prev, domain]);
    setNewDomain('');
    setError('');
  };

  const removeDomain = (domain: string) => {
    setLocalDomains(prev => prev.filter(d => d !== domain));
  };

  const handleNext = () => {
    onUpdate(localDomains);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Dominios Autorizados</Label>
        <p className="text-sm text-muted-foreground mt-1">
          El widget solo funcionará en los dominios que agregues aquí. Puedes usar comodines (*.ejemplo.com) para incluir subdominios.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newDomain}
            onChange={e => {
              setNewDomain(e.target.value);
              setError('');
            }}
            placeholder="ejemplo.com o *.ejemplo.com"
            onKeyDown={e => e.key === 'Enter' && addDomain()}
          />
        </div>
        <Button onClick={addDomain}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label className="text-sm">Dominios agregados:</Label>
        {localDomains.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg">
            No hay dominios agregados. El widget no funcionará hasta que agregues al menos uno.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {localDomains.map(domain => (
              <Badge key={domain} variant="secondary" className="gap-1 pr-1">
                <Globe className="h-3 w-3 mr-1" />
                {domain}
                <button
                  onClick={() => removeDomain(domain)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Para desarrollo local, agrega <code className="bg-muted px-1 rounded">localhost</code> o <code className="bg-muted px-1 rounded">localhost:3000</code>
        </AlertDescription>
      </Alert>

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
