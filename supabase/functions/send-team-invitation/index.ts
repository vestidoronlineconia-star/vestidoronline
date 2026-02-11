import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TeamInvitationRequest {
  email: string;
  role: string;
  client_name?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visor",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, role, client_name }: TeamInvitationRequest = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending team invitation email to:", email);

    const portalUrl = "https://vestidoronline.lovable.app/client";
    const roleLabel = ROLE_LABELS[role] || role;

    const emailResponse = await resend.emails.send({
      from: "Vestidor Online <noreply@santiagociraudo.tech>",
      to: [email],
      subject: "¡Felicidades! Tu acceso a Vestidor Online está listo",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">Vestidor Online</h1>
              </div>
              
              <!-- Main Content -->
              <h2 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
                ¡Felicidades! 🎉
              </h2>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Estuvimos analizando tu web y creemos que es posible una integración con nuestra 
                <strong>tecnología innovadora</strong> para probar ropa de manera virtual.
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Entrá al link para acceder a nuestro portal de cliente:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${portalUrl}" style="display: inline-block; background-color: #8B5CF6; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Acceder al Portal de Cliente
                </a>
              </div>
              
              <!-- Role Info -->
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #71717a; font-size: 14px;">Tu rol asignado:</p>
                <p style="margin: 8px 0 0 0; color: #18181b; font-size: 16px; font-weight: 600;">${roleLabel}</p>
              </div>
              
              <p style="margin: 0; color: #71717a; font-size: 14px;">
                O copia este enlace: <a href="${portalUrl}" style="color: #8B5CF6;">${portalUrl}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
              Vestidor Online - Tecnología de Prueba Virtual
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Team invitation email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-team-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
