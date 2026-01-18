import { CheckCircle2, ArrowRight, BarChart2, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface CompleteStepProps {
  clientId: string;
}

export const CompleteStep = ({ clientId }: CompleteStepProps) => {
  const navigate = useNavigate();

  const nextSteps = [
    {
      icon: BarChart2,
      title: 'Ver Analytics',
      description: 'Monitorea el uso de tu widget',
      action: () => navigate(`/client-portal/analytics/${clientId}`),
    },
    {
      icon: Package,
      title: 'Agregar Productos',
      description: 'Sincroniza tu catálogo de productos',
      action: () => navigate(`/client-portal/products/${clientId}`),
    },
    {
      icon: Settings,
      title: 'Configuración Avanzada',
      description: 'Personaliza más opciones',
      action: () => navigate(`/client-portal/settings/${clientId}`),
    },
  ];

  return (
    <div className="space-y-8 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">¡Configuración Completa!</h2>
        <p className="text-muted-foreground">
          Tu widget de probador virtual está listo para usarse. Ya puedes instalarlo en tu sitio web.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {nextSteps.map((step, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={step.action}
          >
            <CardContent className="p-4 text-left">
              <step.icon className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-medium mb-1">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button size="lg" onClick={() => navigate('/client-portal')}>
        Ir al Panel Principal
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};
