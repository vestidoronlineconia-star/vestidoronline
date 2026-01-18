import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'client' | 'user';

interface UserRoleState {
  role: AppRole | null;
  roles: AppRole[];
  isAdmin: boolean;
  isClient: boolean;
  canCreateClients: boolean;
  loading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
        } else {
          // Cast the role strings to AppRole type
          const userRoles = (data || []).map(r => r.role as AppRole);
          setRoles(userRoles);
        }
      } catch (e) {
        console.error('Error fetching roles:', e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const isAdmin = roles.includes('admin');
  const isClient = roles.includes('client');
  const canCreateClients = isAdmin || isClient;

  return {
    role: roles.length > 0 ? roles[0] : null,
    roles,
    isAdmin,
    isClient,
    canCreateClients,
    loading,
  };
};
