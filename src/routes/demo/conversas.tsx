import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { Bot, MessageSquareText, User } from "lucide-react";
import { demoMensagens, type DemoMsg } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/conversas")({
  head: () => ({ meta: [{ title: `${brand.name} — Conversas (demo)` }] }),
  component: ConversasDemo,
});

function ConversasDemo() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(demoMensagens[0]?.numero ?? null);

  const conversations = useMemo(() => {
    const map = new Map<string, { numero: string; nome: string; last: DemoMsg }>();
    [...demoMensagens].sort((a, b) => +b.quando - +a.quando).forEach((m) => {
      if (!map.has(m.numero)) map.set(m.numero, { numero: m.numero, nome: m.nome, last: m });
    });
    let list = Array.from(map.values());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.nome.toLowerCase().includes(q) || c.numero.includes(q));
    }
    return list;
  }, [search]);

  const thread = useMemo(() =>
    [...demoMensagens].filter((m) => m.numero === active).sort((a, b) => +a.quando - +b.quando),
    [active]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
        <p className="text-sm text-muted-foreground">Inbox em tempo real — exemplo.</p>
      </div>
      <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-260px)] min-h-[420px]">
        <Card className="p-2 overflow-hidden flex flex-col">
          <Input placeholder="Buscar contato…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
          <ul className="flex-1 overflow-auto divide-y">
            {conversations.map((c) => (
              <li key={c.numero}>
                <button onClick={() => setActive(c.numero)}
                  className={`w-full text-left p-2.5 hover:bg-muted/60 ${active === c.numero ? "bg-muted" : ""}`}>
                  <div className="text-sm font-medium truncate">{c.nome}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.last.texto}</div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
              <div className="text-center"><MessageSquareText className="mx-auto mb-2 size-6" />Selecione uma conversa</div>
            </div>
          ) : (
            <>
              <div className="border-b pb-2 mb-3 font-semibold text-sm">{thread[0]?.nome}</div>
              <div className="flex-1 overflow-auto space-y-2">
                {thread.map((m) => <Bubble key={m.id} m={m} />)}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: DemoMsg }) {
  const isOut = m.direcao === "saida";
  const author = m.autor === "ia" ? { label: "IA", icon: <Bot className="size-3" /> }
    : m.autor === "humano" ? { label: "Atendente", icon: <User className="size-3" /> }
    : { label: m.nome, icon: <User className="size-3" /> };
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isOut ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <div className="text-[10px] flex items-center gap-1 mb-0.5 opacity-80">{author.icon}{author.label}</div>
        <div className="text-sm whitespace-pre-wrap">{m.texto}</div>
        <div className="text-[10px] opacity-70 mt-1">{m.quando.toLocaleString("pt-BR")}</div>
      </div>
    </div>
  );
}
