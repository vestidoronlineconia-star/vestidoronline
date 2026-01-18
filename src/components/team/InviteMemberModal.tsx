import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TeamRole, TEAM_ROLES } from '@/hooks/useTeam';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: TeamRole) => Promise<void>;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['Ver analytics', 'Editar branding', 'Gestionar productos', 'Gestionar dominios', 'Gestionar equipo'],
  editor: ['Ver analytics', 'Editar branding', 'Gestionar productos'],
  viewer: ['Ver analytics'],
};

export const InviteMemberModal = ({ open, onClose, onInvite }: InviteMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('viewer');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    try {
      await onInvite(email, role);
      setEmail('');
      setRole('viewer');
      onClose();
    } finally {
      setSending(false);
    }
  };

  // Filter out 'owner' role for invitations
  const invitableRoles = TEAM_ROLES.filter(r => r.id !== 'owner');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar Miembro</DialogTitle>
          <DialogDescription>
            Envía una invitación por email para unirse al equipo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Rol</Label>
            <RadioGroup 
              value={role} 
              onValueChange={(value) => setRole(value as TeamRole)}
            >
              {invitableRoles.map((roleOption) => (
                <div
                  key={roleOption.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                  onClick={() => setRole(roleOption.id)}
                >
                  <RadioGroupItem value={roleOption.id} id={roleOption.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={roleOption.id} className="font-medium cursor-pointer">
                      {roleOption.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {roleOption.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ROLE_PERMISSIONS[roleOption.id]?.map((perm) => (
                        <span 
                          key={perm} 
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sending || !email}>
              {sending ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
