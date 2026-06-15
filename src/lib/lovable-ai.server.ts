// Chamada simples à Lovable AI Gateway (chat completions).
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function lovableAiChat(
  messages: ChatMsg[],
  model = "google/gemini-2.5-flash",
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente em alguns minutos.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
    throw new Error(`Lovable AI: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.toString().trim() || "";
}
