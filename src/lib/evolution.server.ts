import QRCode from "qrcode";

// Wrapper server-only para a Evolution API v2.
// Arquivo *.server.ts é bloqueado do bundle client — seguro para fallback.
// Prioridade: process.env (override via Lovable Cloud Secrets) → fallback hardcoded.
// O fallback garante que clones do projeto herdem a integração sem precisar configurar.

const FALLBACK_EVOLUTION_URL = "http://187.77.59.202:8080";
const FALLBACK_EVOLUTION_KEY = "jEpxtxy82V61ueUen5AinQWpa6SSNwLF";
const SUPPORT_SUFFIX = " Se persistir, fale com o suporte: https://wa.me/5551982913030";

function env() {
  const url = process.env.EVOLUTION_API_URL || FALLBACK_EVOLUTION_URL;
  const key = process.env.EVOLUTION_API_KEY || FALLBACK_EVOLUTION_KEY;
  return { url: url.replace(/\/+$/, ""), key };
}

async function evo<T = any>(
  path: string,
  init: RequestInit & { json?: any } = {},
): Promise<T> {
  const { url, key } = env();
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  } catch (e: any) {
    throw new Error(`Evolution API indisponível: ${e?.message || "falha de rede"}.${SUPPORT_SUFFIX}`);
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
    throw new Error(`Evolution API: ${msg}.${SUPPORT_SUFFIX}`);
  }
  return data as T;
}

export async function evoCreateInstance(instanceName: string, webhookUrl?: string) {
  // Evolution v2: POST /instance/create
  const body: any = {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
  };
  if (webhookUrl) {
    body.webhook = {
      url: webhookUrl,
      byEvents: false,
      base64: false,
      events: ["MESSAGES_UPSERT"],
    };
  }
  return evo(`/instance/create`, { method: "POST", json: body });
}

export async function evoConnect(instanceName: string): Promise<{ base64?: string; code?: string; pairingCode?: string }> {
  // GET /instance/connect/{instance} → { base64, code, pairingCode }
  return evo(`/instance/connect/${encodeURIComponent(instanceName)}`, { method: "GET" });
}

function asImageDataUrl(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  if (text.startsWith("data:image/")) return text;
  const base64 = text.includes("base64,") ? text.split("base64,").pop()?.trim() : text;
  if (base64 && base64.length > 120 && /^[A-Za-z0-9+/=\s]+$/.test(base64)) {
    return `data:image/png;base64,${base64.replace(/\s/g, "")}`;
  }
  return null;
}

function extractQrCode(payload: any): string | null {
  const candidates = [
    payload?.code,
    payload?.qrcode?.code,
    payload?.qrCode,
    payload?.qrcode,
    payload?.qr,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim() && !asImageDataUrl(value)) return value.trim();
  }
  return null;
}

export async function evoGetQr(instanceName: string): Promise<{ qrBase64: string | null; code: string | null; pairingCode: string | null }> {
  const payload: any = await evoConnect(instanceName);
  const image =
    asImageDataUrl(payload?.base64) ||
    asImageDataUrl(payload?.qrcode?.base64) ||
    asImageDataUrl(payload?.qr?.base64) ||
    asImageDataUrl(payload?.qrcode) ||
    asImageDataUrl(payload?.qr);
  const code = extractQrCode(payload);

  if (image) return { qrBase64: image, code, pairingCode: payload?.pairingCode ?? payload?.qrcode?.pairingCode ?? null };
  if (code) {
    const qrBase64 = await QRCode.toDataURL(code, { width: 320, margin: 2, errorCorrectionLevel: "M" });
    return { qrBase64, code, pairingCode: payload?.pairingCode ?? payload?.qrcode?.pairingCode ?? null };
  }
  return { qrBase64: null, code: null, pairingCode: payload?.pairingCode ?? payload?.qrcode?.pairingCode ?? null };
}

export async function evoState(instanceName: string): Promise<{ instance?: { state?: string }; state?: string }> {
  return evo(`/instance/connectionState/${encodeURIComponent(instanceName)}`, { method: "GET" });
}

export async function evoSetWebhook(instanceName: string, webhookUrl: string) {
  return evo(`/webhook/set/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    json: {
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ["MESSAGES_UPSERT"],
      },
    },
  });
}

export async function evoSendText(instanceName: string, number: string, text: string) {
  return evo(`/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    json: { number, text },
  });
}

export async function evoSendPresence(instanceName: string, number: string, presence: "composing" | "paused" | "available", delayMs = 1500) {
  try {
    await evo(`/chat/sendPresence/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      json: { number, presence, delay: delayMs },
    });
  } catch {
    // best-effort
  }
}

export async function evoLogout(instanceName: string) {
  return evo(`/instance/logout/${encodeURIComponent(instanceName)}`, { method: "DELETE" });
}

export async function evoDelete(instanceName: string) {
  return evo(`/instance/delete/${encodeURIComponent(instanceName)}`, { method: "DELETE" });
}

export async function evoFetchNumberFromInstance(instanceName: string): Promise<string | null> {
  try {
    const data: any = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`, {
      method: "GET",
    });
    const inst = Array.isArray(data) ? data[0] : data?.[0] ?? data;
    return inst?.instance?.owner || inst?.owner || inst?.number || null;
  } catch {
    return null;
  }
}
