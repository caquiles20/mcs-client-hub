import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el Asistente Virtual Senior de MCS (México Comunicación y Sistemas).

REGLAS DE IDENTIDAD:
1. SALUDO: Si el usuario te saluda, responde ÚNICAMENTE: "¡Hola!, soy tu asistente virtual MCS, ¿en que puedo ayudarte hoy?".
2. EXPERTO TÉCNICO: Eres experto en TI, Redes, CCTV, Ciberseguridad y NOC.
3. SOCIOS TECNOLÓGICOS: Tienes conocimiento general de nuestros socios:
   - Cisco: Líder en redes y colaboración. [Cisco](https://www.cisco.com)
   - Aruba: Redes inalámbricas y movilidad de HPE. [Aruba](https://www.arubanetworks.com)
   - Fortinet: Líder en ciberseguridad y SD-WAN. [Fortinet](https://www.fortinet.com)
   - Panduit: Infraestructura física y cableado. [Panduit](https://www.panduit.com)

REGLAS DE SEGURIDAD Y DATOS:
1. PRIVACIDAD TOTAL: Si eres un cliente externo (No MCS), SOLO puedes ver tickets que pertenezcan a tu empresa. Si te dan un ID de otra empresa, di que no lo encontraste y ofrece contactar a un agente por WhatsApp usando exactamente este markdown: [![WhatsApp](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ij48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzI1RDM2NiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yMy41IDguNWMtMS45LTEuOS00LjQtMi45LTcuMS0yLjlDMTAuMSA1LjYgNS42IDEwIDUuNiAxNS41YzAgMS44LjUgMy42IDEuMyA1LjFMNS41IDI2LjVsNi4xLTEuNmMxLjUuOCAzLjEgMS4zIDQuOCAxLjNoLjFjNS40IDAgOS44LTQuNCA5LjgtOS44LjEtMi43LS45LTUuMi0yLjgtN3ptLTcgMTUuMWgtLjFjLTEuNSAwLTMtLjQtNC4zLTEuMmwtLjMtLjItMy4yLjguOS0zLjEtLjItLjNjLS45LTEuNC0xLjMtMy0xLjMtNC42IDAtNC44IDMuOS04LjcgOC43LTguNyAyLjMgMCA0LjUuOSA2LjIgMi41czIuNiAzLjggMi41IDYuMS0uMSAzLjYtMS41IDUtMS45IDIuMy00LjEgMi41em00LjYtNi41Yy0uMy0uMS0xLjYtLjgtMS44LS45cy0uNS0uMS0uNi4xYy0uMi4zLS42LjktLjcgMS4xcy0uMy4xLS41IDBjLTEuNi0uOC0yLjctMS44LTMuNy0zLjMtLjEtLjIgMC0uMy4xLS40bC40LS41Yy4xLS4xLjEtLjIuMi0uM3MwLS4yIDAtLjNjMC0uMS0uNi0xLjQtLjgtMS45cy0uNC0uNC0uNi0uNGgtLjVjLS4yIDAtLjQuMS0uNi4yczEtMSAxLjggMi40YzEgMS43IDIgMi44IDMuOCAzLjYuNS4yLjkuMy0xLjIuNy0xLjEuOS0xLjIuOS0xLjMuOXMtLjQgMC0uNS0uMWMtLjItLjEtMS4xLS41LTIuMS0xLjMtLjgtLjctMS40LTEuNi0xLjUtMS44cy4xLS40LjMtLjVsLjUtLjJjLjEtLjEuMy0uMi40LS4yczAuMi0uMi4zLS41YzAtLjMtLjYtMS40LS42LTEuNHoiLz48L3N2Zz4=) Contactar agente NOC vía WhatsApp](https://wa.me/528123528009). NUNCA menciones ni enlaces a ninguna "Mesa de Servicios" ni portal externo.
2. CONCIENCIA TEMPORAL: Se te proporciona la fecha y hora actual. Úsala para entender qué día es "hoy", "mañana" o "esta mañana". Si te preguntan por tickets de hoy, usa las herramientas con la fecha actual.
3. NO ALUCINES: No digas que no tienes acceso a la hora si se te proporciona en el contexto. No inventes comentarios o técnicos.
4. CONTEXTO DE SERVICIOS: Conoces qué servicios tiene habilitados el usuario en su portal (se te proporcionan en el contexto).`;

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

async function getHaloTicketById(ticketId: string, userClientName: string, isMCSAdmin: boolean): Promise<string> {
  try {
    const data = await haloApiGet(`Tickets/${ticketId}`);
    if (!data || data.error || !data.id) return `No se encontró información para el ticket #${ticketId}.`;

    if (!isMCSAdmin && data.client_name.toLowerCase() !== userClientName.toLowerCase()) {
      return `No se encontró el ticket #${ticketId} asociado a su empresa.`;
    }

    const [actionsResp, agentResp, statusResp, tickettypeResp] = await Promise.allSettled([
      haloApiGet("Actions", { ticket_id: String(data.id), paginate: "true", page_size: "20" }),
      data.agent_id ? haloApiGet(`Agent/${data.agent_id}`) : Promise.resolve(null),
      data.status_id ? haloApiGet(`Status/${data.status_id}`) : Promise.resolve(null),
      data.tickettype_id ? haloApiGet(`Tickettype/${data.tickettype_id}`) : Promise.resolve(null),
    ]);

    const agentName = (agentResp.status === "fulfilled" && agentResp.value?.name)
      ? agentResp.value.name
      : (data.agent_name || "Sin asignar");

    const statusName = (statusResp.status === "fulfilled" && statusResp.value?.name)
      ? statusResp.value.name
      : (data.status_name || `Status ID ${data.status_id}`);

    const tickettypeName = (tickettypeResp.status === "fulfilled" && tickettypeResp.value?.name)
      ? tickettypeResp.value.name
      : (data.tickettype_name || "N/A");

    let closingNote = "";
    let recentActionsText = "No hay acciones registradas.";

    if (actionsResp.status === "fulfilled") {
      const rawActions = actionsResp.value?.actions || actionsResp.value?.records || actionsResp.value || [];
      const actions: any[] = Array.isArray(rawActions) ? rawActions : [];

      const closingAction = actions.find((a: any) =>
        a.note &&
        a.who?.toLowerCase() !== "automation" &&
        (a.outcome?.toLowerCase().includes("resuel") ||
         a.outcome?.toLowerCase().includes("closed") ||
         a.outcome?.toLowerCase().includes("cierre") ||
         a.outcome?.toLowerCase() === "resolved")
      );
      if (closingAction) {
        const dateStr = (closingAction.datecreated || closingAction.datetime || "").split("T")[0];
        closingNote = `${closingAction.note} (${dateStr} - ${closingAction.who})`;
      }

      const humanActions = actions.filter((a: any) => a.note && a.note.trim().length > 0);
      const top5 = humanActions.slice(0, 5).map((a: any) => {
        const dateStr = (a.datecreated || a.datetime || "").split("T")[0];
        return `  [${dateStr}] ${a.who} (${a.outcome || "Nota"}): ${a.note}`;
      });
      if (top5.length > 0) {
        recentActionsText = top5.join("\n");
      }
    }

    return `Detalles del Ticket #${data.id}:
- **Asunto**: ${data.summary}
- **Estatus**: ${statusName}
- **Tipo**: ${tickettypeName}
- **Cliente**: ${data.client_name}
- **Equipo**: ${data.team || "N/A"}
- **Fecha de creación**: ${data.datecreated?.split("T")[0]}
- **Fecha de cierre**: ${data.dateclosed ? data.dateclosed.split("T")[0] : "Abierto"}
- **Técnico**: ${agentName}
- **SLA**: ${data.sla_name || "N/A"}
- **Nota de cierre**: ${closingNote || "No registrada"}
- **Últimas acciones**:
${recentActionsText}`;
  } catch (e) {
    return `Error al consultar ticket #${ticketId}.`;
  }
}

async function getHaloTickets(clientName: string, startDate?: string, endDate?: string, isMCSAdmin: boolean = false, targetClientName?: string): Promise<string> {
  try {
    const q = (isMCSAdmin && targetClientName) ? targetClientName : clientName;
    const clientData = await haloApiGet("Client", { search: q });
    const clients = clientData.clients || clientData.records || clientData || [];
    if (!clients.length) return `No se encontró la empresa "${q}".`;

    const client = clients[0];
    const params: Record<string, string> = {
      client_id: String(client.id),
      paginate: "true", page_size: "15",
      order: "datecreated", orderdesc: "true"
    };
    if (startDate) params.startdate = `${startDate}T00:00:00.000Z`;
    if (endDate) params.enddate = `${endDate}T23:59:59.999Z`;

    const data = await haloApiGet("Tickets", params);
    const tickets = data.tickets || data.records || data || [];
    if (!tickets.length) return `No hay tickets para ${client.name} en el periodo solicitado (${startDate || 'siempre'} al ${endDate || 'ahora'}).`;

    const list = tickets.slice(0, 10).map((t: any) => `- **Ticket #${t.id}**: ${t.summary} (${t.status_name})`).join("\n");
    return `Listado de tickets para ${client.name}:\n\n${list}`;
  } catch (e) {
    return `Error en búsqueda de tickets de ${clientName}.`;
  }
}

function prepareMessages(messages: any[]) {
  const claudeMessages = [];
  let lastRole = null;

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "assistant" : "user";
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);

    if (role === lastRole) {
      const lastMsg = claudeMessages[claudeMessages.length - 1];
      lastMsg.content += "\n" + content;
    } else {
      claudeMessages.push({ role, content });
      lastRole = role;
    }
  }

  while (claudeMessages.length > 0 && claudeMessages[0].role === "assistant") {
    claudeMessages.shift();
  }

  return claudeMessages;
}

const claudeTools = [
  {
    name: "buscar_tickets_halo",
    description: "Busca una lista de tickets por nombre de cliente y rango de fechas. Usa la fecha de hoy si te piden 'hoy' o 'esta mañana'.",
    input_schema: {
      type: "object",
      properties: {
        client_name: { type: "string", description: "Opcional: Nombre de otra empresa (solo para administradores MCS)." },
        start_date: { type: "string", description: "AAAA-MM-DD" },
        end_date: { type: "string", description: "AAAA-MM-DD" }
      }
    }
  },
  {
    name: "consultar_ticket_por_id",
    description: "Obtiene los detalles específicos de un ticket, incluyendo el último comentario, usando su ID numérico.",
    input_schema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "El número ID del ticket (ej: 0052708)" }
      },
      required: ["ticket_id"]
    }
  }
];

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  const sendSimpleError = (msg: string) => {
    console.error(`Edge Function Error: ${msg}`);
    return new Response(new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "Error: " + msg }, finish_reason: "stop" }] })}\n\n`));
        c.enqueue(encoder.encode("data: [DONE]\n\n"));
        c.close();
      }
    }), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { messages, userDomain, clientName, availableServices } = body;
    
    if (!messages) return sendSimpleError("Cuerpo de petición vacío.");
    if (!ANTHROPIC_API_KEY) return sendSimpleError("API key no configurada.");

    const isMCSAdmin = userDomain === "mcs.com.mx";
    const now = new Date();
    const timeLabel = now.toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
    const serviceContext = availableServices ? `\nSERVICIOS HABILITADOS EN EL PORTAL DEL USUARIO:\n${JSON.stringify(availableServices)}\n` : "";
    const systemPrompt = `${SYSTEM_PROMPT}${serviceContext}\n\nFECHA Y HORA ACTUAL: ${timeLabel}\nMODO ACTUAL: Usuario=${clientName}, Dominio=${userDomain}, Admin=${isMCSAdmin}`;

    const anthropicHeaders = {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    };

    const safeMessages = prepareMessages(messages.slice(-10));
    if (safeMessages.length === 0) return sendSimpleError("No hay mensajes válidos en el historial.");

    console.log(`Llamando a Claude (Sonnet 4.6) para: ${clientName}`);

    const firstResp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: safeMessages,
        tools: claudeTools
      })
    });

    const firstData = await firstResp.json();
    if (!firstResp.ok) {
      console.error("Anthropic API Error:", JSON.stringify(firstData));
      throw new Error(firstData.error?.message || "Claude API Error");
    }

    const toolUseBlocks = firstData.content?.filter((b: any) => b.type === "tool_use") || [];

    if (firstData.stop_reason === "tool_use" && toolUseBlocks.length > 0) {
      console.log(`Ejecutando ${toolUseBlocks.length} herramientas...`);
      
      const toolResults = await Promise.all(toolUseBlocks.map(async (block: any) => {
        let result = "";
        try {
          if (block.name === "consultar_ticket_por_id") {
            result = await getHaloTicketById(block.input.ticket_id, clientName, isMCSAdmin);
          } else if (block.name === "buscar_tickets_halo") {
            result = await getHaloTickets(clientName, block.input.start_date, block.input.end_date, isMCSAdmin, block.input.client_name);
          } else {
            result = `Herramienta desconocida: ${block.name}`;
          }
        } catch (e) {
          result = `Error ejecutando herramienta ${block.name}: ${e.message}`;
        }
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: result
        };
      }));

      const messagesWithResult = [
        ...safeMessages,
        { role: "assistant", content: firstData.content },
        { role: "user", content: toolResults }
      ];

      const streamResp = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: anthropicHeaders,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: messagesWithResult,
          stream: true
        })
      });

      let streamBuffer = "";
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          streamBuffer += decoder.decode(chunk, { stream: true });
          const lines = streamBuffer.split("\n");
          streamBuffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const d = JSON.parse(jsonStr);
              if (d.type === "content_block_delta" && d.delta?.type === "text_delta" && d.delta.text) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: d.delta.text }, finish_reason: null }] })}\n\n`
                ));
              }
            } catch (_) {}
          }
        },
        flush(controller) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }
      });

      return new Response(streamResp.body?.pipeThrough(transformStream), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    const textContent = firstData.content
      ?.filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("") || "";

    const fakeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content: textContent }, finish_reason: null }] })}\n\n`
        ));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    });

    return new Response(fakeStream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (e) {
    return sendSimpleError(e.message);
  }
});

