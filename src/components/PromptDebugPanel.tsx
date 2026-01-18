import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, Bug, X } from "lucide-react";

export interface DebugLog {
  id: string;
  type: "analyze" | "generate" | "tips";
  timestamp: Date;
  duration?: number;
  status: "pending" | "success" | "error";
  prompt: string;
  response?: string;
  metadata?: {
    model?: string;
    userSize?: string;
    garmentSize?: string;
    category?: string;
    fitDescription?: string;
  };
  error?: string;
}

interface PromptDebugPanelProps {
  logs: DebugLog[];
  isVisible: boolean;
  onToggle: () => void;
}

const LogEntry = ({ log }: { log: DebugLog }) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const copyToClipboard = async (text: string, type: "prompt" | "response") => {
    await navigator.clipboard.writeText(text);
    if (type === "prompt") {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const getStatusColor = () => {
    switch (log.status) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      default: return "text-yellow-400 animate-pulse";
    }
  };

  const getTypeLabel = () => {
    switch (log.type) {
      case "analyze": return "Análisis";
      case "generate": return "Generación";
      case "tips": return "Tips";
    }
  };

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-black/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-500" : log.status === "error" ? "bg-red-500" : "bg-yellow-500 animate-pulse"}`} />
          <span className="text-xs font-medium">{getTypeLabel()}</span>
          {log.duration && (
            <span className="text-[10px] text-muted-foreground">({(log.duration / 1000).toFixed(1)}s)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${getStatusColor()}`}>
            {log.status === "pending" ? "Procesando..." : log.status === "success" ? "✓" : "✗"}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 py-2 border-t border-border/30 space-y-3 text-xs">
          {log.metadata && (
            <div className="flex flex-wrap gap-2">
              {log.metadata.model && (
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px]">
                  {log.metadata.model}
                </span>
              )}
              {log.metadata.userSize && (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                  User: {log.metadata.userSize}
                </span>
              )}
              {log.metadata.garmentSize && (
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                  Prenda: {log.metadata.garmentSize}
                </span>
              )}
              {log.metadata.fitDescription && (
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px]">
                  {log.metadata.fitDescription}
                </span>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Prompt</span>
              <button
                onClick={() => copyToClipboard(log.prompt, "prompt")}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Copiar prompt"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <pre className="bg-black/30 p-2 rounded text-[10px] whitespace-pre-wrap break-words max-h-40 overflow-y-auto scrollbar-thin">
              {log.prompt}
            </pre>
          </div>

          {log.response && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Response</span>
                <button
                  onClick={() => copyToClipboard(log.response!, "response")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copiar respuesta"
                >
                  {copiedResponse ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <pre className="bg-black/30 p-2 rounded text-[10px] whitespace-pre-wrap break-words max-h-40 overflow-y-auto scrollbar-thin">
                {log.response}
              </pre>
            </div>
          )}

          {log.error && (
            <div className="bg-red-500/10 border border-red-500/30 p-2 rounded text-red-300 text-[10px]">
              Error: {log.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PromptDebugPanel = ({ logs, isVisible, onToggle }: PromptDebugPanelProps) => {
  const [minimized, setMinimized] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all z-50"
        title="Mostrar Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 transition-all ${minimized ? "h-12" : "max-h-[60vh]"}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Debug Panel</span>
          <span className="text-[10px] text-muted-foreground">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="p-3 space-y-2 max-h-[calc(60vh-3rem)] overflow-y-auto scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              No hay logs aún. Procesa una imagen para ver los prompts.
            </div>
          ) : (
            logs.map((log) => <LogEntry key={log.id} log={log} />)
          )}
        </div>
      )}
    </div>
  );
};
