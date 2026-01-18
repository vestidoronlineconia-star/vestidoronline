import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  company_name: string | null;
  website_url: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface SubmitRequestData {
  company_name: string;
  website_url?: string;
  message?: string;
}

export function useAccessRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequest();
    } else {
      setRequest(null);
      setLoading(false);
    }
  }, [user]);

  const fetchRequest = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setRequest(data as AccessRequest | null);
    } catch (error: any) {
      console.error('Error fetching access request:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (data: SubmitRequestData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para solicitar acceso",
        variant: "destructive",
      });
      return false;
    }

    try {
      setSubmitting(true);

      const { data: response, error } = await supabase.functions.invoke('send-access-request', {
        body: data,
      });

      if (error) throw error;

      if (response?.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud ha sido enviada. Te notificaremos cuando sea revisada.",
      });

      await fetchRequest();
      return true;
    } catch (error: any) {
      console.error('Error submitting access request:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    request,
    loading,
    submitting,
    submitRequest,
    refetch: fetchRequest,
  };
}

// Admin hook for managing all requests
export function useAdminAccessRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [existingClients, setExistingClients] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRequests();
    fetchExistingClients();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as AccessRequest[]) || []);
    } catch (error: any) {
      console.error('Error fetching access requests:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingClients = async () => {
    try {
      const { data, error } = await supabase
        .from('embed_clients')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) throw error;
      setExistingClients(data || []);
    } catch (error: any) {
      console.error('Error fetching existing clients:', error);
    }
  };

  const approveRequest = async (
    requestId: string, 
    clientData: { name: string; slug: string; allowed_domains: string[] }
  ) => {
    try {
      // Get the request first
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error("Solicitud no encontrada");

      // Create embed client for the user
      const { data: client, error: clientError } = await supabase
        .from('embed_clients')
        .insert({
          user_id: request.user_id,
          name: clientData.name,
          slug: clientData.slug,
          allowed_domains: clientData.allowed_domains,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Assign client role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'client',
        });

      // Ignore if role already exists
      if (roleError && !roleError.message.includes('duplicate')) {
        console.warn('Role assignment warning:', roleError);
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: "Solicitud aprobada",
        description: `Se ha creado el cliente "${clientData.name}" para ${request.email}`,
      });

      await fetchAllRequests();
      await fetchExistingClients();
      return client;
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
      return null;
    }
  };

  const approveRequestWithExistingClient = async (
    requestId: string,
    clientId: string,
    role: 'owner' | 'admin' | 'editor' | 'viewer'
  ) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error("Solicitud no encontrada");

      const client = existingClients.find(c => c.id === clientId);
      if (!client) throw new Error("Cliente no encontrado");

      // Add user as team member with the specified role
      const { error: teamError } = await supabase
        .from('client_team_members')
        .insert({
          client_id: clientId,
          user_id: request.user_id,
          email: request.email,
          role: role,
          accepted_at: new Date().toISOString(), // Auto-accepted since admin is approving
        });

      if (teamError) {
        if (teamError.message.includes('duplicate')) {
          throw new Error("Este usuario ya es miembro de este cliente");
        }
        throw teamError;
      }

      // Assign 'client' role to user if they don't have it
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'client',
        });

      // Ignore if role already exists
      if (roleError && !roleError.message.includes('duplicate')) {
        console.warn('Role assignment warning:', roleError);
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: "Solicitud aprobada",
        description: `${request.email} se ha vinculado a "${client.name}" como ${role}`,
      });

      await fetchAllRequests();
      return true;
    } catch (error: any) {
      console.error('Error linking to existing client:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo vincular al cliente",
        variant: "destructive",
      });
      return false;
    }
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      });

      await fetchAllRequests();
      return true;
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    requests,
    existingClients,
    loading,
    approveRequest,
    approveRequestWithExistingClient,
    rejectRequest,
    refetch: fetchAllRequests,
  };
}
