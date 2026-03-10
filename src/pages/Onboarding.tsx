import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, RotateCcw, Check, ArrowRight, User, PersonStanding, UserCircle } from 'lucide-react';

type Step = 'profile' | 'selfie' | 'body';

export default function Onboarding() {
  const { user } = useAuth();
  const { profile, createProfile, updateProfile, refetch } = useUserProfile();
  const navigate = useNavigate();

  // Determine initial step based on profile state
  const getInitialStep = (): Step => {
    if (!profile) return 'profile';
    if (!profile.selfie_url) return 'selfie';
    if (!profile.body_photo_url) return 'body';
    return 'selfie'; // shouldn't happen, but fallback
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Timer state (for body photo)
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update step when profile loads
  useEffect(() => {
    setStep(getInitialStep());
  }, [profile]);

  // Pre-fill name from Google metadata if available
  useEffect(() => {
    if (!profile && user) {
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        '';
      if (name) setFullName(name);
    }
  }, [user, profile]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async (mode?: 'user' | 'environment') => {
    const useMode = mode ?? facingMode;
    setCameraError(null);
    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: useMode, width: { ideal: 640 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
    }
  }, [facingMode]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [facingMode]);

  const handleCaptureSelfie = () => {
    const photo = capturePhoto();
    if (photo) {
      setSelfiePreview(photo);
      stopCamera();
    }
  };

  const startBodyCountdown = () => {
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          const photo = capturePhoto();
          if (photo) {
            setBodyPreview(photo);
            stopCamera();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setSavingProfile(true);
    try {
      const created = await createProfile({
        full_name: fullName.trim(),
        birth_date: birthDate || undefined,
        gender: (gender as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say') || undefined,
      });
      if (!created) throw new Error('Failed');
      toast.success('Perfil guardado');
      setStep('selfie');
    } catch {
      toast.error('No se pudo guardar el perfil. Intentá de nuevo.');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadPhoto = async (dataUrl: string, type: 'selfie' | 'body'): Promise<string | null> => {
    if (!user) return null;
    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `${user.id}/${type}_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('user-photos')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFinish = async () => {
    if (!selfiePreview || !bodyPreview) {
      toast.error('Necesitás ambas fotos para continuar');
      return;
    }
    setUploading(true);
    try {
      const [selfieUrl, bodyUrl] = await Promise.all([
        uploadPhoto(selfiePreview, 'selfie'),
        uploadPhoto(bodyPreview, 'body'),
      ]);

      if (!selfieUrl || !bodyUrl) throw new Error('Upload failed');

      const updated = await updateProfile({
        selfie_url: selfieUrl,
        body_photo_url: bodyUrl,
      });

      if (!updated) throw new Error('Profile update failed');

      toast.success('¡Todo listo! Ya podés usar el probador.');
      navigate('/', { replace: true });
    } catch {
      toast.error('Error al guardar las fotos. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const toggleFacingMode = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (cameraActive) {
      startCamera(newMode);
    }
  };

  // Skip onboarding if everything is complete
  useEffect(() => {
    if (profile && profile.selfie_url && profile.body_photo_url) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  // ── Profile step ──
  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
        <div className="w-full max-w-md relative">
          <div className="backdrop-blur-xl bg-card/30 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <UserCircle className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-1">Completá tu perfil</h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Necesitamos algunos datos para personalizar tu experiencia.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  maxLength={100}
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="non_binary">No binario</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleSaveProfile}
                disabled={savingProfile || !fullName.trim()}
              >
                {savingProfile ? 'Guardando...' : 'Continuar'}
                {!savingProfile && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Photo steps (selfie / body) ──
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />

      <div className="w-full max-w-lg relative">
        <div className="backdrop-blur-xl bg-card/30 border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'selfie' ? 'bg-primary text-primary-foreground' : selfiePreview ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
              {selfiePreview ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
              Selfie
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 'body' ? 'bg-primary text-primary-foreground' : bodyPreview ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
              {bodyPreview ? <Check className="w-4 h-4" /> : <PersonStanding className="w-4 h-4" />}
              Cuerpo completo
            </div>
          </div>

          <h2 className="text-xl font-bold text-center mb-1">
            {step === 'selfie' ? 'Tomá una selfie' : 'Foto de cuerpo completo'}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-4">
            {step === 'selfie'
              ? 'Necesitamos una foto de tu rostro para personalizar la experiencia.'
              : 'Colocate de pie, con buena iluminación. El temporizador de 5 segundos te da tiempo para posicionarte.'}
          </p>

          {/* Camera / Preview area */}
          <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden mb-4">
            {/* Video always in DOM so ref is available */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlaying={() => setCameraActive(true)}
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${cameraActive && !((step === 'selfie' && selfiePreview) || (step === 'body' && bodyPreview)) ? '' : 'invisible'}`}
            />
            {cameraActive && !((step === 'selfie' && selfiePreview) || (step === 'body' && bodyPreview)) && countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
              </div>
            )}
            {(step === 'selfie' && selfiePreview) || (step === 'body' && bodyPreview) ? (
              <img
                src={step === 'selfie' ? selfiePreview! : bodyPreview!}
                alt={step === 'selfie' ? 'Selfie' : 'Foto cuerpo completo'}
                className="w-full h-full object-cover"
              />
            ) : !cameraActive ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                {cameraError ? (
                  <p className="text-sm text-center px-4">{cameraError}</p>
                ) : (
                  <>
                    <Camera className="w-12 h-12" />
                    <p className="text-sm">Presioná para activar la cámara</p>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!cameraActive && !((step === 'selfie' && selfiePreview) || (step === 'body' && bodyPreview)) && (
              <Button className="flex-1 gap-2" onClick={() => startCamera()}>
                <Camera className="w-4 h-4" />
                Activar cámara
              </Button>
            )}

            {cameraActive && countdown === null && (
              <>
                <Button variant="outline" size="icon" onClick={toggleFacingMode}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                {step === 'selfie' ? (
                  <Button className="flex-1 gap-2" onClick={handleCaptureSelfie}>
                    <Camera className="w-4 h-4" />
                    Capturar selfie
                  </Button>
                ) : (
                  <Button className="flex-1 gap-2" onClick={startBodyCountdown}>
                    <Camera className="w-4 h-4" />
                    Iniciar temporizador (5s)
                  </Button>
                )}
              </>
            )}

            {((step === 'selfie' && selfiePreview) || (step === 'body' && bodyPreview)) && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (step === 'selfie') setSelfiePreview(null);
                    else setBodyPreview(null);
                    startCamera();
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Repetir
                </Button>
                {step === 'selfie' ? (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setStep('body')}
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleFinish}
                    disabled={uploading}
                  >
                    {uploading ? 'Guardando...' : 'Finalizar'}
                    {!uploading && <Check className="w-4 h-4" />}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}