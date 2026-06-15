export interface AgentConfig {
  nome_agente: string;
  nome_empresa: string;
  papel_objetivo: string;
  estilo_comunicacao: string;
  sobre_empresa: string;
  produtos_servicos: string;
  pode_fazer: string;
  nao_pode_fazer: string;
  telefone_transferencia: string;
  palavra_pausar: string;
  palavra_despausar: string;
}

export function buildSystemPrompt(c: Partial<AgentConfig>): string {
  return [
    `Você é ${c.nome_agente || "um atendente virtual"}, atendendo no WhatsApp da empresa ${c.nome_empresa || "(empresa)"}.`,
    `Objetivo: ${c.papel_objetivo || "atender clientes de forma cordial e ajudar a vender."}`,
    `Estilo de comunicação: ${c.estilo_comunicacao || "cordial, profissional e direto."}`,
    c.sobre_empresa ? `Sobre a empresa:\n${c.sobre_empresa}` : "",
    c.produtos_servicos ? `Produtos/serviços:\n${c.produtos_servicos}` : "",
    c.pode_fazer ? `O QUE VOCÊ PODE FAZER:\n${c.pode_fazer}` : "",
    c.nao_pode_fazer ? `O QUE VOCÊ NÃO PODE FAZER:\n${c.nao_pode_fazer}` : "",
    c.telefone_transferencia
      ? `Se o cliente pedir um humano ou precisar de algo fora do seu escopo, oriente a falar com ${c.telefone_transferencia}.`
      : "",
    "Regras gerais:",
    "- Sempre responda em português do Brasil.",
    "- Mensagens curtas (1-4 frases). Sem markdown pesado.",
    "- Nunca invente preços, prazos ou políticas. Se não souber, diga que vai confirmar.",
    "- Seja útil e direto. Não repita a saudação a cada mensagem.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function classifyStagePromptInstruction(): string {
  return (
    "Você é um classificador. Dado o histórico curto de mensagens entre um vendedor e um lead pelo WhatsApp, " +
    "responda APENAS com UMA palavra do conjunto: conversas | negociando | ganho | perda. " +
    "Use 'conversas' para conversa inicial/dúvidas; 'negociando' quando há proposta, preço, prazo ou intenção clara de compra; " +
    "'ganho' quando o cliente confirmou compra/contratação; 'perda' quando ele desistiu, recusou, ou disse que não tem interesse. " +
    "Nunca explique. Apenas a palavra."
  );
}
