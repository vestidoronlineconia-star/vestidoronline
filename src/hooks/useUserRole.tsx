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
        // Fetch explicit roles from user_roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
        }

        // Check if user has team memberships (by user_id or email)
        const userEmail = user.email?.toLowerCase() || '';
        const { data: memberships, error: membershipError } = await supabase
          .from('client_team_members')
          .select('id')
          .or(`user_id.eq.${user.id},email.eq.${userEmail}`)
          .not('accepted_at', 'is', null)
          .limit(1);

        if (membershipError) {
          console.error('Error fetching memberships:', membershipError);
        }

        // Build roles array
        let userRoles: AppRole[] = (rolesData || []).map(r => r.role as AppRole);
        
        // If user has memberships, ensure they have 'client' role
        if (memberships && memberships.length > 0 && !userRoles.includes('client')) {
          userRoles.push('client');
        }

        setRoles(userRoles);
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
