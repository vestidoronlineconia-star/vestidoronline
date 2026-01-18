import { Sparkles, Palette, Globe, Ruler, Play, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Palette,
    title: 'Personalizar Marca',
    description: 'Logo, colores y textos personalizados',
  },
  {
    icon: Globe,
    title: 'Dominios Autorizados',
    description: 'Control de dónde se usa el widget',
  },
  {
    icon: Ruler,
    title: 'Guía de Talles',
    description: 'Sistema de talles personalizado',
  },
  {
    icon: Play,
    title: 'Probar en Sandbox',
    description: 'Verificar antes de publicar',
  },
  {
    icon: Code,
    title: 'Código de Integración',
    description: 'Copiar y pegar en tu sitio',
  },
];

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">¡Bienvenido al Asistente de Configuración!</h2>
        <p className="text-muted-foreground">
          En unos simples pasos tendrás tu widget de probador virtual listo para usar en tu tienda.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {features.map((feature, index) => (
          <Card key={index} className="text-left">
            <CardContent className="p-4">
              <feature.icon className="h-6 w-6 text-primary mb-2" />
              <h4 className="font-medium text-sm">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4">
        <Button size="lg" onClick={onNext}>
          Comenzar Configuración
        </Button>
      </div>
    </div>
  );
};
