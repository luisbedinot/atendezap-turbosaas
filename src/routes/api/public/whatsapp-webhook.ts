import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/whatsapp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload: any = await request.json().catch(() => ({}));
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { evoSendText, evoSendPresence } = await import("@/lib/evolution.server");
          const { lovableAiChat } = await import("@/lib/lovable-ai.server");
          const { buildSystemPrompt, parseAiOutput } = await import("@/lib/ai-prompt");

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

          const insertedAt = new Date().toISOString();
          const { data: inserted } = await supabaseAdmin
            .from("mensagens")
            .insert({
              company_id: companyId,
              user_id: userId,
              numero: number,
              contato_nome: pushName ?? null,
              direcao: "entrada",
              autor: "contato",
              texto: text,
              created_at: insertedAt,
            })
            .select("id, created_at")
            .maybeSingle();
          const myCreatedAt = inserted?.created_at || insertedAt;

          const { data: cfg } = await supabaseAdmin
            .from("agent_config")
            .select("*")
            .eq("company_id", companyId)
            .maybeSingle();

          const palavraPausar = (cfg?.palavra_pausar || "/pausar").toLowerCase().trim();
          const palavraDespausar = (cfg?.palavra_despausar || "/despausar").toLowerCase().trim();
          const lower = text.toLowerCase().trim();

          // Carrega etapas e produtos da company (uma vez)
          const [{ data: stagesRows }, { data: produtosRows }] = await Promise.all([
            supabaseAdmin
              .from("crm_stage")
              .select("id, nome, tipo, ordem")
              .eq("company_id", companyId)
              .order("ordem", { ascending: true }),
            supabaseAdmin
              .from("produto")
              .select("nome, preco, descricao, ativo, ordem")
              .eq("company_id", companyId)
              .eq("ativo", true)
              .order("ordem", { ascending: true }),
          ]);
          const stages = (stagesRows ?? []) as Array<{ id: string; nome: string; tipo: "normal" | "ganho" | "perda" }>;
          const produtos = (produtosRows ?? []).map((p: any) => ({
            nome: p.nome,
            preco: p.preco,
            descricao: p.descricao,
          }));

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
            await upsertCard(supabaseAdmin, companyId, userId, number, pushName, text, stages);
            return new Response("paused-contact", { status: 200 });
          }

          const bufferSec = Math.max(0, Math.min(20, Number(cfg?.segundos_buffer ?? 8)));
          if (bufferSec > 0) {
            await new Promise((r) => setTimeout(r, bufferSec * 1000));
          }

          const { data: newer } = await supabaseAdmin
            .from("mensagens")
            .select("id, created_at")
            .eq("company_id", companyId)
            .eq("numero", number)
            .eq("direcao", "entrada")
            .gt("created_at", myCreatedAt)
            .limit(1);
          if (newer && newer.length > 0) {
            await upsertCard(supabaseAdmin, companyId, userId, number, pushName, text, stages);
            return new Response("superseded", { status: 200 });
          }

          const { data: humanRecent } = await supabaseAdmin
            .from("mensagens")
            .select("id, created_at, autor")
            .eq("company_id", companyId)
            .eq("numero", number)
            .eq("direcao", "saida")
            .eq("autor", "humano")
            .gte("created_at", new Date(Date.now() - 90_000).toISOString())
            .limit(1);
          if (humanRecent && humanRecent.length > 0) {
            await upsertCard(supabaseAdmin, companyId, userId, number, pushName, text, stages);
            return new Response("human-active", { status: 200 });
          }

          const { data: histDesc } = await supabaseAdmin
            .from("mensagens")
            .select("autor,direcao,texto,created_at")
            .eq("company_id", companyId)
            .eq("numero", number)
            .order("created_at", { ascending: false })
            .limit(25);
          const historico = (histDesc ?? []).slice().reverse();

          const { data: cardRow } = await supabaseAdmin
            .from("crm_cards")
            .select("status, nome, stage_id")
            .eq("company_id", companyId)
            .eq("numero", number)
            .maybeSingle();
          const estagioAtual = cardRow?.status || stages[0]?.nome || "Conversas";
          const resumoContato = `${cardRow?.nome || pushName || "Contato"} (${number}), ${historico.length} mensagens trocadas`;

          const responderEmPartes = cfg?.responder_em_partes ?? true;
          const system = buildSystemPrompt(cfg ?? {}, {
            responderEmPartes,
            estagioAtual,
            resumoContato,
            produtos,
            stages: stages.map((s) => ({ nome: s.nome, tipo: s.tipo })),
          });

          const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: system },
            ...historico.map((m) => ({
              role: (m.direcao === "entrada" ? "user" : "assistant") as "user" | "assistant",
              content: m.texto,
            })),
          ];
          if (!messages.length || messages[messages.length - 1].role !== "user") {
            messages.push({ role: "user", content: text });
          }

          let rawReply = "";
          try {
            rawReply = await lovableAiChat(messages);
          } catch (e: any) {
            console.error("[ai]", e?.message);
          }

          const { parts, stage } = parseAiOutput(rawReply, stages.map((s) => ({ nome: s.nome, tipo: s.tipo })));
          const finalParts = responderEmPartes ? parts : [parts.join(" ")];

          for (let i = 0; i < finalParts.length; i++) {
            const part = finalParts[i];
            if (!part) continue;
            try {
              const typingMs = Math.min(3000, 1200 + Math.floor(part.length * 35));
              await evoSendPresence(instanceName, number, "composing", typingMs);
              await new Promise((r) => setTimeout(r, typingMs));
              await evoSendText(instanceName, number, part);
              await supabaseAdmin.from("mensagens").insert({
                company_id: companyId,
                user_id: userId,
                numero: number,
                contato_nome: pushName ?? null,
                direcao: "saida",
                autor: "ia",
                texto: part,
              });
              if (i < finalParts.length - 1) {
                await new Promise((r) => setTimeout(r, 700 + Math.floor(Math.random() * 800)));
              }
            } catch (e: any) {
              console.error("[send]", e?.message);
            }
          }

          await upsertCard(
            supabaseAdmin,
            companyId,
            userId,
            number,
            pushName,
            finalParts[finalParts.length - 1] || text,
            stages,
            stage,
          );

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
  stages: Array<{ id: string; nome: string; tipo: "normal" | "ganho" | "perda" }>,
  proposedStageName?: string | null,
) {
  const { data: existing } = await admin
    .from("crm_cards")
    .select("status, nome, stage_id")
    .eq("company_id", companyId)
    .eq("numero", numero)
    .maybeSingle();

  const stageByName = new Map(stages.map((s) => [s.nome.toLowerCase(), s]));
  const stageById = new Map(stages.map((s) => [s.id, s]));

  const currentStage = existing?.stage_id ? stageById.get(existing.stage_id) : undefined;
  const currentTipo = currentStage?.tipo ?? (existing?.status ? stageByName.get(String(existing.status).toLowerCase())?.tipo : undefined);
  const isLocked = currentTipo === "ganho" || currentTipo === "perda";

  const proposed = proposedStageName ? stageByName.get(proposedStageName.toLowerCase()) : undefined;

  let finalStage = currentStage;
  if (proposed && !isLocked) finalStage = proposed;
  if (!finalStage) finalStage = stages[0]; // fallback

  const payload: any = {
    company_id: companyId,
    user_id: userId,
    numero,
    nome: existing?.nome || nome || null,
    ultima_mensagem: ultimaMensagem.slice(0, 240),
    ultima_em: new Date().toISOString(),
  };
  if (finalStage) {
    payload.stage_id = finalStage.id;
    payload.status = finalStage.nome;
  } else if (existing?.status) {
    payload.status = existing.status;
  } else {
    payload.status = "Conversas";
  }

  await admin
    .from("crm_cards")
    .upsert(payload, { onConflict: "company_id,numero" });
}
