import { Check } from "lucide-react";
import LoaderGrid from "@/components/ui/loader-grid";

type TryOnStatus = "analyzing" | "creating" | "adjusting" | "complete";
type View360Status = "preparing" | "generating" | "finalizing" | "complete";

interface LoadingProgressProps {
  progress: number;
  status: TryOnStatus | View360Status;
  mode?: "tryon" | "360";
}

const stageConfigTryon = {
  analyzing: { message: "Analizando imágenes..." },
  creating: { message: "Asignando prenda al modelo..." },
  adjusting: { message: "Ajustando últimos detalles..." },
  complete: { message: "¡Completado!" },
};

const stageConfig360 = {
  preparing: { message: "Preparando perspectivas..." },
  generating: { message: "Generando vistas desde múltiples ángulos..." },
  finalizing: { message: "Finalizando vista 360..." },
  complete: { message: "¡Vista 360 completada!" },
};

export const LoadingProgress = ({ progress, status, mode = "tryon" }: LoadingProgressProps) => {
  const config = mode === "360" ? stageConfig360 : stageConfigTryon;
  const { message } = config[status as keyof typeof config] || { message: "Procesando..." };
  const isComplete = status === "complete";

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Grid Loader Animation */}
      {!isComplete && <LoaderGrid />}
      
      {/* Complete Check Icon */}
      {isComplete && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
          <Check className="w-8 h-8 text-green-500" />
        </div>
      )}

      {/* Progress percentage */}
      <div className="text-center space-y-2">
        <span className="text-2xl font-mono font-bold text-white">{Math.round(progress)}%</span>
        
        {/* Animated Status Text */}
        <div
          key={status}
          className="animate-fade-in"
        >
          <span className={`text-sm font-medium ${
            isComplete ? "text-green-400" : "text-white/70"
          }`}>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
