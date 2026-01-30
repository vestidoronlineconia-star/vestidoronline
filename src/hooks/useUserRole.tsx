import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'client' | 'user';

interface UserRoleState {
  role: AppRole | null;
  roles: AppRole[];
  isAdmin: boolean;
  isClient: boolean;
  isClientOwner: boolean;
  isTeamMember: boolean;
  canCreateClients: boolean;
  loading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isClientOwner, setIsClientOwner] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setIsClientOwner(false);
        setIsTeamMember(false);
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

        // Check if user owns any clients
        const { data: ownedClients, error: ownedError } = await supabase
          .from('embed_clients')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (ownedError) {
          console.error('Error fetching owned clients:', ownedError);
        }

        const hasOwnedClients = (ownedClients && ownedClients.length > 0);
        setIsClientOwner(hasOwnedClients);

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

        const hasMemberships = (memberships && memberships.length > 0);
        setIsTeamMember(hasMemberships && !hasOwnedClients);

        // Build roles array
        let userRoles: AppRole[] = (rolesData || []).map(r => r.role as AppRole);
        
        // If user has memberships or owns clients, ensure they have 'client' role
        if ((hasMemberships || hasOwnedClients) && !userRoles.includes('client')) {
          userRoles.push('client');
        }

        setRoles(userRoles);
      } catch (e) {
        console.error('Error fetching roles:', e);
        setRoles([]);
        setIsClientOwner(false);
        setIsTeamMember(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const isAdmin = roles.includes('admin');
  const isClient = roles.includes('client');
  // Only admins and client owners can create new clients, not team members
  const canCreateClients = isAdmin || isClientOwner;

  return {
    role: roles.length > 0 ? roles[0] : null,
    roles,
    isAdmin,
    isClient,
    isClientOwner,
    isTeamMember,
    canCreateClients,
    loading,
  };
};
