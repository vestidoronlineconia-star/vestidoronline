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

// TODO: The PLANS array was truncated in the GitHub diff.
// Replace this placeholder with the actual plan definitions.
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: '$0',
    period: '',
    description: 'Probá sin compromiso',
    icon: 'gift',
    features: [
      { text: '3 pruebas gratis', included: true },
      { text: 'Resolución estándar', included: true },
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
    description: 'Para uso personal',
    icon: 'zap',
    features: [
      { text: '50 pruebas/mes', included: true },
      { text: 'Resolución HD', included: true },
      { text: 'Vista 360°', included: true },
      { text: 'Soporte prioritario', included: false },
    ],
    cta: 'Elegir plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/mes',
    description: 'Para profesionales',
    icon: 'sparkles',
    features: [
      { text: 'Pruebas ilimitadas', included: true },
      { text: 'Resolución HD', included: true },
      { text: 'Vista 360°', included: true },
      { text: 'Soporte prioritario', included: true },
    ],
    highlight: true,
    badge: 'Popular',
    cta: 'Elegir plan',
  },
  {
    id: 'enterprise',
    name: 'Empresa',
    price: '$29.99',
    period: '/mes',
    description: 'Para equipos y marcas',
    icon: 'crown',
    features: [
      { text: 'Todo en Pro', included: true },
      { text: 'API de integración', included: true },
      { text: 'Widget embebible', included: true },
      { text: 'Soporte dedicado', included: true },
    ],
    cta: 'Contactar',
  },
];
