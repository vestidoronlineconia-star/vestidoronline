import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CategoriesStepProps {
  enabledCategories: string[];
  onUpdate: (categories: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const CategoriesStep = ({ enabledCategories, onUpdate, onNext, onPrevious }: CategoriesStepProps) => {
  const [selected, setSelected] = useState<string[]>(
    enabledCategories.length > 0 ? enabledCategories : CATEGORIES.map(c => c.value)
  );

  const toggleCategory = (category: string) => {
    setSelected(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAll = () => {
    setSelected(CATEGORIES.map(c => c.value));
  };

  const clearAll = () => {
    setSelected([]);
  };

  const handleNext = () => {
    onUpdate(selected);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Categorías de Prendas</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona las categorías de prendas que vendes. Solo estas categorías estarán disponibles en el widget.
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={selectAll}>
          Seleccionar todas
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Limpiar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CATEGORIES.map(category => {
          const isSelected = selected.includes(category.value);
          return (
            <button
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={cn(
                'relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="text-2xl">{category.icon}</span>
              <span className="font-medium text-sm">{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        {selected.length} de {CATEGORIES.length} categorías seleccionadas
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={handleNext} disabled={selected.length === 0}>
          Siguiente
        </Button>
      </div>
    </div>
  );
};
