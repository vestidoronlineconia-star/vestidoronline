import { User, Shirt, Plus } from "lucide-react";
import { compressImage, CompressionResult } from "@/lib/imageCompression";

interface FileUploadProps {
  label: string;
  onFileSelect: (data: { file: File; preview: string; compressed: CompressionResult }) => void;
  preview: string | null;
  id: string;
  icon: "user" | "shirt";
  primaryColor?: string;
  textColor?: string;
}

export const FileUpload = ({ label, onFileSelect, preview, id, icon, primaryColor, textColor }: FileUploadProps) => {
  const processFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      onFileSelect({ file, preview: compressed.preview, compressed });
    } catch (error) {
      console.error("Error compressing image:", error);
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

  const IconComponent = icon === "user" ? User : Shirt;

  return (
    <div
      className={`upload-zone relative w-full aspect-[4/5] md:aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer group overflow-hidden ${
        preview ? "border-none" : ""
      }`}
      onClick={() => document.getElementById(id)?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {preview ? (
        <>
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
        <div className="text-center p-6 transition-all group-hover:scale-105">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <IconComponent className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 animate-pulse shadow-lg">
              <Plus className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>
          <span className="block text-sm text-foreground font-medium mb-1">
            {label}
          </span>
          <span className="text-xs text-muted-foreground">
            Clic o arrastra aquí
          </span>
        </div>
      )}
      <input
        type="file"
        id={id}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
    </div>
  );
};
