import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Soy tu asistente virtual de MCS. Mi tono es profesional y eficiente.

PROPÓSITO: Ayudar con soporte técnico, NOC y tickets de Halo ITSM.

REGLAS DE BÚSQUEDA DE TICKETS:
1. ANTE CUALQUIER CONSULTA DE TICKETS, USA LA HERRAMIENTA buscar_tickets_halo.
2. CÁLCULO DE FECHAS (CRÍTICO): Usa "FECHA HOY" (abajo) para calcular los rangos.
   - "Mes pasado": Si hoy es Marzo, el rango es del 1 de febrero al último día de febrero.
   - Proporciona las fechas en formato YYYY-MM-DD.
3. ESTADO Y PRIORIDAD: Ahora se incluyen detalles extendidos en la herramienta. No digas que no tienes acceso.
4. ADMIN MCS: Si tu dominio es mcs.com.mx, usa client_name para buscar en cualquier empresa.

Responde siempre en español.`;

// ── Halo ITSM helpers ──

let haloTokenCache: { token: string; expiresAt: number } | null = null;

async function getHaloToken(): Promise<string> {
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
    const data = await haloApiGet("Client", { search: clientName, count: "5" });
    const clients = data.clients || data.records || data;
    if (Array.isArray(clients) && clients.length > 0) return clients[0].id;
    return null;
  } catch (e) {
    console.error("Error finding Halo client:", e);
    return null;
  }
}

async function getHaloTickets(clientName: string, statusFilter?: string, startDate?: string, endDate?: string, isMCSAdmin: boolean = false, targetClientName?: string): Promise<string> {
  try {
    const clientToSearch = (isMCSAdmin && targetClientName) ? targetClientName : clientName;
    const haloClientId = await findHaloClientByName(clientToSearch);
    
    if (!haloClientId) return `No se encontró el cliente "${clientToSearch}".`;

    const params: Record<string, string> = {
      client_id: String(haloClientId),
      pageinate: "true",
      page_size: "30",
      page_no: "1",
      order: "datecreated",
      orderdesc: "true",
      // IMPORTANT: Halo date filtering often uses these params
      datesearch: "datecreated",
    };

    if (startDate) params.startdate = `${startDate}T00:00:00.000Z`;
    if (endDate) params.enddate = `${endDate}T23:59:59.999Z`;

    if (statusFilter === "open" || statusFilter === "abiertos") {
      params.open_only = "true";
    } else if (statusFilter === "cerrados") {
      params.open_only = "false";
    } 

    console.log(`Final Halo Params for ${clientToSearch}:`, JSON.stringify(params));
    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return `No se encontraron tickets para "${clientToSearch}" en el periodo ${startDate || "inicial"} - ${endDate || "hoy"}.`;
    }

    const ticketList = tickets.slice(0, 15).map((t: any) => {
      // Halo often returns status and priority as objects OR as _name suffix fields
      const status = t.status_name || t.status?.name || "N/A";
      const priority = t.priority_name || t.priority?.name || "N/A";
      const agent = t.agent_name || t.agent?.name || "No asignado";
      const dateRaw = t.datecreated || t.dateoccurred || "";
      let date = "N/A";
      if (dateRaw) {
        try { date = new Date(dateRaw).toLocaleDateString("es-MX"); } catch (_) {}
      }

      return `- **Ticket #${t.id}**: ${t.summary || t.details || "Sin asunto"}
  • Estado: ${status}
  • Prioridad: ${priority}
  • Asignado: ${agent}
  • Fecha: ${date}`;
    });

    const total = data.record_count || tickets.length;
    let result = `Se encontraron **${total}** ticket(s) para "${clientToSearch}" del ${startDate || "periodo solicitado"}:\n\n${ticketList.join("\n\n")}`;
    if (total > 15) result += `\n\n_(Mostrando los 15 más recientes de ${total})_`;

    return result;
  } catch (e) {
    console.error("Halo calculation error:", e);
    return `Error al consultar Halo: ${e instanceof Error ? e.message : "Error desconocido"}.`;
  }
}

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_tickets_halo",
      description: "Busca tickets en la plataforma Halo ITSM.",
      parameters: {
        type: "object",
        properties: {
          status_filter: { type: "string", enum: ["abiertos", "cerrados", "todos"] },
          client_name: { type: "string", description: "Empresa a buscar (solo MCS Admin)." },
          start_date: { type: "string", description: "Fecha inicio YYYY-MM-DD." },
          end_date: { type: "string", description: "Fecha fin YYYY-MM-DD." },
        },
        required: ["start_date", "end_date"], // Force providing dates
        additionalProperties: false,
      },
    },
  },
];

async function processToolCalls(toolCalls: any[], clientName: string): Promise<any[]> {
  const results = [];
  for (const toolCall of toolCalls) {
    const fn = toolCall.function;
    const args = JSON.parse(fn.arguments || "{}");
    const isMCSAdmin = clientName === "MCS" || (clientName && clientName.toUpperCase().includes("MCS"));
    
    let result = "";
    if (fn.name === "buscar_tickets_halo") {
      result = await getHaloTickets(clientName, args.status_filter, args.start_date, args.end_date, isMCSAdmin, args.client_name);
    } else {
      result = `Tool ${fn.name} not found.`;
    }

    results.push({ role: "tool", tool_call_id: toolCall.id, content: result });
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userDomain, clientName, availableServices } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const now = new Date();
    const isMCSUser = userDomain === "mcs.com.mx";
    
    const personalizedPrompt = SYSTEM_PROMPT 
      + `\n\nFECHA HOY: ${now.toLocaleDateString("es-MX")} (ISO: ${now.toISOString().split('T')[0]})`
      + `\nUsuario: ${clientName || "Invitado"} (${userDomain}).`
      + (isMCSUser ? "\nADMIN: Puedes buscar cualquier cliente." : "")
      + (availableServices?.length > 0 ? "\nServicios: " + availableServices.map((s:any) => s.name).join(", ") : "");

    const firstResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: personalizedPrompt }, ...messages],
        tools,
        stream: false,
      }),
    });

    const firstData = await firstResp.json();
    const choice = firstData.choices?.[0];

    if (choice?.message?.tool_calls?.length > 0) {
      const toolResults = await processToolCalls(choice.message.tool_calls, clientName || "");
      const secondResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: personalizedPrompt }, ...messages, choice.message, ...toolResults],
          stream: true,
        }),
      });
      return new Response(secondResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const content = choice?.message?.content || "";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: "stop" }] })}\n\n`));
        c.enqueue(encoder.encode("data: [DONE]\n\n"));
        c.close();
      }
    });
    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
