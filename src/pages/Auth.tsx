import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// Regex simples y seguros (sin ReDoS)
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_SPECIAL_CHAR = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?¡¿]/;

const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres')
  .refine((val) => HAS_UPPERCASE.test(val), 'Debe incluir al menos una letra mayúscula')
  .refine((val) => HAS_LOWERCASE.test(val), 'Debe incluir al menos una letra minúscula')
  .refine((val) => HAS_SPECIAL_CHAR.test(val), 'Debe incluir al menos un carácter especial (!@#$%&*)');

const authSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
  password: passwordSchema,
});

// Schema más permisivo para login (no requiere los requisitos de complejidad)
const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(1, 'La contraseña es requerida').max(128),
});

// Dominios de email para autocompletado (lista estática para seguridad)
const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

// Función para obtener sugerencias de email
const getEmailSuggestions = (email: string): string[] => {
  if (!email.includes('@')) return [];
  
  const atIndex = email.indexOf('@');
  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex + 1).toLowerCase();
  
  // Si no hay parte local, no sugerir
  if (!localPart) return [];
  
  // Filtrar dominios que empiecen con lo que escribió el usuario
  return EMAIL_DOMAINS
    .filter(domain => domain.startsWith(domainPart) && domain !== domainPart)
    .map(domain => `${localPart}@${domain}`);
};

// Componente para mostrar requisitos de contraseña
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className={cn(
    "flex items-center gap-2 transition-colors",
    met ? "text-green-500" : "text-muted-foreground"
  )}>
    {met ? (
      <Check className="w-3 h-3" />
    ) : (
      <X className="w-3 h-3" />
    )}
    <span>{text}</span>
  </div>
);

// Función para verificar requisitos de contraseña
const checkPasswordRequirements = (pwd: string) => ({
  hasMinLength: pwd.length >= 8,
  hasUppercase: HAS_UPPERCASE.test(pwd),
  hasLowercase: HAS_LOWERCASE.test(pwd),
  hasSpecialChar: HAS_SPECIAL_CHAR.test(pwd),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { checkPassword, checking } = usePasswordValidation();

  const suggestions = getEmailSuggestions(email);
  const passwordReqs = checkPasswordRequirements(password);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emailInputRef.current && 
        !emailInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index cuando cambian las sugerencias
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length]);

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          setEmail(suggestions[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (suggestions[selectedIndex]) {
          setEmail(suggestions[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEmail(suggestion);
    setShowSuggestions(false);
    emailInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Usar schema apropiado según login o registro
    const schema = isLogin ? loginSchema : authSchema;
    const validation = schema.safeParse({ email, password });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    // Validar confirmación de contraseña en registro
    if (!isLogin && password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });
        if (error) throw error;
        navigate(redirectPath || '/');
      } else {
        // Verificar contraseña comprometida antes del registro
        const pwdCheck = await checkPassword(validation.data.password);
        
        if (pwdCheck.isCompromised) {
          toast.error('Esta contraseña es muy común y fácil de adivinar. Por tu seguridad, elige una diferente.');
          setLoading(false);
          return;
        }

        // Register via edge function (creates user + sends branded email via Resend)
        const { data: signupData, error: signupError } = await supabase.functions.invoke('send-confirmation-email', {
          body: { email: validation.data.email, password: validation.data.password },
        });

        if (signupError || signupData?.error) {
          const errMsg = signupData?.error || signupError?.message;
          if (errMsg === 'already_registered') {
            throw new Error('already registered');
          }
          throw new Error(errMsg || 'Error al registrar');
        }

        toast.success('Revisa tu bandeja de entrada para confirmar tu email');
      }
    } catch (error: any) {
      let message = 'Error de autenticación';
      if (error.message?.includes('Email not confirmed')) {
        message = 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
      } else if (error.message?.includes('Invalid login')) {
        message = 'Email o contraseña incorrectos';
      } else if (error.message?.includes('already registered')) {
        message = 'Este email ya está registrado';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      
      <div className="w-full max-w-md relative">
        <div className="backdrop-blur-xl bg-card/30 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-center mb-2">
            Prueba ropa digitalmente
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 relative">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleEmailKeyDown}
                placeholder="tu@email.com"
                required
                maxLength={255}
                autoComplete="email"
              />
              
              {/* Dropdown de sugerencias de email */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors",
                        index === selectedIndex 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {suggestion}
                    </button>
                  ))
                  }
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                maxLength={128}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              
              {/* Indicador de requisitos de contraseña (solo en registro) */}
              {!isLogin && password.length > 0 && (
                <div className="text-xs space-y-1 mt-2 p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium text-muted-foreground mb-2">
                    Requisitos de contraseña:
                  </p>
                  <RequirementItem 
                    met={passwordReqs.hasMinLength} 
                    text="Mínimo 8 caracteres" 
                  />
                  <RequirementItem 
                    met={passwordReqs.hasUppercase} 
                    text="Una letra mayúscula (A-Z)" 
                  />
                  <RequirementItem 
                    met={passwordReqs.hasLowercase} 
                    text="Una letra minúscula (a-z)" 
                  />
                  <RequirementItem 
                    met={passwordReqs.hasSpecialChar} 
                    text="Un carácter especial (!@#$%&*)" 
                  />
                </div>
              )}
            </div>

            {/* Campo de confirmar contraseña (solo en registro) */}
            {!isLogin && (
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
            )}

            <Button type="submit" className="w-full" disabled={loading || checking}>
              {checking 
                ? 'Verificando seguridad...' 
                : loading 
                  ? 'Cargando...' 
                  : isLogin 
                    ? 'Iniciar Sesión' 
                    : 'Crear Cuenta'
              }
            </Button>
          </form>


          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error('Escribí tu email arriba y luego hacé clic en "Olvidé mi contraseña"');
                    return;
                  }
                  setLoading(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('send-password-reset', {
                      body: { email: email.trim() },
                    });
                    if (error || data?.error) throw new Error(data?.error || error?.message);
                    toast.success('Revisá tu bandeja de entrada para restablecer tu contraseña.');
                  } catch (err: any) {
                    toast.error(err.message || 'No se pudo enviar el email');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-sm text-primary hover:underline transition-colors"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

