import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { Bot, MessageSquareText, User } from "lucide-react";

export const Route = createFileRoute("/app/conversas")({
  head: () => ({ meta: [{ title: `${brand.name} — Conversas` }] }),
  component: ConversasPage,
});

interface Msg {
  id: string; numero: string; contato_nome: string | null;
  direcao: "entrada" | "saida"; autor: "ia" | "humano" | "contato";
  texto: string; created_at: string;
}

function ConversasPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void load(companyId);
    const ch = supabase
      .channel(`mensagens_realtime_${companyId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `company_id=eq.${companyId}` },
        (payload) => setMsgs((p) => [payload.new as Msg, ...p].slice(0, 500)),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId]);

  async function load(cid: string) {
    const { data } = await supabase
      .from("mensagens").select("*")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(500);
    setMsgs((data ?? []) as Msg[]);
  }

  const conversations = useMemo(() => {
    const map = new Map<string, { numero: string; nome: string | null; last: Msg; count: number }>();
    for (const m of msgs) {
      const cur = map.get(m.numero);
      if (!cur) map.set(m.numero, { numero: m.numero, nome: m.contato_nome, last: m, count: 1 });
      else cur.count++;
    }
    let list = Array.from(map.values());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => (c.nome ?? "").toLowerCase().includes(q) || c.numero.includes(q));
    }
    return list.sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
  }, [msgs, search]);

  const thread = useMemo(() =>
    [...msgs].filter((m) => m.numero === active).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [msgs, active]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
        <p className="text-sm text-muted-foreground">Inbox em tempo real do WhatsApp.</p>
      </div>
      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[420px]">
        <Card className="p-2 overflow-hidden flex flex-col">
          <Input placeholder="Buscar contato…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
          <ul className="flex-1 overflow-auto divide-y">
            {conversations.length === 0 && <li className="p-4 text-sm text-muted-foreground text-center">Nenhuma conversa.</li>}
            {conversations.map((c) => (
              <li key={c.numero}>
                <button
                  onClick={() => setActive(c.numero)}
                  className={`w-full text-left p-2.5 hover:bg-muted/60 ${active === c.numero ? "bg-muted" : ""}`}
                >
                  <div className="text-sm font-medium truncate">{c.nome || c.numero}</div>
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
              <div className="border-b pb-2 mb-3 font-semibold text-sm">{thread[0]?.contato_nome || active}</div>
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

function Bubble({ m }: { m: Msg }) {
  const isOut = m.direcao === "saida";
  const author = m.autor === "ia" ? { label: "IA", icon: <Bot className="size-3" /> }
    : m.autor === "humano" ? { label: "Atendente", icon: <User className="size-3" /> }
    : { label: m.contato_nome || "Contato", icon: <User className="size-3" /> };
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isOut ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <div className={`text-[10px] flex items-center gap-1 mb-0.5 opacity-80`}>{author.icon}{author.label}</div>
        <div className="text-sm whitespace-pre-wrap">{m.texto}</div>
        <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString("pt-BR")}</div>
      </div>
    </div>
  );
}
