import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { brand } from "@/config/brand";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { demoAgentConfig } from "@/lib/demo-data";
import { buildSystemPrompt } from "@/lib/ai-prompt";

export const Route = createFileRoute("/demo/agente")({
  head: () => ({ meta: [{ title: `${brand.name} — Agente IA (demo)` }] }),
  component: AgenteDemo,
});

const DEMO_REPLIES = [
  "Oi! Tudo bem? 👋",
  "Entregamos sim na sua região!",
  "Quer ver o cardápio?",
];

function AgenteDemo() {
  const c = { ...demoAgentConfig, segundos_buffer: 8, responder_em_partes: true };
  const [testMsg, setTestMsg] = useState("Oi, vocês entregam aqui na minha região?");
  const [testReply, setTestReply] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  function runTest() {
    setTesting(true); setTestReply([]);
    setTimeout(() => { setTestReply(DEMO_REPLIES); setTesting(false); }, 700);
  }

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Agente IA</h1>
          <p className="text-xs text-muted-foreground">Configuração de exemplo (somente leitura).</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* FORM */}
        <div className="space-y-5">
          <Section title="Identidade">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome do agente" value={c.nome_agente} />
              <Field label="Nome da empresa" value={c.nome_empresa} />
            </div>
            <Area label="Sobre a empresa" value={c.sobre_empresa} rows={3} />
            <Area label="Produtos / serviços" value={c.produtos_servicos} rows={3} />
          </Section>

          <Section title="Comportamento">
            <Area label="Papel e objetivo" value={c.papel_objetivo} />
            <Area label="Estilo de comunicação" value={c.estilo_comunicacao} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Area label="O que PODE fazer" value={c.pode_fazer} rows={3} />
              <Area label="O que NÃO pode fazer" value={c.nao_pode_fazer} rows={3} />
            </div>
          </Section>

          <Section title="Avançado">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Telefone p/ transferência" value={c.telefone_transferencia} />
              <Field label="Palavra para pausar" value={c.palavra_pausar} />
              <Field label="Palavra para despausar" value={c.palavra_despausar} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Esperar antes de responder</Label>
                <span className="text-xs text-muted-foreground font-mono">{c.segundos_buffer}s</span>
              </div>
              <input type="range" min={0} max={20} step={1} value={c.segundos_buffer} readOnly className="w-full accent-[var(--brand)]" />
              <p className="text-[11px] text-muted-foreground">A IA aguarda esses segundos juntando mensagens caso a pessoa ainda esteja digitando.</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-3">
              <div>
                <div className="text-sm font-semibold">Responder em partes (humanizado)</div>
                <div className="text-[11px] text-muted-foreground">Ligado — divide em 1–3 bolhas curtas</div>
              </div>
              <Switch checked onCheckedChange={() => {}} />
            </div>
          </Section>
        </div>

        {/* PREVIEW + TEST */}
        <div className="space-y-5 lg:sticky lg:top-4 self-start">
          <Section title="Prompt gerado" icon={<Bot className="size-3.5" />}>
            <pre className="rounded-xl border border-border bg-muted p-4 font-mono text-[12px] leading-relaxed text-foreground whitespace-pre-wrap max-h-[360px] overflow-auto">
{buildSystemPrompt(c, { responderEmPartes: true })}
            </pre>
          </Section>

          <Section title="Testar resposta da IA" icon={<Sparkles className="size-3.5" />}>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 min-h-[160px]">
              <div className="flex justify-end">
                <div className="max-w-[78%] bg-muted rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px]">{testMsg}</div>
              </div>
              {testReply.map((p, i) => (
                <div key={i} className="flex justify-start gap-2 items-end">
                  <InitialsAvatar name="IA" size={24} forceGradient="linear-gradient(135deg,#A3E635,#25D366)" />
                  <div className="max-w-[78%] bg-gradient-to-br from-[#1f9d57] to-[#25D366] text-primary-foreground rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] font-medium">
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
                className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]/60"
              />
              <button
                onClick={runTest}
                disabled={testing}
                className="size-10 shrink-0 rounded-full grid place-items-center text-primary-foreground bg-gradient-to-br from-[#00E676] to-[#25D366] disabled:opacity-50"
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
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-display text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-strong)] flex items-center gap-1.5">
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1.5"><Label className="text-[12.5px] text-muted-foreground">{label}</Label><Input value={value} readOnly /></div>;
}
function Area({ label, value, rows = 2 }: { label: string; value: string; rows?: number }) {
  return <div className="space-y-1.5"><Label className="text-[12.5px] text-muted-foreground">{label}</Label><Textarea value={value} readOnly rows={rows} /></div>;
}
