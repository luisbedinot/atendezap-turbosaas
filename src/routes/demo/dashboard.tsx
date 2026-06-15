import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, KanbanSquare, MessageSquareText, Smartphone } from "lucide-react";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/demo/dashboard")({
  head: () => ({ meta: [{ title: `${brand.name} — Demonstração` }] }),
  component: DemoDashboard,
});

function DemoDashboard() {
  const stats = { conversas: 24, negociando: 8, ganho: 6, perda: 2 };
  const mensagens = [
    { nome: "Maria S.", numero: "5511999999991", texto: "Quero saber sobre o plano Pro", tipo: "recebida", quando: new Date(Date.now() - 1000 * 60 * 5) },
    { nome: "João P.", numero: "5511999999992", texto: "Perfeito! Pode fechar.", tipo: "IA", quando: new Date(Date.now() - 1000 * 60 * 20) },
    { nome: "Ana L.", numero: "5511999999993", texto: "Vou pensar e te aviso.", tipo: "recebida", quando: new Date(Date.now() - 1000 * 60 * 45) },
  ];
  return (
    <div className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard (demo)</h1>
          <p className="text-sm text-muted-foreground">Veja como fica seu painel.</p>
        </div>
        <Badge variant="outline" className="gap-2 py-1.5 px-3"><span className="size-2 rounded-full bg-primary" /> Conectado</Badge>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat icon={<MessageSquareText className="size-4" />} label="Conversas" value={stats.conversas} />
        <Stat icon={<Bot className="size-4" />} label="Em negociação" value={stats.negociando} />
        <Stat icon={<KanbanSquare className="size-4" />} label="Ganhos" value={stats.ganho} accent />
        <Stat icon={<Smartphone className="size-4" />} label="Perdas" value={stats.perda} />
      </div>
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Últimas mensagens</h2>
        <ul className="divide-y">
          {mensagens.map((m, i) => (
            <li key={i} className="py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.nome} <span className="text-muted-foreground">· {m.tipo}</span></div>
                <div className="text-sm text-muted-foreground truncate">{m.texto}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{m.quando.toLocaleString("pt-BR")}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}
