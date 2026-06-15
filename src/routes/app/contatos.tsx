import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/app/contatos")({
  head: () => ({ meta: [{ title: `${brand.name} — Contatos` }] }),
  component: ContatosPage,
});

type Status = "conversas" | "negociando" | "ganho" | "perda";
const LABELS: Record<Status, string> = { conversas: "Conversas", negociando: "Negociando", ganho: "Ganho", perda: "Perda" };

function ContatosPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<"todos" | Status>("todos");

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      const { data } = await supabase
        .from("crm_cards").select("*")
        .eq("company_id", companyId)
        .order("ultima_em", { ascending: false });
      setCards(data ?? []);
    })();
  }, [companyId]);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (stage !== "todos" && c.status !== stage) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (c.nome ?? "").toLowerCase().includes(q) || c.numero.includes(q);
      }
      return true;
    });
  }, [cards, search, stage]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
        <p className="text-sm text-muted-foreground">Todos os leads gerados pelo WhatsApp.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar por nome ou número…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={stage} onValueChange={(v) => setStage(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estágios</SelectItem>
            <SelectItem value="conversas">Conversas</SelectItem>
            <SelectItem value="negociando">Negociando</SelectItem>
            <SelectItem value="ganho">Ganho</SelectItem>
            <SelectItem value="perda">Perda</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2">
          <div className="col-span-4">Nome</div>
          <div className="col-span-3">Número</div>
          <div className="col-span-2">Estágio</div>
          <div className="col-span-3">Última mensagem</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhum contato encontrado.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => (
              <li key={c.id} className="grid grid-cols-12 px-4 py-3 items-center text-sm">
                <div className="col-span-4 font-medium truncate">{c.nome || "—"}</div>
                <div className="col-span-3 text-muted-foreground truncate">{c.numero}</div>
                <div className="col-span-2"><Badge variant="outline">{LABELS[c.status as Status]}</Badge></div>
                <div className="col-span-3 text-muted-foreground truncate">{c.ultima_mensagem || "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
