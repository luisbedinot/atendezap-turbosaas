import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";

function deriveInstanceName(userId: string) {
  return `atendezap_${userId.replace(/-/g, "").slice(0, 16)}`;
}

function buildWebhookUrl() {
  // Usa o host da requisição atual (preview/produção lovable.app ou custom domain).
  try {
    const req = getRequest();
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}/api/public/whatsapp-webhook`;
  } catch {
    return "";
  }
}

export const connectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const {
      evoCreateInstance,
      evoConnect,
      evoSetWebhook,
      evoState,
    } = await import("./evolution.server");

    const instanceName = deriveInstanceName(userId);
    const webhookUrl = buildWebhookUrl();

    // upsert da linha
    await supabase
      .from("whatsapp_instances")
      .upsert(
        { user_id: userId, instance_name: instanceName, status: "connecting" },
        { onConflict: "user_id" },
      );

    // tenta criar (idempotente: se já existir, ignora)
    try {
      await evoCreateInstance(instanceName, webhookUrl);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (!/exists|already/i.test(msg)) {
        // se o erro não é "já existe", reemite
        // mas continuamos pra tentar reconectar
        console.warn("[evolution.create]", msg);
      }
    }

    // garante webhook configurado
    if (webhookUrl) {
      try { await evoSetWebhook(instanceName, webhookUrl); } catch (e) { console.warn("[evolution.setWebhook]", e); }
    }

    // tenta gerar QR
    let qrBase64: string | null = null;
    try {
      const qr = await evoConnect(instanceName);
      qrBase64 = qr?.base64 ?? null;
    } catch (e) {
      console.warn("[evolution.connect]", e);
    }

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
    const { evoState, evoFetchNumberFromInstance, evoSetWebhook } = await import("./evolution.server");

    const { data: row } = await supabase
      .from("whatsapp_instances")
      .select("instance_name,status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) return { status: "disconnected", state: null };

    let state: string | null = null;
    try {
      const s = await evoState(row.instance_name);
      state = s?.instance?.state || (s as any)?.state || null;
    } catch (e) {
      console.warn("[evolution.state]", e);
    }

    const newStatus =
      state === "open" ? "connected" : state === "connecting" ? "connecting" : "disconnected";

    let numero: string | null = null;
    if (newStatus === "connected") {
      numero = await evoFetchNumberFromInstance(row.instance_name);
      // Garante webhook (caso a instância tenha sido recriada)
      const webhookUrl = buildWebhookUrl();
      if (webhookUrl) {
        try { await evoSetWebhook(row.instance_name, webhookUrl); } catch {}
      }
    }

    await supabase
      .from("whatsapp_instances")
      .update({ status: newStatus, ...(numero ? { numero } : {}) })
      .eq("user_id", userId);

    return { status: newStatus, state, numero };
  });

export const disconnectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { evoLogout } = await import("./evolution.server");
    const { data: row } = await supabase
      .from("whatsapp_instances")
      .select("instance_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (row) {
      try { await evoLogout(row.instance_name); } catch (e) { console.warn("[evolution.logout]", e); }
      await supabase
        .from("whatsapp_instances")
        .update({ status: "disconnected" })
        .eq("user_id", userId);
    }
    return { ok: true };
  });

export const testAiReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => d)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { lovableAiChat } = await import("./lovable-ai.server");
    const { buildSystemPrompt } = await import("./ai-prompt");
    const { data: cfg } = await supabase
      .from("agent_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const system = buildSystemPrompt(cfg ?? {});
    const reply = await lovableAiChat([
      { role: "system", content: system },
      { role: "user", content: data.message },
    ]);
    return { reply, system };
  });
