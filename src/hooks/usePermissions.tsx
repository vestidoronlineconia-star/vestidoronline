import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TeamRole } from './useTeam';

export interface Permission {
  canViewAnalytics: boolean;
  canEditBranding: boolean;
  canManageProducts: boolean;
  canManageSizes: boolean;
  canManageDomains: boolean;
  canManageWebhooks: boolean;
  canManageTeam: boolean;
  canDeleteClient: boolean;
  canTransferOwnership: boolean;
}

const ROLE_PERMISSIONS: Record<TeamRole, Permission> = {
  owner: {
    canViewAnalytics: true,
    canEditBranding: true,
    canManageProducts: true,
    canManageSizes: true,
    canManageDomains: true,
    canManageWebhooks: true,
    canManageTeam: true,
    canDeleteClient: true,
    canTransferOwnership: true,
  },
  admin: {
    canViewAnalytics: true,
    canEditBranding: true,
    canManageProducts: true,
    canManageSizes: true,
    canManageDomains: true,
    canManageWebhooks: true,
    canManageTeam: true,
    canDeleteClient: false,
    canTransferOwnership: false,
  },
  editor: {
    canViewAnalytics: true,
    canEditBranding: true,
    canManageProducts: true,
    canManageSizes: true,
    canManageDomains: false,
    canManageWebhooks: false,
    canManageTeam: false,
    canDeleteClient: false,
    canTransferOwnership: false,
  },
  viewer: {
    canViewAnalytics: true,
    canEditBranding: false,
    canManageProducts: false,
    canManageSizes: false,
    canManageDomains: false,
    canManageWebhooks: false,
    canManageTeam: false,
    canDeleteClient: false,
    canTransferOwnership: false,
  },
};

export const usePermissions = (clientId: string | null) => {
  const [role, setRole] = useState<TeamRole | null>(null);
  const [permissions, setPermissions] = useState<Permission>(ROLE_PERMISSIONS.viewer);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!clientId) {
      setRole(null);
      setPermissions(ROLE_PERMISSIONS.viewer);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setRole(null);
        setPermissions(ROLE_PERMISSIONS.viewer);
        return;
      }

      // Check if user is the owner
      const { data: clientData } = await supabase
        .from('embed_clients')
        .select('user_id')
        .eq('id', clientId)
        .single();

      if (clientData?.user_id === userData.user.id) {
        setRole('owner');
        setIsOwner(true);
        setPermissions(ROLE_PERMISSIONS.owner);
        return;
      }

      // Check team membership
      const { data: memberData } = await supabase
        .from('client_team_members')
        .select('role')
        .eq('client_id', clientId)
        .eq('user_id', userData.user.id)
        .not('accepted_at', 'is', null)
        .single();

      if (memberData) {
        const memberRole = memberData.role as TeamRole;
        setRole(memberRole);
        setIsOwner(false);
        setPermissions(ROLE_PERMISSIONS[memberRole]);
      } else {
        setRole(null);
        setIsOwner(false);
        setPermissions(ROLE_PERMISSIONS.viewer);
      }
    } catch (err) {
      setRole(null);
      setPermissions(ROLE_PERMISSIONS.viewer);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

  const requiresRole = (requiredRole: TeamRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy: TeamRole[] = ['viewer', 'editor', 'admin', 'owner'];
    const currentRoleIndex = roleHierarchy.indexOf(role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return currentRoleIndex >= requiredRoleIndex;
  };

  return {
    role,
    permissions,
    loading,
    isOwner,
    hasPermission,
    requiresRole,
    refetch: fetchPermissions,
  };
};

export const getPermissionsForRole = (role: TeamRole): Permission => {
  return ROLE_PERMISSIONS[role];
};
