import { useState } from 'react';
import { useTeam, TeamMember, TeamRole, TEAM_ROLES } from '@/hooks/useTeam';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Loader2,
  Mail,
  Clock,
  CheckCircle
} from 'lucide-react';
import { InviteMemberModal } from './InviteMemberModal';
import { toast } from 'sonner';

interface TeamManagerProps {
  clientId: string;
}

export const TeamManager = ({ clientId }: TeamManagerProps) => {
  const { members, loading, inviteMember, updateMemberRole, removeMember, resendInvitation } = useTeam(clientId);
  const { permissions } = usePermissions(clientId);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const canManageTeam = permissions?.canManageTeam || false;

  const handleInvite = async (email: string, role: TeamRole) => {
    await inviteMember({ email, role });
    setIsInviteOpen(false);
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (confirm(`¿Eliminar a ${email} del equipo?`)) {
      await removeMember(memberId);
    }
  };

  const handleResend = async (memberId: string) => {
    await resendInvitation(memberId);
    toast.success('Invitación reenviada');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'editor': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Equipo</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona quién tiene acceso a este cliente
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invitar Miembro
          </Button>
        )}
      </div>

      {/* Roles legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        {TEAM_ROLES.map(role => (
          <div key={role.id} className="flex items-center gap-2">
            <Badge variant={getRoleColor(role.id)}>{role.label}</Badge>
            <span className="text-xs text-muted-foreground">{role.description}</span>
          </div>
        ))}
      </div>

      {/* Team members list */}
      <div className="space-y-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {member.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.email}</span>
                    {member.accepted_at ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendiente
                      </Badge>
                    )}
                  </div>
                  {!member.accepted_at && member.invited_at && (
                    <p className="text-xs text-muted-foreground">
                      Invitado el {new Date(member.invited_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {member.role === 'owner' ? (
                  <Badge>Propietario</Badge>
                ) : canManageTeam ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value as TeamRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getRoleColor(member.role)}>
                    {TEAM_ROLES.find(r => r.id === member.role)?.label || member.role}
                  </Badge>
                )}

                {canManageTeam && member.role !== 'owner' && (
                  <>
                    {!member.accepted_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(member.id)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.id, member.email)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite modal */}
      <InviteMemberModal
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
};
