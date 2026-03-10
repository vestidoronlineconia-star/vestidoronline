// TODO: This file's content was truncated in the GitHub PR diff.
// Replace with the actual Onboarding page implementation.

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, createProfile, updateProfile } = useUserProfile();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      <div className="w-full max-w-lg relative">
        <div className="backdrop-blur-xl bg-card/30 border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-bold mb-2">Bienvenido al probador virtual</h1>
          <p className="text-muted-foreground mb-6">
            Completá tu perfil para comenzar a probar ropa digitalmente.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Esta página está en construcción. El contenido completo vendrá del PR de GitHub.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
