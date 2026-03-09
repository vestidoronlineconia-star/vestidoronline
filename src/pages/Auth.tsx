import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google');
      setLoading(false);
    }
  };

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

    // Validar campos adicionales en registro
    if (!isLogin && !fullName.trim()) {
      toast.error('El nombre completo es requerido');
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
          body: {
            email: validation.data.email,
            password: validation.data.password,
            full_name: fullName.trim(),
            birth_date: birthDate || undefined,
            gender: gender || undefined,
          },
        });

        if (signupError || signupData?.error) {
          const errMsg = signupData?.error || signupError?.message;
          if (errMsg === 'already_registered') {
            throw new Error('already registered');
          }
          throw new Error(errMsg || 'Error al registrar');
        }

        toast.success('Cuenta creada. Revisa tu bandeja de entrada para confirmar tu email.');
      }
    } catch (error: unknown) {
      let message = 'Error de autenticación';
      const errMsg = error instanceof Error ? error.message : '';
      if (errMsg.includes('Email not confirmed')) {
        message = 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
      } else if (errMsg.includes('Invalid login')) {
        message = 'Email o contraseña incorrectos';
      } else if (errMsg.includes('already registered')) {
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

          {/* Google login button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/30 px-2 text-muted-foreground backdrop-blur-sm">
                o con email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campos adicionales de registro */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Género</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Femenino</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="non_binary">No binario</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

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
                  ))}
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
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'No se pudo enviar el email');
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
