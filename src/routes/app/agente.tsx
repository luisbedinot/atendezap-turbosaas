import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bot, Loader2, Save, Send, Sparkles } from "lucide-react";
import { brand } from "@/config/brand";
import { buildSystemPrompt } from "@/lib/ai-prompt";
import { testAiReply } from "@/lib/evolution.functions";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

export const Route = createFileRoute("/app/agente")({
  head: () => ({ meta: [{ title: `${brand.name} — Agente IA` }] }),
  component: AgentePage,
});

const DEFAULTS = {
  nome_agente: "Atendente Virtual",
  nome_empresa: "",
  papel_objetivo: "Atender clientes, descobrir o que precisam, recomendar com sentido e ajudar a fechar a venda.",
  estilo_comunicacao: "Humano, simpático, consultivo e direto. Mensagens curtas, como gente digita no WhatsApp.",
  sobre_empresa: "",
  produtos_servicos: "",
  pode_fazer: "",
  nao_pode_fazer: "Inventar preço, prazo ou política que não está no prompt. Prometer o que não foi confirmado.",
  telefone_transferencia: "",
  palavra_pausar: "/pausar",
  palavra_despausar: "/despausar",
  segundos_buffer: 8,
  responder_em_partes: true,
};

function AgentePage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const test = useServerFn(testAiReply);
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMsg, setTestMsg] = useState("Oi, vocês entregam aqui na minha região?");
  const [testReply, setTestReply] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      const { data } = await supabase.from("agent_config").select("*").eq("company_id", companyId).maybeSingle();
      if (data) setCfg({ ...DEFAULTS, ...data } as any);
      setLoading(false);
    })();
  }, [companyId]);

  function update<K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) {
    setCfg((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase
      .from("agent_config")
      .upsert({ company_id: companyId, user_id: ctx.user.id, ...cfg }, { onConflict: "company_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuração salva");
  }

  async function runTest() {
    setTesting(true); setTestReply([]);
    try {
      const r = await test({ data: { message: testMsg } });
      const parts = cfg.responder_em_partes ? r.reply.split("|||").map((s) => s.trim()).filter(Boolean) : [r.reply];
      setTestReply(parts);
    } catch (e: any) { toast.error(e?.message || "Falha no teste"); }
    finally { setTesting(false); }
  }

  if (loading) return <div className="grid place-items-center h-40 text-muted-foreground"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Agente IA</h1>
          <p className="text-xs text-muted-foreground">Configure como sua IA conversa.</p>
        </div>
        <Button onClick={save} disabled={saving} size="sm" className="shrink-0">
          {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />} Salvar
        </Button>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* FORM */}
        <div className="space-y-5">
          <Section title="Identidade">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome do agente" value={cfg.nome_agente} onChange={(v) => update("nome_agente", v)} />
              <Field label="Nome da empresa" value={cfg.nome_empresa} onChange={(v) => update("nome_empresa", v)} />
            </div>
            <Area label="Sobre a empresa" value={cfg.sobre_empresa} onChange={(v) => update("sobre_empresa", v)} rows={3} />
            <Area label="Produtos / serviços" value={cfg.produtos_servicos} onChange={(v) => update("produtos_servicos", v)} rows={3} />
          </Section>

          <Section title="Comportamento">
            <Area label="Papel e objetivo" value={cfg.papel_objetivo} onChange={(v) => update("papel_objetivo", v)} />
            <Area label="Estilo de comunicação" value={cfg.estilo_comunicacao} onChange={(v) => update("estilo_comunicacao", v)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Area label="O que PODE fazer" value={cfg.pode_fazer} onChange={(v) => update("pode_fazer", v)} rows={3} />
              <Area label="O que NÃO pode fazer" value={cfg.nao_pode_fazer} onChange={(v) => update("nao_pode_fazer", v)} rows={3} />
            </div>
          </Section>

          <Section title="Avançado">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Telefone p/ transferência" value={cfg.telefone_transferencia} onChange={(v) => update("telefone_transferencia", v)} />
              <Field label="Palavra para pausar" value={cfg.palavra_pausar} onChange={(v) => update("palavra_pausar", v)} />
              <Field label="Palavra para despausar" value={cfg.palavra_despausar} onChange={(v) => update("palavra_despausar", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Esperar antes de responder</Label>
                <span className="text-xs text-muted-foreground font-mono">{cfg.segundos_buffer}s</span>
              </div>
              <input
                type="range" min={0} max={20} step={1}
                value={cfg.segundos_buffer}
                onChange={(e) => update("segundos_buffer", Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
              <p className="text-[11px] text-muted-foreground">
                A IA aguarda esses segundos juntando mensagens caso a pessoa ainda esteja digitando.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/8 bg-[var(--panel-2)] p-3">
              <div>
                <div className="text-sm font-semibold">Responder em partes (humanizado)</div>
                <div className="text-[11px] text-muted-foreground">
                  {cfg.responder_em_partes ? "Ligado — divide em 1–3 bolhas curtas" : "Desligado — uma mensagem só"}
                </div>
              </div>
              <Switch checked={!!cfg.responder_em_partes} onCheckedChange={(v) => update("responder_em_partes", v)} />
            </div>
          </Section>
        </div>

        {/* PREVIEW + TEST */}
        <div className="space-y-5 lg:sticky lg:top-4 self-start">
          <Section title="Prompt gerado" icon={<Bot className="size-3.5" />}>
            <pre className="rounded-xl border border-white/8 bg-[#06100b] p-4 font-mono text-[12px] leading-relaxed text-[#bfe9cf] whitespace-pre-wrap max-h-[360px] overflow-auto">
{buildSystemPrompt(cfg, { responderEmPartes: cfg.responder_em_partes })}
            </pre>
          </Section>

          <Section title="Testar resposta da IA" icon={<Sparkles className="size-3.5" />}>
            <div className="rounded-xl border border-white/8 bg-[linear-gradient(180deg,#0a120d,#0b1410)] p-4 space-y-2 min-h-[160px]">
              <div className="flex justify-end">
                <div className="max-w-[78%] bg-[#15241c] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px]">{testMsg}</div>
              </div>
              {testReply.map((p, i) => (
                <div key={i} className="flex justify-start gap-2 items-end">
                  <InitialsAvatar name="IA" size={24} forceGradient="linear-gradient(135deg,#A3E635,#25D366)" />
                  <div className="max-w-[78%] bg-gradient-to-br from-[#1f9d57] to-[#25D366] text-[#04140B] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] font-medium">
                    <span className="block text-[9.5px] font-bold opacity-80 mb-1 uppercase tracking-wider">⚡ Agente IA</span>
                    {p}
                  </div>
                </div>
              ))}
              {testing && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> pensando…</div>}
            </div>
            <div className="flex gap-2">
              <input
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                placeholder="Mensagem do cliente…"
                className="flex-1 bg-[var(--background)] border border-white/8 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]/60"
              />
              <button
                onClick={runTest}
                disabled={testing}
                className="size-10 shrink-0 rounded-full grid place-items-center text-[#04140B] bg-gradient-to-br from-[#00E676] to-[#25D366] disabled:opacity-50"
              >
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-5 space-y-3">
      <h3 className="font-display text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-strong)] flex items-center gap-1.5">
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-1.5"><Label className="text-[12.5px] text-muted-foreground">{label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Area({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return <div className="space-y-1.5"><Label className="text-[12.5px] text-muted-foreground">{label}</Label><Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} /></div>;
}
