import { useState } from "react";
import { User, Shirt, Camera, ImagePlus, X } from "lucide-react";
import { compressImage, CompressionResult } from "@/lib/imageCompression";
import { CameraCapture } from "./CameraCapture";

interface FileUploadProps {
  label: string;
  onFileSelect: (data: { file: File; preview: string; compressed: CompressionResult } | null) => void;
  preview: string | null;
  id: string;
  icon: "user" | "shirt";
  primaryColor?: string;
  textColor?: string;
}

// Device detection
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const FileUpload = ({ label, onFileSelect, preview, id, icon, primaryColor, textColor }: FileUploadProps) => {
  const [showCameraModal, setShowCameraModal] = useState(false);

  const processFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      onFileSelect({ file, preview: compressed.preview, compressed });
    } catch (error) {
      // Fallback to original if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        onFileSelect({ 
          file, 
          preview,
          compressed: {
            blob: file,
            preview,
            originalSize: Math.round(file.size / 1024),
            compressedSize: Math.round(file.size / 1024),
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile()) {
      // On mobile, use native camera input
      document.getElementById(`${id}-camera`)?.click();
    } else {
      // On desktop, open webcam modal
      setShowCameraModal(true);
    }
  };

  const IconComponent = icon === "user" ? User : Shirt;

  return (
    <>
      <div
        className={`upload-zone relative w-full aspect-[4/5] md:aspect-square rounded-2xl flex flex-col items-center justify-center group overflow-hidden ${
          preview ? "border-none cursor-pointer" : ""
        }`}
        onClick={() => preview && document.getElementById(id)?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            {/* Remove image button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
              }}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              aria-label="Quitar imagen"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
              <span className="text-xs font-medium text-white/90 uppercase tracking-widest">
                Cambiar
              </span>
            </div>
          </>
        ) : (
          <div className="text-center p-3 md:p-6 transition-all">
            <div className="relative inline-block mb-2 md:mb-4">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <IconComponent className="w-5 h-5 md:w-8 md:h-8 text-muted-foreground" />
              </div>
            </div>
            <span className="block text-xs md:text-sm text-foreground font-medium mb-1">
              {label}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4 block">
              Arrastra o usa los botones
            </span>
            
            {/* Camera and Gallery buttons */}
            <div className="flex gap-2 mt-2 md:mt-3">
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 md:px-3 md:py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Camera className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-medium text-primary">Cámara</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById(id)?.click();
                }}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 md:px-3 md:py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <ImagePlus className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Galería</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Hidden input for gallery */}
        <input
          type="file"
          id={id}
          className="hidden"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        
        {/* Hidden input for camera (front-facing) - mobile only */}
        <input
          type="file"
          id={`${id}-camera`}
          className="hidden"
          accept="image/*"
          capture="user"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
      </div>

      {/* Camera modal for desktop */}
      <CameraCapture
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={onFileSelect}
      />
    </>
  );
};
