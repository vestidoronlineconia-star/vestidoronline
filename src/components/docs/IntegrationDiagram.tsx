export const IntegrationDiagram = () => {
  return (
    <div className="p-6 rounded-lg border border-border bg-muted/30">
      <h4 className="text-sm font-medium mb-4 text-center text-muted-foreground">Flujo de Integración</h4>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
        <div className="flex flex-col items-center p-4 rounded-lg bg-background border border-border min-w-[120px]">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <span className="text-primary font-bold">1</span>
          </div>
          <span className="font-medium">Tienda Nube</span>
          <span className="text-xs text-muted-foreground">Tu sitio web</span>
        </div>
        
        <div className="text-muted-foreground">→</div>
        
        <div className="flex flex-col items-center p-4 rounded-lg bg-background border border-border min-w-[120px]">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <span className="text-primary font-bold">2</span>
          </div>
          <span className="font-medium">iframe</span>
          <span className="text-xs text-muted-foreground">Widget embebido</span>
        </div>
        
        <div className="text-muted-foreground">→</div>
        
        <div className="flex flex-col items-center p-4 rounded-lg bg-background border border-border min-w-[120px]">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <span className="text-primary font-bold">3</span>
          </div>
          <span className="font-medium">API IA</span>
          <span className="text-xs text-muted-foreground">Procesamiento</span>
        </div>
        
        <div className="text-muted-foreground">→</div>
        
        <div className="flex flex-col items-center p-4 rounded-lg bg-background border border-border min-w-[120px]">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
            <span className="text-green-500 font-bold">✓</span>
          </div>
          <span className="font-medium">Resultado</span>
          <span className="text-xs text-muted-foreground">Imagen generada</span>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border">
          <span>Comunicación vía</span>
          <code className="bg-muted px-1.5 py-0.5 rounded">postMessage</code>
        </div>
      </div>
    </div>
  );
};
