import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";

function deriveInstanceName(companyId: string) {
  return `atendezap_${companyId.replace(/-/g, "").slice(0, 16)}`;
}

function buildWebhookUrl() {
  try {
    const req = getRequest();
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}/api/public/whatsapp-webhook`;
  } catch {
    return "";
  }
}

async function resolveCompanyId(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("company_user")
    .select("company_id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Você ainda não possui uma empresa. Finalize o onboarding.");
  return data.company_id as string;
}

export const connectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const {
      evoCreateInstance,
      evoConnect,
      evoSetWebhook,
      evoState,
    } = await import("./evolution.server");

    const instanceName = deriveInstanceName(companyId);
    const webhookUrl = buildWebhookUrl();

    await supabase
      .from("whatsapp_instances")
      .upsert(
        { company_id: companyId, user_id: userId, instance_name: instanceName, status: "connecting" },
        { onConflict: "company_id" },
      );

    try {
      await evoCreateInstance(instanceName, webhookUrl);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (!/exists|already/i.test(msg)) console.warn("[evolution.create]", msg);
    }

    if (webhookUrl) {
      try { await evoSetWebhook(instanceName, webhookUrl); } catch (e) { console.warn("[evolution.setWebhook]", e); }
    }

    let qrBase64: string | null = null;
    try {
      const qr = await evoConnect(instanceName);
      qrBase64 = qr?.base64 ?? null;
    } catch (e) { console.warn("[evolution.connect]", e); }

    let state: string | undefined;
    try {
      const s = await evoState(instanceName);
      state = s?.instance?.state || (s as any)?.state;
    } catch {}

    return { instanceName, qrBase64, state, webhookUrl };
  });

export const checkWhatsappStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { evoState, evoFetchNumberFromInstance, evoSetWebhook } = await import("./evolution.server");

    const { data: row } = await supabase
      .from("whatsapp_instances")
      .select("instance_name,status")
      .eq("company_id", companyId)
      .maybeSingle();
    if (!row) return { status: "disconnected", state: null, numero: null };

    let state: string | null = null;
    try {
      const s = await evoState(row.instance_name);
      state = s?.instance?.state || (s as any)?.state || null;
    } catch (e) { console.warn("[evolution.state]", e); }

    const newStatus =
      state === "open" ? "connected" : state === "connecting" ? "connecting" : "disconnected";

    let numero: string | null = null;
    if (newStatus === "connected") {
      numero = await evoFetchNumberFromInstance(row.instance_name);
      const webhookUrl = buildWebhookUrl();
      if (webhookUrl) {
        try { await evoSetWebhook(row.instance_name, webhookUrl); } catch {}
      }
    }

    await supabase
      .from("whatsapp_instances")
      .update({ status: newStatus, ...(numero ? { numero } : {}) })
      .eq("company_id", companyId);

    return { status: newStatus, state, numero };
  });

export const disconnectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { evoLogout } = await import("./evolution.server");
    const { data: row } = await supabase
      .from("whatsapp_instances")
      .select("instance_name")
      .eq("company_id", companyId)
      .maybeSingle();
    if (row) {
      try { await evoLogout(row.instance_name); } catch (e) { console.warn("[evolution.logout]", e); }
      await supabase
        .from("whatsapp_instances")
        .update({ status: "disconnected" })
        .eq("company_id", companyId);
    }
    return { ok: true };
  });

export const sendWhatsappText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { numero: string; texto: string; contatoNome?: string | null }) => d)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { data: inst } = await supabase
      .from("whatsapp_instances").select("instance_name,status").eq("company_id", companyId).maybeSingle();
    if (!inst?.instance_name) throw new Error("WhatsApp não conectado");
    const { evoSendText } = await import("./evolution.server");
    try { await evoSendText(inst.instance_name, data.numero, data.texto); }
    catch (e: any) { throw new Error(`Falha ao enviar: ${e?.message ?? e}`); }
    const { error } = await supabase.from("mensagens").insert({
      company_id: companyId, user_id: userId, numero: data.numero,
      contato_nome: data.contatoNome ?? null,
      direcao: "saida", autor: "humano", texto: data.texto,
    });
    if (error) throw new Error(error.message);
    // Pause IA on this contact (humano assumed)
    await supabase.from("contact_pause").upsert(
      { company_id: companyId, user_id: userId, numero: data.numero, pausado: true },
      { onConflict: "company_id,numero" },
    );
    return { ok: true };
  });

export const setContactIaActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { numero: string; ativa: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { error } = await supabase.from("contact_pause").upsert(
      { company_id: companyId, user_id: userId, numero: data.numero, pausado: !data.ativa },
      { onConflict: "company_id,numero" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => d)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { lovableAiChat } = await import("./lovable-ai.server");
    const { buildSystemPrompt, parseAiOutput } = await import("./ai-prompt");
    const [{ data: cfg }, { data: stagesRows }, { data: prodRows }] = await Promise.all([
      supabase.from("agent_config").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("crm_stage").select("nome, tipo, ordem").eq("company_id", companyId).order("ordem", { ascending: true }),
      supabase.from("produto").select("nome, preco, descricao, ordem").eq("company_id", companyId).eq("ativo", true).order("ordem", { ascending: true }),
    ]);
    const stages = (stagesRows ?? []).map((s: any) => ({ nome: s.nome, tipo: s.tipo }));
    const produtos = (prodRows ?? []).map((p: any) => ({ nome: p.nome, preco: p.preco, descricao: p.descricao }));
    const system = buildSystemPrompt(cfg ?? {}, {
      responderEmPartes: cfg?.responder_em_partes ?? true,
      stages,
      produtos,
    });
    const raw = await lovableAiChat([
      { role: "system", content: system },
      { role: "user", content: data.message },
    ]);
    const { parts, stage } = parseAiOutput(raw, stages);
    return { reply: parts.join("\n\n"), parts, stage, system };
  });

