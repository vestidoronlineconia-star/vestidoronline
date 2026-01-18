import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export const TEAM_ROLES: { id: TeamRole; label: string; description: string }[] = [
  { id: 'admin', label: 'Administrador', description: 'Puede gestionar todo excepto eliminar la cuenta' },
  { id: 'editor', label: 'Editor', description: 'Puede editar productos, branding y talles' },
  { id: 'viewer', label: 'Visor', description: 'Solo puede ver analytics y configuración' },
];

export interface TeamMember {
  id: string;
  client_id: string;
  user_id: string | null;
  email: string;
  role: TeamRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface InviteMemberData {
  email: string;
  role: TeamRole;
}

export const useTeam = (clientId: string | null) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!clientId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_team_members')
        .select('*')
        .eq('client_id', clientId)
        .order('invited_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMembers((data || []) as TeamMember[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading team members';
      setError(message);
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = async (memberData: InviteMemberData): Promise<TeamMember | null> => {
    if (!clientId) return null;

    try {
      // Check if member already exists
      const existing = members.find(m => m.email.toLowerCase() === memberData.email.toLowerCase());
      if (existing) {
        toast.error('Este usuario ya es miembro del equipo');
        return null;
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error: createError } = await supabase
        .from('client_team_members')
        .insert({
          client_id: clientId,
          email: memberData.email.toLowerCase(),
          role: memberData.role,
          invited_by: userData.user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      const typedData = data as TeamMember;
      setMembers(prev => [typedData, ...prev]);
      toast.success('Invitación enviada correctamente');
      return typedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inviting member';
      toast.error(message);
      console.error('Error inviting member:', err);
      return null;
    }
  };

  const updateMemberRole = async (memberId: string, newRole: TeamRole): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('client_team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      toast.success('Rol actualizado correctamente');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating member role';
      toast.error(message);
      console.error('Error updating member role:', err);
      return false;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('client_team_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Miembro eliminado del equipo');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error removing member';
      toast.error(message);
      console.error('Error removing member:', err);
      return false;
    }
  };

  const resendInvitation = async (memberId: string): Promise<boolean> => {
    // In a real implementation, this would trigger an email
    toast.success('Invitación reenviada');
    return true;
  };

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    resendInvitation,
  };
};
