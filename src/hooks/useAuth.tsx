import { useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  // Only update user state if the user ID actually changed
  // This prevents cascading re-fetches on TOKEN_REFRESHED (alt-tab)
  const updateAuth = useCallback((newSession: Session | null) => {
    const newUserId = newSession?.user?.id ?? null;
    if (newUserId !== userIdRef.current) {
      userIdRef.current = newUserId;
      setUser(newSession?.user ?? null);
    }
    setSession(newSession);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        updateAuth(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuth(session);
    });

    return () => subscription.unsubscribe();
  }, [updateAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
