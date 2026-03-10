import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        navigate('/auth', { replace: true });
        return;
      }

      if (session) {
        await ensureProfile(session.user);
        navigate('/', { replace: true });
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            await ensureProfile(session.user);
            navigate('/', { replace: true });
          }
        });

        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/auth', { replace: true });
        }, 5000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      <div className="animate-pulse text-muted-foreground">Autenticando...</div>
    </div>
  );
}

async function ensureProfile(user: { id: string; user_metadata?: Record<string, unknown>; email?: string }) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) return;

    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Usuario';

    await supabase.from('user_profiles').insert({
      user_id: user.id,
      full_name: fullName,
    });
  } catch {
    // Profile creation will be retried on next visit
  }
}
