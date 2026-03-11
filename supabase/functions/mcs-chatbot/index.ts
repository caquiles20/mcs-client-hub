import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Soy tu asistente virtual de MCS. Mi tono es profesional y eficiente.

PROPÓSITO: Soporte técnico, NOC y Halo ITSM.

REGLAS DE BÚSQUEDA DE TICKETS:
1. SIEMPRE usa la herramienta buscar_tickets_halo para consultas de tickets.
2. CÁLCULO DE FECHAS: Usa "FECHA HOY" para calcular los rangos. "Mes pasado" = mes anterior completo.
3. ESTADO Y PRIORIDAD: Ya están disponibles en la herramienta.
4. ADMIN MCS: Si eres @mcs.com.mx, puedes buscar cualquier cliente por nombre usando client_name.

Responde siempre en español. No pidas fechas, calcúlas tú.`;

let haloTokenCache: { token: string; expiresAt: number } | null = null;

async function getHaloToken(): Promise<string> {
  if (haloTokenCache && Date.now() < haloTokenCache.expiresAt - 60_000) return haloTokenCache.token;
  const haloUrl = Deno.env.get("HALO_ITSM_URL");
  const clientId = Deno.env.get("HALO_ITSM_CLIENT_ID");
  const clientSecret = Deno.env.get("HALO_ITSM_CLIENT_SECRET");
  if (!haloUrl || !clientId || !clientSecret) throw new Error("Halo credentials missing");

  const resp = await fetch(`${haloUrl.replace(/\/$/, "")}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope: "all" }),
  });
  if (!resp.ok) throw new Error(`Token error: ${resp.status}`);
  const data = await resp.json();
  haloTokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return haloTokenCache.token;
}

async function haloApiGet(path: string, params?: Record<string, string>): Promise<any> {
  const haloUrl = Deno.env.get("HALO_ITSM_URL")!.replace(/\/$/, "");
  const token = await getHaloToken();
  const url = new URL(`${haloUrl}/api/${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if (!resp.ok) throw new Error(`API error (${path}): ${resp.status}`);
  return resp.json();
}

async function getHaloTickets(clientName: string, statusFilter?: string, startDate?: string, endDate?: string, isMCSAdmin: boolean = false, targetClientName?: string): Promise<string> {
  try {
    const clientToSearch = (isMCSAdmin && targetClientName) ? targetClientName : clientName;
    
    // Robust client search
    console.log(`Searching for client: ${clientToSearch}`);
    const clientData = await haloApiGet("Client", { search: clientToSearch, count: "5" });
    const clients = clientData.clients || clientData.records || clientData;
    
    if (!Array.isArray(clients) || clients.length === 0) {
      return `No pude encontrar la empresa "${clientToSearch}" en Halo ITSM. Por favor verifica el nombre.`;
    }
    
    // Try to find exact match or use first
    const client = clients.find((c: any) => c.name?.toLowerCase() === clientToSearch.toLowerCase()) || clients[0];
    const haloClientId = client.id;

    const params: Record<string, string> = {
      client_id: String(haloClientId),
      pageinate: "true", page_size: "30", page_no: "1",
      order: "datecreated", orderdesc: "true",
      datesearch: "datecreated"
    };

    if (startDate) params.startdate = `${startDate}T00:00:00.000Z`;
    if (endDate) params.enddate = `${endDate}T23:59:59.999Z`;
    
    if (statusFilter === "abiertos") params.open_only = "true";
    else if (statusFilter === "cerrados") params.open_only = "false";

    console.log(`Halo Query for ${clientToSearch} (ID: ${haloClientId}):`, JSON.stringify(params));
    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return `No se encontraron tickets para "${clientToSearch}" en el periodo solicitado (${startDate || "inicio"} al ${endDate || "hoy"}).`;
    }

    const list = tickets.slice(0, 15).map((t: any) => {
      const s = t.status_name || t.status?.name || "N/A";
      const p = t.priority_name || t.priority?.name || "N/A";
      const date = t.datecreated || t.dateoccurred || "";
      let fDate = "N/A";
      if (date) try { fDate = new Date(date).toLocaleDateString("es-MX"); } catch (_) {}
      return `- **Ticket #${t.id}**: ${t.summary || "Sin asunto"}\n  • Estado: ${s} | Prioridad: ${p} | Fecha: ${fDate}`;
    });

    const total = data.record_count || tickets.length;
    let res = `Se encontraron **${total}** tickets para **${clientToSearch}** en el periodo solicitado:\n\n${list.join("\n")}`;
    if (total > 15) res += `\n\n_(Mostrando los 15 más recientes de ${total})_`;
    return res;
  } catch (e) {
    console.error("Halo Error:", e);
    return `Error al consultar Halo ITSM: ${e.message}`;
  }
}

const tools = [{
  type: "function",
  function: {
    name: "buscar_tickets_halo",
    description: "Busca tickets filtrando por empresa y fecha. Obligatorio usar start_date y end_date.",
    parameters: {
      type: "object",
      properties: {
        status_filter: { type: "string", enum: ["abiertos", "cerrados", "todos"] },
        client_name: { type: "string", description: "Empresa (solo admins)." },
        start_date: { type: "string", description: "Fecha inicio (YYYY-MM-DD)." },
        end_date: { type: "string", description: "Fecha fin (YYYY-MM-DD)." }
      },
      required: ["start_date", "end_date"]
    }
  }
}];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, userDomain, clientName } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const now = new Date();
    const prompt = SYSTEM_PROMPT + `\n\nFECHA HOY: ${now.toISOString().split('T')[0]}\nUsuario: ${clientName} (${userDomain}).`;

    const firstResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: prompt }, ...messages], tools })
    });

    const firstData = await firstResp.json();
    const message = firstData.choices?.[0]?.message;

    if (message?.tool_calls?.length > 0) {
      const results = [];
      for (const tc of message.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        const res = await getHaloTickets(clientName, args.status_filter, args.start_date, args.end_date, userDomain === "mcs.com.mx", args.client_name);
        results.push({ role: "tool", tool_call_id: tc.id, content: res });
      }
      const secondResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: prompt }, ...messages, message, ...results], stream: true })
      });
      return new Response(secondResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const content = message?.content || "Lo siento, no pude procesar tu solicitud.";
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: "stop" }] })}\n\n`));
        c.enqueue(encoder.encode("data: [DONE]\n\n"));
        c.close();
      }
    }), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
