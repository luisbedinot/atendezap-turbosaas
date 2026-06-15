import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { brand } from "@/config/brand";
import { Bot } from "lucide-react";
import { demoAgentConfig } from "@/lib/demo-data";
import { buildSystemPrompt } from "@/lib/ai-prompt";

export const Route = createFileRoute("/demo/agente")({
  head: () => ({ meta: [{ title: `${brand.name} — Agente IA (demo)` }] }),
  component: AgenteDemo,
});

function AgenteDemo() {
  const c = demoAgentConfig;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agente IA</h1>
        <p className="text-sm text-muted-foreground">Configuração de exemplo (somente leitura).</p>
      </div>
      <Card className="p-5 space-y-4 opacity-95 pointer-events-none">
        <div className="grid md:grid-cols-2 gap-4">
          <Box label="Nome do agente" value={c.nome_agente} />
          <Box label="Nome da empresa" value={c.nome_empresa} />
        </div>
        <Area label="Papel e objetivo" value={c.papel_objetivo} />
        <Area label="Estilo de comunicação" value={c.estilo_comunicacao} />
        <Area label="Sobre a empresa" value={c.sobre_empresa} rows={3} />
        <Area label="Produtos / serviços" value={c.produtos_servicos} rows={3} />
        <div className="grid md:grid-cols-2 gap-4">
          <Area label="O que PODE fazer" value={c.pode_fazer} rows={3} />
          <Area label="O que NÃO pode fazer" value={c.nao_pode_fazer} rows={3} />
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold mb-1 flex items-center gap-2"><Bot className="size-4" /> Prompt gerado</h2>
        <p className="text-xs text-muted-foreground mb-3">É exatamente isso que a IA recebe.</p>
        <pre className="text-xs bg-muted/60 rounded-md p-3 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
{buildSystemPrompt(c)}
        </pre>
      </Card>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input value={value} readOnly /></div>;
}
function Area({ label, value, rows = 2 }: { label: string; value: string; rows?: number }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Textarea value={value} readOnly rows={rows} /></div>;
}
