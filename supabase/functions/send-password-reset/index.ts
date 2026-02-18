import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Generating password reset link for:", email);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: "https://vestidoronline.lovable.app/reset-password",
        },
      });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      return new Response(
        JSON.stringify({ error: "reset_failed", details: linkError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!linkData?.properties?.action_link) {
      console.error("No action_link in response");
      return new Response(
        JSON.stringify({ error: "reset_failed", details: "No recovery link generated" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const actionLink = linkData.properties.action_link;
    console.log("Recovery link generated, sending email via Resend...");

    const emailResponse = await resend.emails.send({
      from: "Vestidor Online <noreply@vestidor.online>",
      to: [email],
      subject: "Restablecer contraseña - Vestidor Online",
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
              
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">Vestidor Online</h1>
              </div>
              
              <h2 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
                Restablecer contraseña 🔑
              </h2>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Vestidor Online</strong>. Hacé clic en el siguiente botón para crear una nueva contraseña:
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${actionLink}" style="display: inline-block; background-color: #8B5CF6; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Restablecer mi Contraseña
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                Si no solicitaste este cambio, podés ignorar este email. Tu contraseña no será modificada.
              </p>
              
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                O copiá este enlace: <a href="${actionLink}" style="color: #8B5CF6; word-break: break-all;">${actionLink}</a>
              </p>
            </div>
            
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
        JSON.stringify({ error: "email_failed", details: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
