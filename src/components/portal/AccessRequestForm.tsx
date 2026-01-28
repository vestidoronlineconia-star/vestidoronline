import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAccessRequest } from '@/hooks/useAccessRequest';
import { Loader2, Send, Clock, XCircle, CheckCircle } from 'lucide-react';

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
};

export function AccessRequestForm() {
  const { request, loading, submitting, submitRequest } = useAccessRequest();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) return;

    const success = await submitRequest({
      company_name: formData.company_name.trim(),
      website_url: normalizeUrl(formData.website_url) || undefined,
      message: formData.message.trim() || undefined,
    });

    if (success) {
      setOpen(false);
      setFormData({ company_name: '', website_url: '', message: '' });
    }
  };

  if (loading) {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando...
      </Button>
    );
  }

  // Show status if request exists
  if (request) {
    if (request.status === 'pending') {
      return (
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-8 h-8 text-amber-500" />
          <div className="text-center">
            <p className="font-semibold text-amber-500">Solicitud Pendiente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu solicitud está siendo revisada. Te notificaremos pronto.
            </p>
          </div>
        </div>
      );
    }

    if (request.status === 'rejected') {
      return (
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-destructive/10 border border-destructive/20">
          <XCircle className="w-8 h-8 text-destructive" />
          <div className="text-center">
            <p className="font-semibold text-destructive">Solicitud Rechazada</p>
            {request.rejection_reason && (
              <p className="text-sm text-muted-foreground mt-1">
                Motivo: {request.rejection_reason}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Contacta con soporte si crees que esto es un error.
            </p>
          </div>
        </div>
      );
    }

    if (request.status === 'approved') {
      return (
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div className="text-center">
            <p className="font-semibold text-green-500">Solicitud Aprobada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu acceso ha sido aprobado. Recarga la página para acceder.
            </p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Recargar página
          </Button>
        </div>
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Send className="w-4 h-4" />
          Solicitar Acceso al Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Acceso</DialogTitle>
          <DialogDescription>
            Completa el formulario para solicitar acceso al portal de clientes.
            Recibirás una notificación cuando tu solicitud sea revisada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre de la Empresa *</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Mi Tienda Online"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">Sitio Web</Label>
            <Input
              id="website_url"
              type="text"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="mitienda.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="¿Por qué quieres usar el probador virtual?"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !formData.company_name.trim()} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
