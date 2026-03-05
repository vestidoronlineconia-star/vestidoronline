import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/FileUpload";
import { LoadingProgress } from "@/components/LoadingProgress";
import { PromptDebugPanel, DebugLog } from "@/components/PromptDebugPanel";
import { TryOnHistory } from "@/components/TryOnHistory";
import { Sparkles, Download, RotateCw, ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CompressionResult } from "@/lib/imageCompression";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { calculateFit, FitResult } from "@/lib/calculateFit";
import { GARMENT_CATEGORIES, DEFAULT_SIZES } from "@/lib/categories";
import { FileData, TryOnStatus, View360Status } from "@/types";

// Check if we're in development mode
const isDev = import.meta.env.DEV;

const base64ToBlob = (base64: string): Blob => {
  const data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/jpeg' });
};

const Index = () => {
  const { user } = useAuth();
  const { profile, hasFreeUses, decrementUse } = useUserProfile();
  const [userImg, setUserImg] = useState<FileData | null>(null);
  const [clothImg, setClothImg] = useState<FileData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userSize, setUserSize] = useState<string | null>(null);
  const [garmentSize, setGarmentSize] = useState<string | null>(null);

  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // 360 view state
  const [view360Image, setView360Image] = useState<string | null>(null);
  const [view360Status, setView360Status] = useState<View360Status>("idle");
  const [view360Progress, setView360Progress] = useState(0);
  const view360ProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const [showingView360, setShowingView360] = useState(false);
  const analysisRef = useRef<Record<string, unknown> | null>(null);

  // Debug panel state
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // History panel state
  const [showHistory, setShowHistory] = useState(false);

  const addDebugLog = (log: Omit<DebugLog, "id" | "timestamp">) => {
    const newLog: DebugLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setDebugLogs((prev) => [...prev, newLog]);
    return newLog.id;
  };

  const updateDebugLog = (id: string, updates: Partial<DebugLog>) => {
    setDebugLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, ...updates } : log))
    );
  };

  // Progress simulation effect
  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (status === "analyzing") {
      setProgress(0);
      progressInterval.current = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 30));
      }, 200);
    } else if (status === "creating") {
      setProgress(30);
      progressInterval.current = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 70));
      }, 300);
    } else if (status === "adjusting") {
      setProgress(70);
      progressInterval.current = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 95));
      }, 150);
    } else if (status === "complete") {
      setProgress(100);
    } else if (status === "idle" || status === "error") {
      setProgress(0);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [status]);

  // Cleanup view360 interval on unmount
  useEffect(() => {
    return () => {
      if (view360ProgressInterval.current) {
        clearInterval(view360ProgressInterval.current);
      }
    };
  }, []);

  // Use centralized categories
  const categories = GARMENT_CATEGORIES;

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'rate_limit':
        return 'Servicio temporalmente ocupado. Intenta de nuevo en unos momentos.';
      case 'payment_required':
        return 'Servicio no disponible. Contacta al administrador.';
      case 'FunctionsHttpError':
      case 'FunctionsRelayError':
      case 'FunctionsFetchError':
        return isDev
          ? 'Edge Function "virtual-tryon" no está deployada en el proyecto dev. Usá el entorno de producción para probar el try-on.'
          : 'Error de conexión con el servicio. Intenta de nuevo.';
      default:
        return 'Error al procesar. Por favor, intenta de nuevo.';
    }
  };

  const uploadToStorage = async (
    compressed: CompressionResult,
    type: 'user' | 'garment'
  ): Promise<void> => {
    if (!user) return;
    
    // Store in user's folder for proper RLS
    const fileName = `${user.id}/${type}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, compressed.blob, { contentType: 'image/jpeg' });

    if (uploadError) {
      toast.warning('No se pudo guardar la imagen en el historial');
      return;
    }

    await supabase.from('uploaded_images').insert({
      storage_path: fileName,
      image_type: type,
      original_size_kb: compressed.originalSize,
      compressed_size_kb: compressed.compressedSize,
      user_id: user.id,
    });
  };

  const saveResultToHistory = async (
    userId: string,
    userEmail: string | undefined,
    userBlob: Blob,
    garmentBlob: Blob,
    resultBase64: string,
    category: string,
    uSize: string,
    gSize: string,
    fit: FitResult,
  ) => {
    const timestamp = Date.now();
    const resultBlob = base64ToBlob(resultBase64);

    const userPath = `${userId}/${timestamp}-user.jpg`;
    const garmentPath = `${userId}/${timestamp}-garment.jpg`;
    const resultPath = `${userId}/${timestamp}-result.jpg`;

    const [userUp, garmentUp, resultUp] = await Promise.all([
      supabase.storage.from('tryon-results').upload(userPath, userBlob, { contentType: 'image/jpeg' }),
      supabase.storage.from('tryon-results').upload(garmentPath, garmentBlob, { contentType: 'image/jpeg' }),
      supabase.storage.from('tryon-results').upload(resultPath, resultBlob, { contentType: 'image/jpeg' }),
    ]);

    if (userUp.error || garmentUp.error || resultUp.error) {
      throw new Error('Failed to upload images to storage');
    }

    const { error: insertError } = await supabase.from('tryon_history').insert({
      user_id: userId,
      user_email: userEmail || null,
      user_image_url: userPath,
      garment_image_url: garmentPath,
      generated_image_url: resultPath,
      category,
      user_size: uSize,
      garment_size: gSize,
      fit_result: fit.label,
    });

    if (insertError) {
      throw insertError;
    }
  };

  const handleProcess = async () => {
    if (!userImg || !clothImg || !selectedCategory || !userSize || !garmentSize) {
      toast.error("Falta información. Completa todos los campos.");
      return;
    }

    // Check free uses
    if (!hasFreeUses) {
      toast.error("Se agotaron tus usos gratuitos. Elegí un plan para seguir usando el probador.");
      return;
    }

    const currentFit = calculateFit(userSize, garmentSize, null, selectedCategory);
    setFitResult(currentFit);

    // Clear previous logs for new session
    setDebugLogs([]);

    try {
      setStatus("analyzing");
      setStatusMessage("Analizando...");

      // Upload images to storage (non-blocking)
      uploadToStorage(userImg.compressed, 'user');
      uploadToStorage(clothImg.compressed, 'garment');

      const userBase64 = userImg.preview.includes(',') ? userImg.preview.split(",")[1] : userImg.preview;
      const clothBase64 = clothImg.preview.includes(',') ? clothImg.preview.split(",")[1] : clothImg.preview;

      // Step 1: Analyze images
      const analyzeLogId = addDebugLog({
        type: "analyze",
        status: "pending",
        prompt: "Analizando imágenes...",
      });

      const analyzeStart = Date.now();
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'analyze',
          userImage: userBase64,
          clothImage: clothBase64,
          category: selectedCategory,
        },
      });

      if (analyzeError || analyzeData?.error) {
        updateDebugLog(analyzeLogId, {
          status: "error",
          duration: Date.now() - analyzeStart,
          error: analyzeError?.message || analyzeData?.error,
        });
        throw analyzeError || new Error(analyzeData?.error || 'analysis_failed');
      }

      const analysis = analyzeData.analysis;
      const analyzeDebug = analyzeData.debug;

      updateDebugLog(analyzeLogId, {
        status: "success",
        duration: analyzeDebug?.duration || (Date.now() - analyzeStart),
        prompt: analyzeDebug?.prompt || "Vision analysis prompt",
        response: analyzeDebug?.rawResponse || JSON.stringify(analysis, null, 2),
        metadata: {
          model: analyzeDebug?.model,
        },
      });

      setStatus("creating");
      setStatusMessage("Asignando prenda al modelo...");

      // Step 2: Generate image
      const generateLogId = addDebugLog({
        type: "generate",
        status: "pending",
        prompt: "Generando imagen...",
        metadata: {
          userSize,
          garmentSize,
          category: selectedCategory,
        },
      });

      const generateStart = Date.now();
      const { data: generateData, error: generateError } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'generate',
          userImage: userBase64,
          clothImage: clothBase64,
          category: selectedCategory,
          userSize,
          garmentSize,
          analysis,
        },
      });

      if (generateError || generateData?.error) {
        updateDebugLog(generateLogId, {
          status: "error",
          duration: Date.now() - generateStart,
          error: generateError?.message || generateData?.error,
        });
        throw new Error(generateData?.error || 'generation_failed');
      }

      const generateDebug = generateData.debug;

      updateDebugLog(generateLogId, {
        status: "success",
        duration: generateDebug?.duration || (Date.now() - generateStart),
        prompt: generateDebug?.prompt || "Image generation prompt",
        response: "Imagen generada exitosamente",
        metadata: {
          model: generateDebug?.model,
          userSize: generateDebug?.userSize,
          garmentSize: generateDebug?.garmentSize,
          fitDescription: generateDebug?.fitDescription,
          category: generateDebug?.category,
        },
      });

      setStatus("adjusting");
      setStatusMessage("Ajustando últimos detalles...");
      
      // Store analysis for 360 view
      analysisRef.current = analysis;
      
      // Simulate final adjustments delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGeneratedImage(generateData.image);
      setView360Image(null);
      setShowingView360(false);
      setView360Status("idle");
      setStatus("complete");
      toast.success("¡Imagen generada con éxito!");

      // Decrement free use counter
      decrementUse();

      // Save to history for authenticated users
      if (user && userImg?.compressed?.blob && clothImg?.compressed?.blob) {
        try {
          await saveResultToHistory(
            user.id,
            user.email,
            userImg.compressed.blob,
            clothImg.compressed.blob,
            generateData.image,
            selectedCategory,
            userSize,
            garmentSize,
            currentFit,
          );
          toast.success("Resultado guardado en tu historial");
        } catch (err) {
          toast.warning('No se pudo guardar en el historial');
        }
      }

    } catch (e: unknown) {
      setStatus("error");
      const errorCode = e instanceof Error ? (e.name || e.message) : 'unknown';
      const userMessage = getErrorMessage(errorCode);
      setStatusMessage(userMessage);
      toast.error(userMessage);
    }
  };

  const handleGenerate360 = async () => {
    if (!generatedImage || !selectedCategory) return;
    
    // Start progress simulation
    setView360Status("preparing");
    setView360Progress(0);
    
    // Clear any existing interval
    if (view360ProgressInterval.current) {
      clearInterval(view360ProgressInterval.current);
    }
    
    // Simulate progress over ~19 seconds
    let currentProgress = 0;
    view360ProgressInterval.current = setInterval(() => {
      currentProgress += 1;
      setView360Progress(Math.min(currentProgress, 95));
      
      // Update status based on progress
      if (currentProgress < 15) {
        setView360Status("preparing");
      } else if (currentProgress < 70) {
        setView360Status("generating");
      } else if (currentProgress < 95) {
        setView360Status("finalizing");
      }
    }, 200);
    
    const logId = addDebugLog({
      type: "generate",
      status: "pending",
      prompt: "Generando vista 360...",
      metadata: {
        category: selectedCategory,
      },
    });
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'generate360',
          generatedImage,
          category: selectedCategory,
          analysis: analysisRef.current,
        },
      });
      
      // Clear interval and complete progress
      if (view360ProgressInterval.current) {
        clearInterval(view360ProgressInterval.current);
      }
      
      if (error || data?.error) {
        updateDebugLog(logId, {
          status: "error",
          duration: Date.now() - startTime,
          error: error?.message || data?.error,
        });
        throw new Error(data?.error || 'generate360_failed');
      }
      
      updateDebugLog(logId, {
        status: "success",
        duration: data.debug?.duration || (Date.now() - startTime),
        prompt: data.debug?.prompt || "360 view generation prompt",
        response: "Vista 360 generada exitosamente",
        metadata: {
          model: data.debug?.model,
        },
      });
      
      setView360Progress(100);
      setView360Status("complete");
      
      // Brief delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setView360Image(data.image);
      setShowingView360(true);
      setView360Status("idle");
      setView360Progress(0);
      toast.success("¡Vista 360 generada!");
      
    } catch (e: unknown) {
      if (view360ProgressInterval.current) {
        clearInterval(view360ProgressInterval.current);
      }
      setView360Status("error");
      setView360Progress(0);
      toast.error("Error al generar la vista 360");
    }
  };


  return (
    <>
      <div className="bg-ambient" />
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 pb-24 md:pb-8 relative">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* LEFT: INPUTS */}
          <div className="space-y-8 fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tighter mb-2">
                Vestidor <span className="font-semibold text-primary">Online</span>
              </h1>
              <p className="text-muted-foreground font-light">Nueva experiencia para probar ropa.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <FileUpload
                id="uImg"
                label="Tu Foto"
                icon="user"
                onFileSelect={setUserImg}
                preview={userImg?.preview || null}
              />
              <FileUpload
                id="cImg"
                label="Prenda"
                icon="shirt"
                onFileSelect={setClothImg}
                preview={clothImg?.preview || null}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide md:tracking-widest mb-3 block">
                Selecciona Categoría
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      selectedCategory === cat.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-3 block">
                  Tu talle habitual
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SIZES.map((size) => (
                    <button
                      key={`user-${size}`}
                      onClick={() => setUserSize(size)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        userSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-3 block">
                  Talle de la prenda
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SIZES.map((size) => (
                    <button
                      key={`garment-${size}`}
                      onClick={() => setGarmentSize(size)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        garmentSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Free uses indicator */}
            {profile && (
              <div className={`text-center text-sm py-2 rounded-lg ${
                profile.free_uses_remaining > 0
                  ? 'text-muted-foreground'
                  : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
              }`}>
                {profile.free_uses_remaining > 0
                  ? `${profile.free_uses_remaining} uso${profile.free_uses_remaining !== 1 ? 's' : ''} gratuito${profile.free_uses_remaining !== 1 ? 's' : ''} restante${profile.free_uses_remaining !== 1 ? 's' : ''}`
                  : 'Sin usos gratuitos — elegí un plan para continuar'}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={status === "analyzing" || status === "creating" || status === "adjusting" || !hasFreeUses}
              className={`w-full py-4 rounded-2xl font-medium text-lg tracking-wide transition-all ${
                status === "analyzing" || status === "creating" || status === "adjusting" || !hasFreeUses
                  ? "bg-muted text-muted-foreground cursor-wait"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:shadow-[0_0_30px_rgba(129,140,248,0.5)]"
              }`}
            >
              {status === "idle" || status === "complete" || status === "error" ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Crear Realidad
                </span>
              ) : (
                <span className="animate-pulse">{statusMessage}</span>
              )}
            </button>

            {user && (
              <Button
                variant="ghost"
                onClick={() => setShowHistory(true)}
                className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="w-4 h-4 mr-2" />
                Ver resultados anteriores
              </Button>
            )}
          </div>

          {/* RIGHT: OUTPUT */}
          <div
            className="relative aspect-[3/4] rounded-3xl overflow-hidden fade-in-up flex items-center justify-center bg-black/80 border border-white/10"
            style={{ animationDelay: "0.2s" }}
          >
            {!generatedImage && status !== "analyzing" && status !== "creating" && (
              <div className="text-center">
                <Sparkles className="w-12 h-12 mb-4 mx-auto text-white/40" />
                <p className="font-light tracking-widest text-sm text-white/50">EL RESULTADO APARECERÁ AQUÍ</p>
              </div>
            )}

            {(status === "analyzing" || status === "creating" || status === "adjusting") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                <LoadingProgress
                  progress={progress}
                  status={status}
                />
              </div>
            )}

            {generatedImage && (
              <div className="relative w-full h-full group">
                <img
                  src={showingView360 && view360Image ? view360Image : generatedImage}
                  alt={showingView360 ? "Vista 360" : "Resultado"}
                  className="w-full h-full object-cover fade-in-up"
                />

                {/* 360 Loading Overlay */}
                {(view360Status === "preparing" || view360Status === "generating" || view360Status === "finalizing") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                    <LoadingProgress
                      progress={view360Progress}
                      status={view360Status}
                      mode="360"
                    />
                  </div>
                )}

                {/* 360 View Button - Top */}
                <div className="absolute top-4 left-4 z-20">
                  {!showingView360 ? (
                    <Button
                      onClick={handleGenerate360}
                      disabled={view360Status === "preparing" || view360Status === "generating" || view360Status === "finalizing"}
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white"
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Generar vista 360
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowingView360(false);
                        setView360Status("idle");
                        setView360Progress(0);
                      }}
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver a original
                    </Button>
                  )}
                </div>

                {fitResult && !showingView360 && (
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${
                    fitResult.fit === "ideal" ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                    fitResult.fit === "tight" || fitResult.fit === "loose" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                    "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}>
                    {garmentSize} → {fitResult.label}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] text-white/70 mb-3">
                    *Visualización aproximada. El calce real puede variar según el corte de la prenda, solo usted es responsable del uso de esta foto.
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {showingView360 ? "Vista 360" : "AI Virtual Try-On"}
                    </span>
                    <a
                      href={showingView360 && view360Image ? view360Image : generatedImage}
                      download={showingView360 ? "virtual-tryon-360.jpg" : "virtual-tryon-result.jpg"}
                      className="text-white hover:text-primary transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="absolute top-4 left-4 right-4 bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-xl text-sm text-center backdrop-blur-md">
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* Only show debug panel in development */}
        {isDev && (
          <PromptDebugPanel
            logs={debugLogs}
            isVisible={showDebugPanel}
            onToggle={() => setShowDebugPanel(!showDebugPanel)}
          />
        )}

        {/* History modal */}
        <TryOnHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      </div>
    </>
  );
};

export default Index;
