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
- Consultas sobre tickets abiertos en Halo ITSM asociados a tu empresa

Fuentes autorizadas de información:
- https://www.cisco.com/
- https://www.hpe.com/es/es/aruba-central.html
- https://www.fortinet.com/lat
- https://www.panduit.com/latam/es.html
- https://www.commscope.com/
- https://mcs.com.mx/

Si me solicitas información que no esté contenida en las páginas de fabricantes o de MCS listadas anteriormente, y no se trata de tickets o información de Halo ITSM, te responderé: "La información solicitada está fuera del alcance de las páginas o herramientas a las que tengo acceso."

Cuando el usuario pregunte sobre tickets, incidencias, solicitudes o cualquier tema relacionado con soporte, SIEMPRE usa la herramienta buscar_tickets_halo para consultar datos reales. No inventes datos de tickets.

Responde siempre en español de forma clara, concisa y profesional.`;

// ── Halo ITSM helpers ──

let haloTokenCache: { token: string; expiresAt: number } | null = null;

async function getHaloToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (haloTokenCache && Date.now() < haloTokenCache.expiresAt - 60_000) {
    return haloTokenCache.token;
  }

  const haloUrl = Deno.env.get("HALO_ITSM_URL");
  const clientId = Deno.env.get("HALO_ITSM_CLIENT_ID");
  const clientSecret = Deno.env.get("HALO_ITSM_CLIENT_SECRET");

  if (!haloUrl || !clientId || !clientSecret) {
    throw new Error("Halo ITSM credentials not configured");
  }

  const tokenUrl = `${haloUrl.replace(/\/$/, "")}/auth/token`;

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "all",
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Halo token error:", resp.status, errText);
    throw new Error(`Failed to get Halo token: ${resp.status}`);
  }

  const data = await resp.json();
  haloTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return haloTokenCache.token;
}

async function haloApiGet(path: string, params?: Record<string, string>): Promise<any> {
  const haloUrl = Deno.env.get("HALO_ITSM_URL")!.replace(/\/$/, "");
  const token = await getHaloToken();

  const url = new URL(`${haloUrl}/api/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Halo API error (${path}):`, resp.status, errText);
    throw new Error(`Halo API error: ${resp.status}`);
  }

  return resp.json();
}

async function findHaloClientByName(clientName: string): Promise<number | null> {
  try {
    const data = await haloApiGet("Client", {
      search: clientName,
      count: "5",
    });

    const clients = data.clients || data.records || data;
    if (Array.isArray(clients) && clients.length > 0) {
      return clients[0].id;
    }
    return null;
  } catch (e) {
    console.error("Error finding Halo client:", e);
    return null;
  }
}

async function getHaloTickets(clientName: string, statusFilter?: string): Promise<string> {
  try {
    const haloClientId = await findHaloClientByName(clientName);
    if (!haloClientId) {
      return `No se encontró un cliente con el nombre "${clientName}" en Halo ITSM. Verifica que el nombre del cliente esté registrado correctamente en Halo.`;
    }

    const params: Record<string, string> = {
      client_id: String(haloClientId),
      pageinate: "true",
      page_size: "25",
      page_no: "1",
      order: "datecreated",
      orderdesc: "true",
    };

    // Filter by open status if requested or by default
    if (!statusFilter || statusFilter === "open" || statusFilter === "abiertos") {
      params.open_only = "true";
    }

    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return `No se encontraron tickets ${statusFilter || "abiertos"} para el cliente "${clientName}".`;
    }

    const ticketList = tickets.slice(0, 15).map((t: any) => {
      const parts = [
        `- **Ticket #${t.id}**: ${t.summary || t.details || "Sin asunto"}`,
        `  Estado: ${t.status?.name || t.status_name || "N/A"}`,
        `  Prioridad: ${t.priority?.name || t.priority_name || "N/A"}`,
      ];
      if (t.agent?.name || t.agent_name) {
        parts.push(`  Asignado a: ${t.agent?.name || t.agent_name}`);
      }
      if (t.dateoccurred || t.datecreated) {
        const date = new Date(t.dateoccurred || t.datecreated);
        parts.push(`  Fecha: ${date.toLocaleDateString("es-MX")}`);
      }
      return parts.join("\n");
    });

    const total = data.record_count || tickets.length;
    let result = `Se encontraron **${total}** ticket(s) ${statusFilter || "abiertos"} para "${clientName}":\n\n${ticketList.join("\n\n")}`;

    if (total > 15) {
      result += `\n\n_(Mostrando los 15 más recientes de ${total} totales)_`;
    }

    return result;
  } catch (e) {
    console.error("Error fetching Halo tickets:", e);
    return `Error al consultar tickets en Halo ITSM: ${e instanceof Error ? e.message : "Error desconocido"}. Intenta de nuevo más tarde.`;
  }
}

// ── Tool definitions for the AI model ──

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_tickets_halo",
      description: "Busca tickets del cliente en Halo ITSM. Usa esta herramienta cuando el usuario pregunte sobre tickets, incidencias, solicitudes de soporte, o estado de sus servicios.",
      parameters: {
        type: "object",
        properties: {
          status_filter: {
            type: "string",
            enum: ["abiertos", "cerrados", "todos"],
            description: "Filtro de estado de los tickets. Por defecto 'abiertos'.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];

// ── Process tool calls from the AI ──

async function processToolCalls(
  toolCalls: any[],
  clientName: string,
): Promise<{ role: string; tool_call_id: string; content: string }[]> {
  const results = [];

  for (const toolCall of toolCalls) {
    const fn = toolCall.function;
    let result = "";

    if (fn.name === "buscar_tickets_halo") {
      const args = JSON.parse(fn.arguments || "{}");
      result = await getHaloTickets(clientName, args.status_filter);
    } else {
      result = `Herramienta desconocida: ${fn.name}`;
    }

    results.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: result,
    });
  }

  return results;
}

// ── Main handler ──

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

    const personalizedSystemPrompt = SYSTEM_PROMPT
      + `\n\nEl usuario actual pertenece a: ${clientName || "Cliente MCS"} (dominio: ${userDomain || "N/A"}).`
      + `\nCuando uses la herramienta buscar_tickets_halo, los tickets se filtrarán automáticamente para "${clientName || "Cliente MCS"}".`;

    const allMessages = [
      { role: "system", content: personalizedSystemPrompt },
      ...messages,
    ];

    // First call: let the model decide if it needs tools
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        tools,
        stream: false, // First call non-streaming to check for tool calls
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere agregar créditos para continuar usando el asistente." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await firstResponse.text();
      console.error("AI gateway error:", firstResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstData = await firstResponse.json();
    const choice = firstData.choices?.[0];

    // Check if the model wants to call tools
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      console.log("Tool calls requested:", JSON.stringify(choice.message.tool_calls.map((tc: any) => tc.function.name)));

      // Execute tools
      const toolResults = await processToolCalls(choice.message.tool_calls, clientName || "");

      // Second call: send tool results back, now streaming the final answer
      const secondMessages = [
        ...allMessages,
        choice.message, // assistant message with tool_calls
        ...toolResults,
      ];

      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: secondMessages,
          stream: true,
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        console.error("AI gateway second call error:", secondResponse.status, errorText);
        return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(secondResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls: stream the first response directly
    // Since first call was non-streaming, re-call with streaming
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("AI gateway stream error:", streamResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamResponse.body, {
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
