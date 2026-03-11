import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Soy el Asistente Técnico de MCS. Soy experto en TI, redes, soporte y NOC.
Uso la herramienta 'buscar_tickets_halo' para cualquier consulta de tickets.
Respondo siempre en español de forma profesional.`;

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
  return resp.json();
}

async function getHaloTickets(clientName: string, statusFilter?: string, startDate?: string, endDate?: string, isMCSAdmin: boolean = false, targetClientName?: string): Promise<string> {
  try {
    const q = (isMCSAdmin && targetClientName) ? targetClientName : clientName;
    const clientData = await haloApiGet("Client", { search: q });
    const clients = clientData.clients || clientData.records || clientData || [];
    if (!clients.length) return `No se encontró la empresa "${q}".`;
    
    const client = clients[0];
    const params: Record<string, string> = {
      client_id: String(client.id),
      pageinate: "true", page_size: "20",
      order: "datecreated", orderdesc: "true",
      datesearch: "datecreated"
    };
    if (startDate) params.startdate = `${startDate}T00:00:00.000Z`;
    if (endDate) params.enddate = `${endDate}T23:59:59.999Z`;

    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data || [];
    if (!tickets.length) return `No hay tickets para ${client.name} en esas fechas.`;

    const list = tickets.slice(0, 10).map((t: any) => `- **Ticket #${t.id}**: ${t.summary} (${t.status_name || 'N/A'})`).join("\n");
    return `Tickets de ${client.name}:\n\n${list}`;
  } catch (e) {
    return `Error Halo: ${e.message}`;
  }
}

const tools = [{
  type: "function",
  function: {
    name: "buscar_tickets_halo",
    description: "Busca tickets por empresa y fechas.",
    parameters: {
      type: "object",
      properties: {
        client_name: { type: "string" },
        start_date: { type: "string" },
        end_date: { type: "string" }
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
    const now = new Date().toISOString().split('T')[0];
    const prompt = SYSTEM_PROMPT + `\n\nFECHA HOY: ${now}\nUsuario: ${clientName} (${userDomain}).`;

    const config = {
      model: "google/gemini-1.5-flash",
      messages: [{ role: "system", content: prompt }, ...messages],
      tools
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    const data = await resp.json();
    const message = data.choices?.[0]?.message;

    if (message?.tool_calls?.length > 0) {
      const results = [];
      for (const tc of message.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        const res = await getHaloTickets(clientName, undefined, args.start_date, args.end_date, userDomain === "mcs.com.mx", args.client_name);
        results.push({ role: "tool", tool_call_id: tc.id, content: res });
      }
      const resp2 = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, messages: [...config.messages, message, ...results], stream: true })
      });
      return new Response(resp2.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const content = message?.content || "No puedo responder ahora mismo.";
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
