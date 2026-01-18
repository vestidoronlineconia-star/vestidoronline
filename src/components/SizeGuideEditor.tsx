import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSizeGuide } from '@/hooks/useSizeGuide';
import { SizeDefinition } from '@/lib/calculateFit';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SizeGuideEditorProps {
  clientId: string;
  enabledCategories: string[];
}

const allCategories = [
  { id: 'buzo', label: 'Hoodie', measureFields: ['chest_cm', 'length_cm'] },
  { id: 'remera', label: 'Remera', measureFields: ['chest_cm', 'length_cm'] },
  { id: 'camisa', label: 'Camisa', measureFields: ['chest_cm', 'length_cm'] },
  { id: 'vestido', label: 'Vestido', measureFields: ['chest_cm', 'waist_cm', 'hips_cm', 'length_cm'] },
  { id: 'falda', label: 'Falda', measureFields: ['waist_cm', 'hips_cm', 'length_cm'] },
  { id: 'pantalon', label: 'Pantalón', measureFields: ['waist_cm', 'hips_cm', 'length_cm'] },
  { id: 'zapatos', label: 'Calzado', measureFields: ['foot_cm'] },
];

const measureLabels: Record<string, string> = {
  chest_cm: 'Pecho (cm)',
  waist_cm: 'Cintura (cm)',
  hips_cm: 'Cadera (cm)',
  length_cm: 'Largo (cm)',
  foot_cm: 'Pie (cm)',
};

const sizeSystemOptions = [
  { value: 'letter', label: 'Letras (XS, S, M, L, XL)' },
  { value: 'numeric', label: 'Numérico (38, 40, 42...)' },
  { value: 'cm', label: 'Centímetros' },
];

const defaultLetterSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const defaultNumericSizes = ['36', '38', '40', '42', '44', '46', '48'];

export const SizeGuideEditor = ({ clientId, enabledCategories }: SizeGuideEditorProps) => {
  const { sizeGuides, loading, getSizeGuideForCategory, saveSizeGuide, deleteSizeGuide } = useSizeGuide(clientId);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sizeSystem, setSizeSystem] = useState<'letter' | 'numeric' | 'cm'>('letter');
  const [sizes, setSizes] = useState<SizeDefinition[]>([]);
  const [saving, setSaving] = useState(false);

  const categories = allCategories.filter(cat => enabledCategories.includes(cat.id));
  const currentCategoryConfig = allCategories.find(c => c.id === selectedCategory);

  // Load existing data when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSizes([]);
      setSizeSystem('letter');
      return;
    }

    const existing = getSizeGuideForCategory(selectedCategory);
    if (existing) {
      setSizeSystem(existing.size_system);
      setSizes(existing.sizes);
    } else {
      // Initialize with default sizes based on system
      setSizeSystem('letter');
      initializeDefaultSizes('letter');
    }
  }, [selectedCategory, sizeGuides]);

  const initializeDefaultSizes = (system: 'letter' | 'numeric' | 'cm') => {
    const labels = system === 'letter' ? defaultLetterSizes : 
                   system === 'numeric' ? defaultNumericSizes : 
                   ['Medida 1', 'Medida 2', 'Medida 3'];
    
    const newSizes: SizeDefinition[] = labels.map(label => ({
      label,
      chest_cm: undefined,
      waist_cm: undefined,
      hips_cm: undefined,
      length_cm: undefined,
      foot_cm: undefined,
    }));
    setSizes(newSizes);
  };

  const handleSystemChange = (value: 'letter' | 'numeric' | 'cm') => {
    setSizeSystem(value);
    initializeDefaultSizes(value);
  };

  const handleSizeChange = (index: number, field: keyof SizeDefinition, value: string | number) => {
    const updated = [...sizes];
    if (field === 'label') {
      updated[index] = { ...updated[index], [field]: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: value ? Number(value) : undefined };
    }
    setSizes(updated);
  };

  const addSize = () => {
    const newLabel = sizeSystem === 'letter' ? 'XXXL' : 
                     sizeSystem === 'numeric' ? String(50 + sizes.length * 2) : 
                     `Medida ${sizes.length + 1}`;
    setSizes([...sizes, { 
      label: newLabel,
      chest_cm: undefined,
      waist_cm: undefined,
      hips_cm: undefined,
      length_cm: undefined,
      foot_cm: undefined,
    }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCategory) return;
    
    setSaving(true);
    const success = await saveSizeGuide({
      client_id: clientId,
      category: selectedCategory,
      size_system: sizeSystem,
      sizes,
    });
    setSaving(false);

    if (success) {
      toast.success('Guía de talles guardada');
    } else {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    if (!confirm('¿Eliminar esta guía de talles?')) return;

    const success = await deleteSizeGuide(selectedCategory);
    if (success) {
      toast.success('Guía eliminada');
      setSizes([]);
    } else {
      toast.error('Error al eliminar');
    }
  };

  const hasExistingGuide = selectedCategory && getSizeGuideForCategory(selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configura las medidas exactas de tus talles para que el sistema calcule el ajuste con precisión. 
          Si no configuras una categoría, se usarán valores genéricos.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Guía de Talles por Categoría</CardTitle>
          <CardDescription>
            Define las medidas en centímetros para cada talle de tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selector */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría de prenda</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                      {getSizeGuideForCategory(cat.id) && ' ✓'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label>Sistema de talles</Label>
                <Select value={sizeSystem} onValueChange={(v) => handleSystemChange(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeSystemOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Size Table */}
          {selectedCategory && currentCategoryConfig && sizes.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Talle</TableHead>
                    {currentCategoryConfig.measureFields.map(field => (
                      <TableHead key={field}>{measureLabels[field]}</TableHead>
                    ))}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.map((size, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={size.label}
                          onChange={(e) => handleSizeChange(index, 'label', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      {currentCategoryConfig.measureFields.map(field => (
                        <TableCell key={field}>
                          <Input
                            type="number"
                            value={size[field as keyof SizeDefinition] || ''}
                            onChange={(e) => handleSizeChange(index, field as keyof SizeDefinition, e.target.value)}
                            placeholder="cm"
                            className="w-20"
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSize(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Actions */}
          {selectedCategory && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={addSize}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar talle
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
              {hasExistingGuide && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar guía
                </Button>
              )}
            </div>
          )}

          {/* Configured categories summary */}
          {sizeGuides.length > 0 && (
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Categorías configuradas:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizeGuides.map(guide => {
                  const cat = allCategories.find(c => c.id === guide.category);
                  return (
                    <span
                      key={guide.id}
                      className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                    >
                      {cat?.label || guide.category} ({guide.sizes.length} talles)
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
