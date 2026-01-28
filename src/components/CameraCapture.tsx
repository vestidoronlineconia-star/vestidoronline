import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressImage, CompressionResult } from "@/lib/imageCompression";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (data: { file: File; preview: string; compressed: CompressionResult }) => void;
}

export const CameraCapture = ({ open, onOpenChange, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsLoading(false);
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Permiso denegado. Por favor, permite el acceso a la cámara en tu navegador.");
        } else if (err.name === "NotFoundError") {
          setError("No se encontró ninguna cámara en este dispositivo.");
        } else {
          setError("No se pudo acceder a la cámara. Intenta de nuevo.");
        }
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { 
        type: "image/jpeg" 
      });

      try {
        const compressed = await compressImage(file);
        onCapture({ file, preview: compressed.preview, compressed });
        onOpenChange(false);
      } catch (err) {
        console.error("Error compressing image:", err);
        const preview = canvas.toDataURL("image/jpeg", 0.8);
        onCapture({ 
          file, 
          preview,
          compressed: {
            blob,
            preview,
            originalSize: Math.round(blob.size / 1024),
            compressedSize: Math.round(blob.size / 1024),
          }
        });
        onOpenChange(false);
      }
    }, "image/jpeg", 0.9);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Tomar foto
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-[4/3] bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Iniciando cámara...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={startCamera}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            style={{ display: isLoading || error ? "none" : "block" }}
          />
        </div>
        
        <div className="p-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCamera}
            disabled={isLoading || !!error}
            title="Cambiar cámara"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={isLoading || !!error}
            className="px-8"
          >
            <Camera className="w-5 h-5 mr-2" />
            Capturar
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
