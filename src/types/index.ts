import { CompressionResult } from "@/lib/imageCompression";

// File data for uploaded images
export interface FileData {
  file: File;
  preview: string;
  compressed: CompressionResult;
}

// Try-on process status
export type TryOnStatus = "idle" | "analyzing" | "creating" | "adjusting" | "complete" | "error";

// 360 view generation status  
export type View360Status = "idle" | "preparing" | "generating" | "finalizing" | "complete" | "error";

// Re-export fit types from calculateFit
export type { FitResult, SizeGuide, SizeDefinition } from "@/lib/calculateFit";
