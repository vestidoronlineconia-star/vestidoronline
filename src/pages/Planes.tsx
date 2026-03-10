// TODO: This file's content was truncated in the GitHub PR diff.
// Replace with the actual Plans page implementation.

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/plans';
import { Check, X } from 'lucide-react';

export default function Planes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      <div className="relative w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-2">Elegí tu plan</h1>
        <p className="text-muted-foreground text-center mb-8">
          Desbloqueá el probador virtual sin límites.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                plan.highlight
                  ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(129,140,248,0.15)]'
                  : 'border-white/10 bg-card/30'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2 text-sm text-muted-foreground">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground/40'}>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? 'default' : 'outline'}
                className="w-full"
                disabled={plan.id === 'free'}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
