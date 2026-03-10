import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Check, X, Sparkles, Zap, Crown, Gift, ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS, type PlanIcon } from '@/lib/plans';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

const ICON_COMPONENTS: Record<PlanIcon, React.ReactNode> = {
  gift: <Gift className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
};

const Planes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const preselected = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState<string>(preselected || 'pro');

  useEffect(() => {
    if (preselected && PLANS.some((p) => p.id === preselected)) {
      setSelectedPlan(preselected);
    }
  }, [preselected]);

  const activePlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];

  const handleSubscribe = () => {
    toast.info('Integración de pagos próximamente. Te vamos a notificar cuando esté disponible.');
  };

  return (
    <>
      <div className="bg-ambient" />
      <div className="min-h-screen relative">
        {/* Header */}
        <div className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Planes y precios</h1>
              <p className="text-sm text-muted-foreground">
                {profile && `${profile.free_uses_remaining} uso${profile.free_uses_remaining !== 1 ? 's' : ''} gratuito${profile.free_uses_remaining !== 1 ? 's' : ''} restante${profile.free_uses_remaining !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 fade-in-up">
          {/* Plan cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => plan.id !== 'free' && setSelectedPlan(plan.id)}
                  className={`relative flex flex-col rounded-xl border p-5 transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-[0_0_25px_rgba(129,140,248,0.2)] ring-1 ring-primary/50'
                      : plan.id === 'free'
                        ? 'border-white/5 bg-card/20 opacity-60'
                        : 'border-white/10 bg-card/30 hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}

                  <div className={`flex items-center gap-2 mb-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {ICON_COMPONENTS[plan.icon]}
                    <span className="font-semibold text-foreground">{plan.name}</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-muted-foreground' : 'text-muted-foreground/30'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Comparison table - desktop */}
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold mb-4">Comparación de planes</h2>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-card/30">
                    <th className="text-left p-4 text-muted-foreground font-medium">Característica</th>
                    {PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        className={`p-4 text-center font-medium ${
                          plan.id === selectedPlan ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-muted-foreground">Pruebas</td>
                    <td className="p-4 text-center text-muted-foreground">5 total</td>
                    <td className="p-4 text-center text-muted-foreground">10/mes</td>
                    <td className="p-4 text-center text-muted-foreground">50/mes</td>
                    <td className="p-4 text-center text-muted-foreground">Ilimitadas</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-muted-foreground">Vista frontal</td>
                    {PLANS.map((p) => (
                      <td key={p.id} className="p-4 text-center">
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-muted-foreground">Historial de resultados</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/30 mx-auto" /></td>
                    {PLANS.slice(1).map((p) => (
                      <td key={p.id} className="p-4 text-center">
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-muted-foreground">Vista 360°</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/30 mx-auto" /></td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/30 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground">Soporte prioritario</td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/30 mx-auto" /></td>
                    <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/30 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment section */}
          {selectedPlan !== 'free' && (
            <div className="rounded-xl border border-white/10 bg-card/30 p-6 fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-primary/10 text-primary`}>
                    {ICON_COMPONENTS[activePlan.icon]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Plan {activePlan.name}</h3>
                    <p className="text-muted-foreground text-sm">{activePlan.description}</p>
                    <p className="text-2xl font-bold mt-1">
                      {activePlan.price}<span className="text-sm font-normal text-muted-foreground">{activePlan.period}</span>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSubscribe}
                  size="lg"
                  className="sm:min-w-[200px] shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:shadow-[0_0_30px_rgba(129,140,248,0.5)]"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Suscribirme
                </Button>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <span>Pago seguro con encriptación SSL</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="w-5 h-5 text-primary shrink-0" />
                  <span>Cancelá cuando quieras, sin penalidad</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CreditCard className="w-5 h-5 text-primary shrink-0" />
                  <span>Tarjeta de crédito, débito o MercadoPago</span>
                </div>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: '¿Puedo cambiar de plan en cualquier momento?',
                  a: 'Sí, podés mejorar o reducir tu plan cuando quieras. El cambio se aplica de forma inmediata y se ajusta el cobro proporcional.',
                },
                {
                  q: '¿Qué pasa con mis usos si cancelo?',
                  a: 'Si cancelás, seguís teniendo acceso hasta el final del período que ya pagaste. Después, tu cuenta vuelve al plan gratuito.',
                },
                {
                  q: '¿Cómo se cuentan las pruebas?',
                  a: 'Cada vez que generás una imagen de virtual try-on cuenta como una prueba. La vista 360° no consume un uso adicional.',
                },
                {
                  q: '¿Qué métodos de pago aceptan?',
                  a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) y MercadoPago.',
                },
              ].map((faq) => (
                <div key={faq.q} className="rounded-lg border border-white/10 bg-card/20 p-4">
                  <p className="font-medium text-sm">{faq.q}</p>
                  <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Planes;