import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GeneratedAgentConfig = {
  nome_agente: string;
  nome_empresa: string;
  segmento: string;
  regiao_horario: string;
  descricao_negocio: string;
  diferenciais: string;
  publico_alvo: string;
  sobre_empresa: string;
  produtos_servicos: string;
  papel_objetivo: string;
  estilo_comunicacao: string;
  apresentacao: string;
  ofertas: string;
  como_vender: string;
  objecoes: string;
  formas_pagamento: string;
  faq: string;
  politicas: string;
  posvenda_msg: string;
  pode_fazer: string;
  nao_pode_fazer: string;
};

const FIELDS: (keyof GeneratedAgentConfig)[] = [
  "nome_agente","nome_empresa","segmento","regiao_horario","descricao_negocio",
  "diferenciais","publico_alvo","sobre_empresa","produtos_servicos","papel_objetivo",
  "estilo_comunicacao","apresentacao","ofertas","como_vender","objecoes",
  "formas_pagamento","faq","politicas","posvenda_msg","pode_fazer","nao_pode_fazer",
];

function extractJson(raw: string): any {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  try { return JSON.parse(trimmed); } catch {}
  const m = trimmed.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  throw new Error("A IA não retornou JSON válido. Tente novamente com uma descrição mais detalhada.");
}

export const generateAgentConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { descricao: string }) => {
    if (!d?.descricao || d.descricao.trim().length < 20) {
      throw new Error("Descreva seu negócio com pelo menos algumas frases (mín. 20 caracteres).");
    }
    return { descricao: d.descricao.trim().slice(0, 8000) };
  })
  .handler(async ({ data }) => {
    const { lovableAiChat } = await import("./lovable-ai.server");
    const { buildSystemPrompt } = await import("./ai-prompt");

    const system = `Você é um especialista em montar agentes de atendimento via WhatsApp.
A partir da descrição do negócio enviada pelo usuário, gere uma configuração COMPLETA do agente.
Responda APENAS com um objeto JSON válido (sem markdown, sem comentários), com EXATAMENTE estas chaves (todas strings, em português do Brasil):
${FIELDS.map((f) => `- ${f}`).join("\n")}

Regras:
- Se a descrição não trouxer um nome de agente, invente um simpático e curto (ex: "Lia", "Bia", "Tom").
- "papel_objetivo": 1-2 frases sobre o objetivo de atendimento.
- "estilo_comunicacao": 1 frase sobre tom (humano, direto, consultivo etc.).
- "apresentacao": 1ª mensagem que o agente envia ao cliente (curta, com 1 emoji se fizer sentido).
- "produtos_servicos": lista resumida em texto livre.
- "como_vender": passo-a-passo curto (numerado) de como conduzir a venda.
- "objecoes": 2-4 objeções comuns + resposta breve para cada.
- "faq": 3-5 perguntas/respostas frequentes.
- "politicas": políticas básicas (troca, cancelamento, garantia) coerentes com o segmento.
- "posvenda_msg": mensagem curta pós-venda.
- "pode_fazer" / "nao_pode_fazer": listas curtas (1 item por linha).
- Use "" (string vazia) quando faltar informação — NUNCA omita chaves.
- NÃO invente preços específicos se não foram informados; descreva categorias.

Retorne SÓ o JSON.`;

    const raw = await lovableAiChat(
      [
        { role: "system", content: system },
        { role: "user", content: data.descricao },
      ],
      { provider: "gemini", model: "google/gemini-2.5-flash" },
    );

    const parsed = extractJson(raw) as Partial<GeneratedAgentConfig>;
    const config = {} as GeneratedAgentConfig;
    for (const k of FIELDS) {
      const v = parsed?.[k];
      (config as any)[k] = typeof v === "string" ? v : v == null ? "" : String(v);
    }

    const promptPreview = buildSystemPrompt(config as any, {
      responderEmPartes: true,
      produtos: [],
    });

    return { config, promptPreview };
  });
