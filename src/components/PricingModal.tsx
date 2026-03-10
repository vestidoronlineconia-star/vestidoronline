import { Check, X, Sparkles, Zap, Crown, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { PLANS, type Plan, type PlanIcon } from '@/lib/plans';

const ICON_COMPONENTS: Record<PlanIcon, React.ReactNode> = {
  gift: <Gift className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  crown: <Crown className="w-5 h-5" />,
};

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const navigate = useNavigate();

  const handleSelectPlan = (plan: Plan) => {
    onOpenChange(false);
    navigate(`/planes?plan=${plan.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            Elegí tu plan
          </DialogTitle>
          <DialogDescription>
            Desbloqueá el probador virtual sin límites.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-4 transition-all ${
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

              <div className={`flex items-center gap-2 mb-2 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                {ICON_COMPONENTS[plan.icon]}
                <span className="font-semibold text-foreground text-sm">{plan.name}</span>
              </div>

              <div className="mb-3">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
              </div>

              <ul className="space-y-1.5 mb-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    {feature.included ? (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground/40'}>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                variant={plan.highlight ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                disabled={plan.id === 'free'}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Cancelá cuando quieras. Sin compromiso.
        </p>
      </DialogContent>
    </Dialog>
  );
}
