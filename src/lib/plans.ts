/**
 * Shared plan definitions used by PricingModal and Plans page.
 */

export interface PlanFeature {
  text: string;
  included: boolean;
}

export type PlanIcon = 'gift' | 'zap' | 'sparkles' | 'crown';

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: PlanIcon;
  features: PlanFeature[];
  highlight?: boolean;
  badge?: string;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: '$0',
    period: '',
    icon: 'gift',
    description: 'Para probar la experiencia.',
    features: [
      { text: '5 pruebas en total', included: true },
      { text: 'Vista frontal', included: true },
      { text: 'Historial de resultados', included: false },
      { text: 'Vista 360°', included: false },
      { text: 'Soporte prioritario', included: false },
    ],
    cta: 'Plan actual',
  },
  {
    id: 'basic',
    name: 'Básico',
    price: '$4.99',
    period: '/mes',
    icon: 'zap',
    description: 'Para uso personal frecuente.',
    features: [
      { text: '10 pruebas por mes', included: true },
      { text: 'Vista frontal', included: true },
      { text: 'Historial de resultados', included: true },
      { text: 'Vista 360°', included: false },
      { text: 'Soporte prioritario', included: false },
    ],
    cta: 'Elegir Básico',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$14.99',
    period: '/mes',
    icon: 'sparkles',
    description: 'La experiencia completa.',
    features: [
      { text: '50 pruebas por mes', included: true },
      { text: 'Vista frontal', included: true },
      { text: 'Historial de resultados', included: true },
      { text: 'Vista 360°', included: true },
      { text: 'Soporte prioritario', included: true },
    ],
    highlight: true,
    badge: 'Popular',
    cta: 'Elegir Pro',
  },
  {
    id: 'unlimited',
    name: 'Ilimitado',
    price: '$29.99',
    period: '/mes',
    icon: 'crown',
    description: 'Sin límites. Para los que más prueban.',
    features: [
      { text: 'Pruebas ilimitadas', included: true },
      { text: 'Vista frontal', included: true },
      { text: 'Historial de resultados', included: true },
      { text: 'Vista 360°', included: true },
      { text: 'Soporte prioritario', included: true },
    ],
    cta: 'Elegir Ilimitado',
  },
];
