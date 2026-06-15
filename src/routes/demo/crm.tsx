import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { brand } from "@/config/brand";
import { demoCards } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/crm")({
  head: () => ({ meta: [{ title: `${brand.name} — CRM (demo)` }] }),
  component: CrmDemo,
});

const COLUMNS = [
  { id: "conversas", label: "Conversas", accent: "bg-blue-500" },
  { id: "negociando", label: "Negociando", accent: "bg-amber-500" },
  { id: "ganho", label: "Ganho", accent: "bg-primary" },
  { id: "perda", label: "Perda", accent: "bg-rose-500" },
] as const;

function CrmDemo() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM Kanban</h1>
        <p className="text-sm text-muted-foreground">A IA também move automaticamente entre as colunas — exemplo.</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const cards = demoCards.filter((c) => c.status === col.id);
          return (
            <div key={col.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${col.accent}`} />
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{cards.length}</span>
              </div>
              <div className="space-y-2 min-h-24">
                {cards.map((c) => (
                  <Card key={c.id} className="p-3">
                    <div className="font-medium text-sm truncate">{c.nome}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.numero}</div>
                    <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{c.ultima_mensagem}</div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">{c.ultima_em.toLocaleString("pt-BR")}</div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
