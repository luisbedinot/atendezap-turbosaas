import { createFileRoute } from "@tanstack/react-router";

// Webhook PÚBLICO chamado pelo Evolution API quando chega uma mensagem.
// Identifica o dono (company) via instance_name.
export const Route = createFileRoute("/api/public/whatsapp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload: any = await request.json().catch(() => ({}));
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { evoSendText } = await import("@/lib/evolution.server");
          const { lovableAiChat } = await import("@/lib/lovable-ai.server");
          const { buildSystemPrompt, classifyStagePromptInstruction } = await import("@/lib/ai-prompt");

          const event: string | undefined = payload?.event;
          const instanceName: string | undefined =
            payload?.instance || payload?.instanceName || payload?.data?.instance;

          if (!instanceName) return new Response("ok", { status: 200 });
          if (event && event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
            return new Response("ignored", { status: 200 });
          }

          const data = payload?.data ?? payload;
          const key = data?.key ?? {};
          const fromMe: boolean = !!key.fromMe;
          const remoteJid: string = key.remoteJid || "";
          if (!remoteJid) return new Response("no jid", { status: 200 });
          if (remoteJid.endsWith("@g.us")) return new Response("group", { status: 200 });
          if (fromMe) return new Response("fromMe", { status: 200 });

          const number = remoteJid.split("@")[0];
          const pushName: string | undefined = data?.pushName;
          const msg = data?.message ?? {};
          const text: string =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            "";
          if (!text || !text.trim()) return new Response("no text", { status: 200 });

          const { data: inst } = await supabaseAdmin
            .from("whatsapp_instances")
            .select("company_id, user_id, instance_name")
            .eq("instance_name", instanceName)
            .maybeSingle();
          if (!inst) return new Response("unknown instance", { status: 200 });
          const companyId = (inst as any).company_id as string;
          const userId = (inst as any).user_id as string;

          await supabaseAdmin.from("mensagens").insert({
            company_id: companyId,
            user_id: userId,
            numero: number,
            contato_nome: pushName ?? null,
            direcao: "entrada",
            autor: "contato",
            texto: text,
          });

          const { data: cfg } = await supabaseAdmin
            .from("agent_config")
            .select("*")
            .eq("company_id", companyId)
            .maybeSingle();
          const palavraPausar = (cfg?.palavra_pausar || "/pausar").toLowerCase().trim();
          const palavraDespausar = (cfg?.palavra_despausar || "/despausar").toLowerCase().trim();
          const lower = text.toLowerCase().trim();

          if (lower === palavraPausar) {
            await supabaseAdmin
              .from("contact_pause")
              .upsert({ company_id: companyId, user_id: userId, numero: number, pausado: true }, { onConflict: "company_id,numero" });
            return new Response("paused", { status: 200 });
          }
          if (lower === palavraDespausar) {
            await supabaseAdmin
              .from("contact_pause")
              .upsert({ company_id: companyId, user_id: userId, numero: number, pausado: false }, { onConflict: "company_id,numero" });
            return new Response("resumed", { status: 200 });
          }
          const { data: pauseRow } = await supabaseAdmin
            .from("contact_pause")
            .select("pausado")
            .eq("company_id", companyId)
            .eq("numero", number)
            .maybeSingle();
          if (pauseRow?.pausado) {
            await upsertCard(supabaseAdmin, companyId, userId, number, pushName, text);
            return new Response("paused-contact", { status: 200 });
          }

          const { data: hist } = await supabaseAdmin
            .from("mensagens")
            .select("autor,direcao,texto,created_at")
            .eq("company_id", companyId)
            .eq("numero", number)
            .order("created_at", { ascending: false })
            .limit(8);
          const historico = (hist ?? []).slice().reverse();

          const system = buildSystemPrompt(cfg ?? {});
          const messages = [
            { role: "system" as const, content: system },
            ...historico.map((m) => ({
              role: (m.direcao === "entrada" ? "user" : "assistant") as "user" | "assistant",
              content: m.texto,
            })),
          ];
          if (!messages.length || messages[messages.length - 1].role !== "user") {
            messages.push({ role: "user", content: text });
          }

          let reply = "";
          try {
            reply = await lovableAiChat(messages);
          } catch (e: any) {
            console.error("[ai]", e?.message);
          }

          if (reply) {
            try {
              await evoSendText(instanceName, number, reply);
              await supabaseAdmin.from("mensagens").insert({
                company_id: companyId,
                user_id: userId,
                numero: number,
                contato_nome: pushName ?? null,
                direcao: "saida",
                autor: "ia",
                texto: reply,
              });
            } catch (e: any) {
              console.error("[send]", e?.message);
            }
          }

          let stage: "conversas" | "negociando" | "ganho" | "perda" = "conversas";
          try {
            const cls = await lovableAiChat(
              [
                { role: "system", content: classifyStagePromptInstruction() },
                {
                  role: "user",
                  content: historico
                    .map((m) => `${m.direcao === "entrada" ? "Cliente" : "Atendente"}: ${m.texto}`)
                    .concat(reply ? [`Atendente: ${reply}`] : [])
                    .join("\n"),
                },
              ],
              "google/gemini-2.5-flash-lite",
            );
            const w = cls.toLowerCase().replace(/[^a-záéíóúãõ]/g, "");
            if (w.includes("ganho")) stage = "ganho";
            else if (w.includes("perda")) stage = "perda";
            else if (w.includes("negoc")) stage = "negociando";
            else stage = "conversas";
          } catch (e: any) {
            console.warn("[classify]", e?.message);
          }

          await upsertCard(supabaseAdmin, companyId, userId, number, pushName, reply || text, stage);

          return new Response("ok", { status: 200 });
        } catch (e: any) {
          console.error("[webhook]", e?.message, e?.stack);
          return new Response("error", { status: 200 });
        }
      },
      GET: async () => new Response("AtendeZap webhook online", { status: 200 }),
    },
  },
});

async function upsertCard(
  admin: any,
  companyId: string,
  userId: string,
  numero: string,
  nome: string | undefined,
  ultimaMensagem: string,
  status?: "conversas" | "negociando" | "ganho" | "perda",
) {
  const { data: existing } = await admin
    .from("crm_cards")
    .select("status,nome")
    .eq("company_id", companyId)
    .eq("numero", numero)
    .maybeSingle();
  const finalStatus =
    status && !(existing?.status === "ganho" || existing?.status === "perda")
      ? status
      : existing?.status || status || "conversas";
  await admin
    .from("crm_cards")
    .upsert(
      {
        company_id: companyId,
        user_id: userId,
        numero,
        nome: existing?.nome || nome || null,
        status: finalStatus,
        ultima_mensagem: ultimaMensagem.slice(0, 240),
        ultima_em: new Date().toISOString(),
      },
      { onConflict: "company_id,numero" },
    );
}
