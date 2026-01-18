import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/FileUpload";
import { LoadingProgress } from "@/components/LoadingProgress";
import { Sparkles, Download, RotateCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CompressionResult } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";
import { EmbedClientConfig } from "@/hooks/useEmbedClient";
import { 
  calculateFit, 
  getAvailableSizes, 
  getFitBadgeColor,
  SizeGuide,
  SizeDefinition,
  FitResult
} from "@/lib/calculateFit";
import { GARMENT_CATEGORIES } from "@/lib/categories";
import { FileData, TryOnStatus, View360Status } from "@/types";

// Remove local type definitions - use centralized ones from @/types

interface EmbedTryOnProps {
  config: EmbedClientConfig;
  initialGarmentUrl?: string;
  onTryOnComplete?: (imageUrl: string) => void;
  onView360Complete?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  trackUsage: (action: string, category?: string) => Promise<void>;
}

export const EmbedTryOn = ({ 
  config, 
  initialGarmentUrl, 
  onTryOnComplete,
  onView360Complete,
  onError,
  trackUsage 
}: EmbedTryOnProps) => {
  const [userImg, setUserImg] = useState<FileData | null>(null);
  const [clothImg, setClothImg] = useState<FileData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userSize, setUserSize] = useState<string | null>(null);
  const [garmentSize, setGarmentSize] = useState<string | null>(null);
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);

  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [view360Image, setView360Image] = useState<string | null>(null);
  const [view360Status, setView360Status] = useState<View360Status>("idle");
  const [view360Progress, setView360Progress] = useState(0);
  const view360ProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const [showingView360, setShowingView360] = useState(false);
  const analysisRef = useRef<any>(null);

  // Load initial garment from URL and fetch size guides
  useEffect(() => {
    if (initialGarmentUrl) {
      loadGarmentFromUrl(initialGarmentUrl);
    }
    // Fetch size guides for this client
    fetchSizeGuides();
  }, [initialGarmentUrl, config.id]);

  const fetchSizeGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('size_guides')
        .select('*')
        .eq('client_id', config.id);
      
      if (error) throw error;
      
      const parsed: SizeGuide[] = (data || []).map((row: any) => ({
        id: row.id,
        client_id: row.client_id,
        category: row.category,
        size_system: row.size_system as 'letter' | 'numeric' | 'cm',
        sizes: row.sizes as SizeDefinition[],
      }));
      
      setSizeGuides(parsed);
    } catch (e) {
      console.error('Error fetching size guides:', e);
    }
  };

  // Listen for postMessage from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SET_GARMENT' && event.data.garmentUrl) {
        loadGarmentFromUrl(event.data.garmentUrl);
      }
      if (event.data?.type === 'SET_CATEGORY' && event.data.category) {
        setSelectedCategory(event.data.category);
      }
      if (event.data?.type === 'SET_SIZES') {
        if (event.data.userSize) setUserSize(event.data.userSize);
        if (event.data.garmentSize) setGarmentSize(event.data.garmentSize);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that embed is ready
    window.parent.postMessage({ type: 'READY' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadGarmentFromUrl = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'garment.jpg', { type: blob.type });
      const preview = URL.createObjectURL(blob);
      
      setClothImg({
        file,
        preview,
        compressed: {
          blob,
          preview,
          originalSize: blob.size / 1024,
          compressedSize: blob.size / 1024,
        },
      });
    } catch (e) {
      console.error('Failed to load garment from URL:', e);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Progress simulation
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

  // Use centralized categories, filtered by client config
  const categories = GARMENT_CATEGORIES.filter(cat => 
    config.enabled_categories.includes(cat.id)
  );

  const getErrorMessage = (errorCode: string): string => {
    // Use custom error message from config if available
    if (config.error_message) {
      return config.error_message;
    }
    switch (errorCode) {
      case 'rate_limit':
        return 'Servicio temporalmente ocupado. Intenta de nuevo en unos momentos.';
      case 'payment_required':
        return 'Servicio no disponible. Contacta al administrador.';
      default:
        return 'Error al procesar. Por favor, intenta de nuevo.';
    }
  };

  const handleProcess = async () => {
    if (!userImg || !clothImg || !selectedCategory) {
      toast.error("Falta información. Completa todos los campos.");
      return;
    }

    if (config.show_size_selector && (!userSize || !garmentSize)) {
      toast.error("Selecciona los talles.");
      return;
    }

    if (config.show_size_selector && userSize && garmentSize && selectedCategory) {
      const sizeGuide = sizeGuides.find(g => g.category === selectedCategory) || null;
      const currentFit = calculateFit(userSize, garmentSize, sizeGuide, selectedCategory);
      setFitResult(currentFit);
    }

    try {
      setStatus("analyzing");
      setStatusMessage("Analizando...");
      window.parent.postMessage({ type: 'TRYON_START' }, '*');

      const userBase64 = userImg.preview.split(",")[1];
      const clothBase64 = clothImg.preview.split(",")[1];

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
        throw new Error(analyzeData?.error || 'analysis_failed');
      }

      const analysis = analyzeData.analysis;

      setStatus("creating");
      setStatusMessage("Asignando prenda al modelo...");

      const { data: generateData, error: generateError } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'generate',
          userImage: userBase64,
          clothImage: clothBase64,
          category: selectedCategory,
          userSize: userSize || 'M',
          garmentSize: garmentSize || 'M',
          analysis,
        },
      });

      if (generateError || generateData?.error) {
        throw new Error(generateData?.error || 'generation_failed');
      }

      setStatus("adjusting");
      setStatusMessage("Ajustando últimos detalles...");
      
      analysisRef.current = analysis;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGeneratedImage(generateData.image);
      setView360Image(null);
      setShowingView360(false);
      setView360Status("idle");
      setStatus("complete");
      
      // Track usage with category
      await trackUsage('tryon', selectedCategory);
      
      // Notify parent
      window.parent.postMessage({ 
        type: 'TRYON_COMPLETE', 
        imageUrl: generateData.image 
      }, '*');
      
      onTryOnComplete?.(generateData.image);
      toast.success("¡Imagen generada con éxito!");

    } catch (e: unknown) {
      setStatus("error");
      const errorCode = e instanceof Error ? e.message : 'unknown';
      const userMessage = getErrorMessage(errorCode);
      setStatusMessage(userMessage);
      
      window.parent.postMessage({ 
        type: 'TRYON_ERROR', 
        error: userMessage 
      }, '*');
      
      onError?.(userMessage);
      toast.error(userMessage);
    }
  };

  const handleGenerate360 = async () => {
    if (!generatedImage || !selectedCategory) return;
    
    setView360Status("preparing");
    setView360Progress(0);
    
    if (view360ProgressInterval.current) {
      clearInterval(view360ProgressInterval.current);
    }
    
    let currentProgress = 0;
    view360ProgressInterval.current = setInterval(() => {
      currentProgress += 1;
      setView360Progress(Math.min(currentProgress, 95));
      
      if (currentProgress < 15) {
        setView360Status("preparing");
      } else if (currentProgress < 70) {
        setView360Status("generating");
      } else if (currentProgress < 95) {
        setView360Status("finalizing");
      }
    }, 200);
    
    try {
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          action: 'generate360',
          generatedImage,
          category: selectedCategory,
          analysis: analysisRef.current,
        },
      });
      
      if (view360ProgressInterval.current) {
        clearInterval(view360ProgressInterval.current);
      }
      
      if (error || data?.error) {
        throw new Error(data?.error || 'generate360_failed');
      }
      
      setView360Progress(100);
      setView360Status("complete");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setView360Image(data.image);
      setShowingView360(true);
      setView360Status("idle");
      setView360Progress(0);
      
      // Track usage with category
      await trackUsage('view360', selectedCategory || undefined);
      
      // Notify parent
      window.parent.postMessage({ 
        type: 'VIEW360_COMPLETE', 
        imageUrl: data.image 
      }, '*');
      
      onView360Complete?.(data.image);
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

  // Dynamic styles based on config
  const primaryColor = config.primary_color;
  const bgColor = config.background_color;
  const textColor = config.text_color;
  
  // Determine effective theme
  const getEffectiveTheme = () => {
    if (config.theme_mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return config.theme_mode;
  };
  const effectiveTheme = getEffectiveTheme();
  const effectiveBgColor = effectiveTheme === 'light' ? '#FFFFFF' : bgColor;
  const effectiveTextColor = effectiveTheme === 'light' ? '#1a1a1a' : textColor;
  
  // Button style classes
  const getButtonRadius = () => {
    switch (config.button_style) {
      case 'square': return 'rounded-none';
      case 'pill': return 'rounded-full';
      default: return 'rounded-xl';
    }
  };
  
  // Animation classes
  const getAnimationClass = () => {
    switch (config.entry_animation) {
      case 'slide': return 'animate-slide-in';
      case 'none': return '';
      default: return 'fade-in-up';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: effectiveBgColor, color: effectiveTextColor }}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* LEFT: INPUTS */}
        <div className={`space-y-8 ${getAnimationClass()}`} style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start justify-between">
            <div>
              {config.logo_url ? (
                <img 
                  src={config.logo_url} 
                  alt={config.custom_title} 
                  className="h-12 object-contain mb-2"
                />
              ) : (
                <h1 className="text-4xl md:text-5xl font-light tracking-tighter mb-2">
                  {config.custom_title}
                </h1>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FileUpload
              id="uImg"
              label={config.placeholder_photo || "Tu Foto"}
              icon="user"
              onFileSelect={setUserImg}
              preview={userImg?.preview || null}
              primaryColor={primaryColor}
              textColor={effectiveTextColor}
            />
            <FileUpload
              id="cImg"
              label={config.placeholder_garment || "Prenda"}
              icon="shirt"
              onFileSelect={setClothImg}
              preview={clothImg?.preview || null}
              primaryColor={primaryColor}
              textColor={effectiveTextColor}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest mb-3 block opacity-70">
              Selecciona Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-4 py-2 rounded-full text-sm border transition-all"
                  style={{
                    backgroundColor: selectedCategory === cat.id ? primaryColor : 'transparent',
                    borderColor: selectedCategory === cat.id ? primaryColor : 'rgba(255,255,255,0.2)',
                    color: selectedCategory === cat.id ? '#fff' : textColor,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {config.show_size_selector && selectedCategory && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest mb-3 block opacity-70">
                  Tu talle habitual
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAvailableSizes(sizeGuides.find(g => g.category === selectedCategory) || null).map((size) => (
                    <button
                      key={`user-${size}`}
                      onClick={() => setUserSize(size)}
                      className="px-3 py-1.5 rounded-full text-xs border transition-all"
                      style={{
                        backgroundColor: userSize === size ? primaryColor : 'transparent',
                        borderColor: userSize === size ? primaryColor : 'rgba(255,255,255,0.2)',
                        color: userSize === size ? '#fff' : textColor,
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest mb-3 block opacity-70">
                  Talle de la prenda
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAvailableSizes(sizeGuides.find(g => g.category === selectedCategory) || null).map((size) => (
                    <button
                      key={`garment-${size}`}
                      onClick={() => setGarmentSize(size)}
                      className="px-3 py-1.5 rounded-full text-xs border transition-all"
                      style={{
                        backgroundColor: garmentSize === size ? primaryColor : 'transparent',
                        borderColor: garmentSize === size ? primaryColor : 'rgba(255,255,255,0.2)',
                        color: garmentSize === size ? '#fff' : textColor,
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleProcess}
            disabled={status !== "idle" && status !== "complete" && status !== "error"}
            className={`w-full text-lg py-6 font-medium transition-all ${getButtonRadius()}`}
            style={{ 
              backgroundColor: primaryColor,
              opacity: (status !== "idle" && status !== "complete" && status !== "error") ? 0.5 : 1
            }}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {config.cta_text}
          </Button>

          {status !== "idle" && status !== "complete" && status !== "error" && (
            <LoadingProgress progress={progress} status={status} />
          )}
        </div>

        {/* RIGHT: OUTPUT */}
        <div className={`${getAnimationClass()} relative`} style={{ animationDelay: "0.3s" }}>
          <div 
            className="aspect-[3/4] rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            {generatedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={showingView360 && view360Image ? view360Image : generatedImage}
                  alt="Generated result"
                  className="w-full h-full object-cover"
                />
                
                {/* Fit Result Badge */}
                {config.show_fit_result && fitResult && !showingView360 && (
                  <div 
                    className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                    style={{ 
                      backgroundColor: getFitBadgeColor(fitResult.fit),
                      color: '#fff'
                    }}
                  >
                    {fitResult.label}
                    {fitResult.difference_cm !== undefined && (
                      <span className="ml-1 opacity-80 text-xs">
                        ({fitResult.difference_cm > 0 ? '+' : ''}{fitResult.difference_cm}cm)
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  {showingView360 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowingView360(false)}
                      className="flex-1 backdrop-blur-sm bg-black/30 border-white/20 text-white hover:bg-black/50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Volver
                    </Button>
                  )}
                  
                  {!showingView360 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate360}
                      disabled={view360Status !== "idle"}
                      className="flex-1 backdrop-blur-sm bg-black/30 border-white/20 text-white hover:bg-black/50"
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      {view360Status !== "idle" && view360Status !== "complete" ? "Generando..." : "Vista 360"}
                    </Button>
                  )}
                  
                  <a
                    href={showingView360 && view360Image ? view360Image : generatedImage}
                    download={`tryon-${Date.now()}.png`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full backdrop-blur-sm bg-black/30 border-white/20 text-white hover:bg-black/50"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Descargar
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p className="text-sm text-white/60">
                  Tu resultado aparecerá aquí
                </p>
              </div>
            )}
          </div>

          {/* 360 Progress */}
          {view360Status !== "idle" && view360Status !== "complete" && view360Status !== "error" && (
            <div className="mt-4">
              <LoadingProgress progress={view360Progress} status={view360Status} mode="360" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
