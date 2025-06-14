import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import * as resend from "https://esm.sh/resend@3.2.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

serve(async (req: Request) => {
  try {
    // Vérifier si la clé API Resend est définie
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Clé API Resend non configurée" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendClient = new resend.Resend(resendApiKey);
    const { to, subject, html, from = "onboarding@resend.dev" } = await req.json();

    // Valider les champs requis
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Envoyer l'e-mail via Resend
    const { error } = await resendClient.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "E-mail envoyé avec succès" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});