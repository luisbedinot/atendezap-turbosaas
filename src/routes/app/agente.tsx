import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bot, Loader2, Save, Sparkles } from "lucide-react";
import { brand } from "@/config/brand";
import { buildSystemPrompt } from "@/lib/ai-prompt";
import { testAiReply } from "@/lib/evolution.functions";

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
  const [testReply, setTestReply] = useState<string>("");
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
    setTesting(true); setTestReply("");
    try {
      const r = await test({ data: { message: testMsg } });
      setTestReply(r.reply);
    } catch (e: any) { toast.error(e?.message || "Falha no teste"); }
    finally { setTesting(false); }
  }

  if (loading) return <div className="grid place-items-center h-40 text-muted-foreground"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agente IA</h1>
        <p className="text-sm text-muted-foreground">Configure como sua IA conversa.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nome do agente" value={cfg.nome_agente} onChange={(v) => update("nome_agente", v)} />
          <Field label="Nome da empresa" value={cfg.nome_empresa} onChange={(v) => update("nome_empresa", v)} />
        </div>
        <Area label="Papel e objetivo" value={cfg.papel_objetivo} onChange={(v) => update("papel_objetivo", v)} />
        <Area label="Estilo de comunicação" value={cfg.estilo_comunicacao} onChange={(v) => update("estilo_comunicacao", v)} />
        <Area label="Sobre a empresa" value={cfg.sobre_empresa} onChange={(v) => update("sobre_empresa", v)} rows={3} />
        <Area label="Produtos / serviços" value={cfg.produtos_servicos} onChange={(v) => update("produtos_servicos", v)} rows={3} />
        <div className="grid md:grid-cols-2 gap-4">
          <Area label="O que PODE fazer" value={cfg.pode_fazer} onChange={(v) => update("pode_fazer", v)} rows={3} />
          <Area label="O que NÃO pode fazer" value={cfg.nao_pode_fazer} onChange={(v) => update("nao_pode_fazer", v)} rows={3} />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Telefone p/ transferência" value={cfg.telefone_transferencia} onChange={(v) => update("telefone_transferencia", v)} />
          <Field label="Palavra para pausar" value={cfg.palavra_pausar} onChange={(v) => update("palavra_pausar", v)} />
          <Field label="Palavra para despausar" value={cfg.palavra_despausar} onChange={(v) => update("palavra_despausar", v)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1.5">
            <Label>Segundos de espera (buffer)</Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={cfg.segundos_buffer}
              onChange={(e) => update("segundos_buffer", Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            />
            <p className="text-xs text-muted-foreground">
              A IA aguarda esses segundos antes de responder, juntando as mensagens caso a pessoa ainda esteja digitando. Padrão: 8s.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Responder em partes (humanizado)</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                checked={!!cfg.responder_em_partes}
                onCheckedChange={(v) => update("responder_em_partes", v)}
              />
              <span className="text-sm text-muted-foreground">
                {cfg.responder_em_partes ? "Ligado — responde em 1–3 bolhas curtas" : "Desligado — uma mensagem só"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
            Salvar
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-1 flex items-center gap-2"><Bot className="size-4" /> Prompt gerado</h2>
        <p className="text-xs text-muted-foreground mb-3">É exatamente isso que a IA recebe.</p>
        <pre className="text-xs bg-muted/60 rounded-md p-3 whitespace-pre-wrap font-mono max-h-72 overflow-auto">
{buildSystemPrompt(cfg)}
        </pre>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="size-4" /> Testar resposta</h2>
        <Textarea value={testMsg} onChange={(e) => setTestMsg(e.target.value)} rows={2} />
        <div className="flex justify-end">
          <Button onClick={runTest} disabled={testing}>
            {testing ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Sparkles className="size-4 mr-1.5" />}
            Testar
          </Button>
        </div>
        {testReply && (
          <div className="rounded-md border bg-primary/5 p-3 text-sm whitespace-pre-wrap">
            <div className="text-xs text-muted-foreground mb-1">Resposta da IA</div>
            {testReply}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Area({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} /></div>;
}
