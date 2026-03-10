import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_SPECIAL_CHAR = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?¡¿]/;

const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres')
  .refine((val) => HAS_UPPERCASE.test(val), 'Debe incluir al menos una letra mayúscula')
  .refine((val) => HAS_LOWERCASE.test(val), 'Debe incluir al menos una letra minúscula')
  .refine((val) => HAS_SPECIAL_CHAR.test(val), 'Debe incluir al menos un carácter especial');

const checkPasswordRequirements = (pwd: string) => ({
  hasMinLength: pwd.length >= 8,
  hasUppercase: HAS_UPPERCASE.test(pwd),
  hasLowercase: HAS_LOWERCASE.test(pwd),
  hasSpecialChar: HAS_SPECIAL_CHAR.test(pwd),
});

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className={cn("flex items-center gap-2 transition-colors", met ? "text-green-500" : "text-muted-foreground")}>
    {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    <span>{text}</span>
  </div>
);

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const passwordReqs = checkPasswordRequirements(password);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Tu contraseña fue actualizada correctamente.');
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
        <div className="text-center">
          <p className="text-muted-foreground">Verificando enlace de recuperación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="backdrop-blur-xl bg-card/30 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-center mb-2">Nueva contraseña</h1>
          <p className="text-muted-foreground text-center mb-6">Ingresá tu nueva contraseña</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                maxLength={128}
                autoComplete="new-password"
              />
              {password.length > 0 && (
                <div className="text-xs space-y-1 mt-2 p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-muted-foreground mb-2">Requisitos:</p>
                  <RequirementItem met={passwordReqs.hasMinLength} text="Mínimo 8 caracteres" />
                  <RequirementItem met={passwordReqs.hasUppercase} text="Una letra mayúscula (A-Z)" />
                  <RequirementItem met={passwordReqs.hasLowercase} text="Una letra minúscula (a-z)" />
                  <RequirementItem met={passwordReqs.hasSpecialChar} text="Un carácter especial (!@#$%&*)" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                maxLength={128}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && (
                <div className="text-xs mt-1">
                  <RequirementItem
                    met={password === confirmPassword}
                    text={password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
