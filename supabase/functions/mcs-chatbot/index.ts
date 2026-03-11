import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const getSystemPrompt = (clientName: string, userDomain: string, services: any[] = []) => {
  const isAdmin = userDomain === "mcs.com.mx";
  const servicesList = services.map(s => `- ${s.name}: ${s.description || 'Consulta disponible'}`).join("\n");

  return `Soy el Asistente Técnico de MCS. Mi objetivo es ayudar a clientes y administradores con información sobre nuestros servicios, proyectos y soporte técnico.

CONOCIMIENTO DE MCS:
- Somos expertos en soluciones de TI, redes, seguridad y NOC.
- Ofrecemos servicios de Cisco, Fortinet, Microsoft, entre otros.
- Tenemos una sección de "Reportes de Servicio" y "Gestión de Recursos".

SERVICIOS DISPONIBLES PARA EL USUARIO ACTUAL (${clientName}):
${servicesList || "Información general de soporte."}

REGLAS DE HALO ITSM (SOPORTE):
1. Para buscar tickets (abiertos, cerrados o de meses pasados), USA SIEMPRE 'buscar_tickets_halo'.
2. CALCULAR FECHAS: "Mes pasado" se refiere al mes calendario anterior completo. Usa la "FECHA HOY" proporcionada.
3. ${isAdmin ? "Eres ADMINISTRADOR: Puedes buscar tickets de CUALQUIER empresa usando el parámetro 'client_name'." : "Eres CLIENTE: Solo buscas tus propios tickets."}

TONO: Profesional, servicial y experto. Si te preguntan algo fuera de Halo (como Cisco o servicios), responde usando tu conocimiento general y el contexto de MCS. No te limites solo a tickets.`;
};

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
    const queryName = (isMCSAdmin && targetClientName) ? targetClientName : clientName;
    console.log(`Halo Search: ${queryName}`);
    
    // Search with more flexibility
    const clientData = await haloApiGet("Client", { search: queryName });
    const clients = clientData.clients || clientData.records || clientData || [];
    
    if (!Array.isArray(clients) || clients.length === 0) {
      return `Lo siento, no pude encontrar ninguna empresa bajo el nombre "${queryName}" en Halo ITSM.`;
    }
    
    // Select best match
    const client = clients.find((c: any) => c.name?.toLowerCase().includes(queryName.toLowerCase())) || clients[0];
    const haloClientId = client.id;
    const finalClientName = client.name || queryName;

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

    console.log(`Halo Querying Tickets for ID ${haloClientId} (${finalClientName})`);
    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data || [];

    if (tickets.length === 0) {
      return `No se encontraron tickets registrados para **${finalClientName}** entre el ${startDate || 'inicio'} y el ${endDate || 'hoy'}.`;
    }

    const list = tickets.slice(0, 20).map((t: any) => {
      const s = t.status_name || t.status?.name || "N/A";
      const p = t.priority_name || t.priority?.name || "N/A";
      const date = t.datecreated || t.dateoccurred || "";
      let fDate = "N/A";
      if (date) try { fDate = new Date(date).toLocaleDateString("es-MX"); } catch (_) {}
      return `- **Ticket #${t.id}**: ${t.summary || "Sin asunto"}\n  • Estado: ${s} | Prioridad: ${p} | Fecha: ${fDate}`;
    });

    return `Se encontraron **${data.record_count || tickets.length}** tickets para **${finalClientName}** en el periodo solicitado:\n\n${list.join("\n")}${data.record_count > 20 ? `\n\n_(Mostrando 20 de ${data.record_count})_` : ""}`;
  } catch (e) {
    console.error("Halo Error Detail:", e);
    return `Error técnico al conectar con Halo: ${e.message}`;
  }
}

const tools = [{
  type: "function",
  function: {
    name: "buscar_tickets_halo",
    description: "Busca tickets por empresa y rango de fechas. Usa el formato YYYY-MM-DD.",
    parameters: {
      type: "object",
      properties: {
        status_filter: { type: "string", enum: ["abiertos", "cerrados", "todos"] },
        client_name: { type: "string", description: "Nombre de la empresa a buscar." },
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
    const { messages, userDomain, clientName, availableServices } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const now = new Date();
    const systemPrompt = getSystemPrompt(clientName, userDomain, availableServices) + `\n\nFECHA HOY: ${now.toISOString().split('T')[0]}`;

    const config = {
      model: "google/gemini-2.0-flash",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools
    };

    const firstResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(config)
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
        body: JSON.stringify({ ...config, messages: [...config.messages, message, ...results], stream: true })
      });
      return new Response(secondResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const content = message?.content || "No pude procesar tu solicitud adecuadamente.";
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
