import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        navigate('/auth', { replace: true });
        return;
      }

      if (session) {
        navigate('/', { replace: true });
      } else {
        // Listen for auth state change in case session is being established
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            navigate('/', { replace: true });
          }
        });

        // Timeout fallback
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
