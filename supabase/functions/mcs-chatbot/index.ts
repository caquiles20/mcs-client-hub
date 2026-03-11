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
4. ADMIN MCS: Si eres @mcs.com.mx, puedes buscar cualquier cliente por nombre.

Responde siempre en español. No pidas fechas, calcúlas tú.`;

// ── Halo ITSM helpers ──

let haloTokenCache: { token: string; expiresAt: number } | null = null;

async function getHaloToken(): Promise<string> {
  if (haloTokenCache && Date.now() < haloTokenCache.expiresAt - 60_000) return haloTokenCache.token;
  const haloUrl = Deno.env.get("HALO_ITSM_URL");
  const clientId = Deno.env.get("HALO_ITSM_CLIENT_ID");
  const clientSecret = Deno.env.get("HALO_ITSM_CLIENT_SECRET");
  if (!haloUrl || !clientId || !clientSecret) throw new Error("Halo credentials missing");

  const tokenUrl = `${haloUrl.replace(/\/$/, "")}/auth/token`;
  const resp = await fetch(tokenUrl, {
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
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

async function getHaloTickets(clientName: string, statusFilter?: string, startDate?: string, endDate?: string, isMCSAdmin: boolean = false, targetClientName?: string): Promise<string> {
  try {
    const clientToSearch = (isMCSAdmin && targetClientName) ? targetClientName : clientName;
    const clientData = await haloApiGet("Client", { search: clientToSearch, count: "1" });
    const clients = clientData.clients || clientData.records || clientData;
    if (!Array.isArray(clients) || clients.length === 0) return `No se encontró el cliente "${clientToSearch}".`;
    
    const haloClientId = clients[0].id;
    const params: Record<string, string> = {
      client_id: String(haloClientId),
      pageinate: "true", page_size: "20", page_no: "1",
      order: "datecreated", orderdesc: "true",
      datesearch: "datecreated"
    };

    if (startDate) params.startdate = `${startDate}T00:00:00.000Z`;
    if (endDate) params.enddate = `${endDate}T23:59:59.999Z`;
    if (statusFilter === "open" || statusFilter === "abiertos") params.open_only = "true";
    if (statusFilter === "cerrados") params.open_only = "false";

    console.log(`Halo API Request: ${clientToSearch}`, JSON.stringify(params));
    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data;

    if (!Array.isArray(tickets) || tickets.length === 0) return `No se hallaron tickets para "${clientToSearch}" en ese rango.`;

    const list = tickets.slice(0, 15).map((t: any) => {
      const s = t.status_name || t.status?.name || "N/A";
      const p = t.priority_name || t.priority?.name || "N/A";
      const dRaw = t.datecreated || t.dateoccurred || "";
      let d = "N/A";
      if (dRaw) try { d = new Date(dRaw).toLocaleDateString("es-MX"); } catch (_) {}
      return `- **Ticket #${t.id}**: ${t.summary || "Sin asunto"}\n  • Estado: ${s} | Prioridad: ${p} | Fecha: ${d}`;
    });

    return `Tickets para "${clientToSearch}" (${startDate || "inicio"} - ${endDate || "hoy"}):\n\n${list.join("\n")}`;
  } catch (e) {
    return `Error en búsqueda: ${e.message}`;
  }
}

const tools = [{
  type: "function",
  function: {
    name: "buscar_tickets_halo",
    description: "Consulta tickets. Ejemplo: start_date='2026-02-01', end_date='2026-02-28'.",
    parameters: {
      type: "object",
      properties: {
        status_filter: { type: "string" },
        client_name: { type: "string" },
        start_date: { type: "string" },
        end_date: { type: "string" }
      }
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

    const first = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: prompt }, ...messages], tools })
    });

    const data = await first.json();
    const toolCalls = data.choices?.[0]?.message?.tool_calls;

    if (toolCalls?.length > 0) {
      const results = [];
      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        const res = await getHaloTickets(clientName, args.status_filter, args.start_date, args.end_date, userDomain === "mcs.com.mx", args.client_name);
        results.push({ role: "tool", tool_call_id: tc.id, content: res });
      }
      const second = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: prompt }, ...messages, data.choices[0].message, ...results], stream: true })
      });
      return new Response(second.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const content = data.choices?.[0]?.message?.content || "";
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
