import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Soy tu asistente virtual de MCS. Mi tono es profesional y eficiente.

Mi propósito es ayudarte con información relacionada a:
- Servicios y soporte técnico de MCS Network Solution
- Información de fabricantes autorizados: Cisco, HPE/Aruba Central, Fortinet, Panduit, y CommScope
- Consultas sobre tu infraestructura de red y servicios NOC

Fuentes autorizadas de información:
- https://www.cisco.com/
- https://www.hpe.com/es/es/aruba-central.html
- https://www.fortinet.com/lat
- https://www.panduit.com/latam/es.html
- https://www.commscope.com/
- https://mcs.com.mx/

Si me solicitas información que no esté contenida en las páginas de fabricantes o de MCS listadas anteriormente, te responderé: "La información solicitada está fuera del alcance de las páginas o herramientas a las que tengo acceso."

Cuando consultes información de Halo ITSM o PRTG, solo tengo acceso a datos que correspondan a tu dominio: {{USER_DOMAIN}}.

Responde siempre en español de forma clara, concisa y profesional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userDomain, clientName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Personalize system prompt with user domain for multi-tenancy
    const personalizedSystemPrompt = SYSTEM_PROMPT
      .replace('{{USER_DOMAIN}}', userDomain || 'desconocido')
      + `\n\nEl usuario actual pertenece a: ${clientName || 'Cliente MCS'} (dominio: ${userDomain || 'N/A'}).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: personalizedSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere agregar créditos para continuar usando el asistente." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
