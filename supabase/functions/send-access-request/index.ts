import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const apiKey = Deno.env.get("RESEND_API_KEY");
console.log("RESEND_API_KEY configured:", !!apiKey);

const resend = new Resend(apiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccessRequestData {
  company_name: string;
  website_url?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { company_name, website_url, message }: AccessRequestData = await req.json();

    console.log("Creating access request for user:", user.email);

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("access_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: "Ya tienes una solicitud pendiente", status: existingRequest.status }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the access request
    const { data: request, error: insertError } = await supabase
      .from("access_requests")
      .insert({
        user_id: user.id,
        email: user.email,
        company_name,
        website_url,
        message,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Error al crear la solicitud" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Access request created:", request.id);

    // Build the review URL
    const appUrl = Deno.env.get("APP_URL") || "https://vestidoronline.lovable.app";
    const reviewUrl = `${appUrl}/admin/requests?id=${request.id}`;

    // Send email notification - don't fail the request if email fails
    let emailSent = false;
    try {
      if (!apiKey) {
        console.error("Cannot send email: RESEND_API_KEY is not configured");
      } else {
        const emailResponse = await resend.emails.send({
          from: "Vestidor Online <noreply@vestidor.online>",
          to: ["vestidoronlineconia@gmail.com"],
          subject: `Nueva Solicitud de Acceso: ${company_name || user.email}`,
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
                  <h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0;">Nueva Solicitud de Acceso</h1>
                  
                  <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Solicitante</p>
                    <p style="margin: 0 0 16px 0; color: #18181b; font-size: 16px; font-weight: 600;">${user.email}</p>
                    
                    ${company_name ? `
                    <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Empresa</p>
                    <p style="margin: 0 0 16px 0; color: #18181b; font-size: 16px; font-weight: 600;">${company_name}</p>
                    ` : ''}
                    
                    ${website_url ? `
                    <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Sitio Web</p>
                    <p style="margin: 0 0 16px 0; color: #18181b; font-size: 16px;">
                      <a href="${website_url}" style="color: #8B5CF6;">${website_url}</a>
                    </p>
                    ` : ''}
                    
                    ${message ? `
                    <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Mensaje</p>
                    <p style="margin: 0; color: #18181b; font-size: 16px;">${message}</p>
                    ` : ''}
                  </div>
                  
                  <a href="${reviewUrl}" style="display: inline-block; background-color: #8B5CF6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Revisar Solicitud
                  </a>
                  
                  <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px;">
                    O copia este enlace: <a href="${reviewUrl}" style="color: #8B5CF6;">${reviewUrl}</a>
                  </p>
                </div>
                
                <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
                  Vestidor Online - Sistema de Solicitudes
                </p>
              </div>
            </body>
            </html>
          `,
        });

        if (emailResponse.error) {
          console.error("Resend API error:", emailResponse.error);
        } else {
          console.log("Email sent successfully:", emailResponse.data?.id);
          emailSent = true;
        }
      }
    } catch (emailError: any) {
      console.error("Failed to send email notification:", emailError.message);
    }

    return new Response(
      JSON.stringify({ success: true, requestId: request.id, emailSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-access-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
