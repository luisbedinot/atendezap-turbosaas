import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { Hand, MessageSquareText, Send, Sparkles, User } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { AuthorBadge } from "@/components/dashboard/message-timeline";
import { toast } from "sonner";

export const Route = createFileRoute("/app/conversas")({
  head: () => ({ meta: [{ title: `${brand.name} — Conversas` }] }),
  component: ConversasPage,
});

interface Msg {
  id: string; numero: string; contato_nome: string | null;
  direcao: "entrada" | "saida"; autor: "ia" | "humano" | "contato";
  texto: string; created_at: string;
}
interface CardRow { numero: string; nome: string | null; status: string; observacao: string | null }

const STAGE_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  conversas: { bg: "bg-[rgba(34,211,238,.15)]", fg: "text-[#a7e9f5]", label: "Conversa" },
  negociando: { bg: "bg-[rgba(255,176,32,.15)]", fg: "text-[#ffd591]", label: "Negociando" },
  ganho: { bg: "bg-[rgba(37,211,102,.15)]", fg: "text-[#9af0bd]", label: "Ganho" },
  perda: { bg: "bg-[rgba(255,90,90,.15)]", fg: "text-[#ff9d9d]", label: "Perda" },
};

function ConversasPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [cards, setCards] = useState<Record<string, CardRow>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [iaActive, setIaActive] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!companyId) return;
    void load(companyId);
    const ch = supabase
      .channel(`mensagens_realtime_${companyId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `company_id=eq.${companyId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((p) => [m, ...p].slice(0, 500));
          if (m.direcao === "entrada" && m.numero !== active) {
            setUnread((u) => ({ ...u, [m.numero]: (u[m.numero] ?? 0) + 1 }));
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, active]);

  useEffect(() => {
    if (active) setUnread((u) => ({ ...u, [active]: 0 }));
    requestAnimationFrame(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }); });
  }, [active, msgs.length]);

  async function load(cid: string) {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from("mensagens").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(500),
      supabase.from("crm_cards").select("numero,nome,status,observacao").eq("company_id", cid),
    ]);
    setMsgs((m ?? []) as Msg[]);
    const map: Record<string, CardRow> = {};
    (c ?? []).forEach((r: any) => { map[r.numero] = r; });
    setCards(map);
  }

  const conversations = useMemo(() => {
    const map = new Map<string, { numero: string; nome: string | null; last: Msg }>();
    for (const m of msgs) {
      const cur = map.get(m.numero);
      if (!cur) map.set(m.numero, { numero: m.numero, nome: m.contato_nome, last: m });
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

  const activeConv = conversations.find((c) => c.numero === active);
  const activeCard = active ? cards[active] : undefined;
  const stage = activeCard?.status ?? "conversas";
  const stageCfg = STAGE_COLORS[stage] ?? STAGE_COLORS.conversas;

  async function pause() {
    if (!companyId || !active) return;
    const { error } = await supabase.from("contact_pause").upsert(
      { company_id: companyId, user_id: ctx.user.id, numero: active, pausado: true },
      { onConflict: "company_id,numero" },
    );
    if (error) return toast.error(error.message);
    toast.success("IA pausada neste contato");
  }

  async function sendMsg() {
    if (!composer.trim() || !active || !companyId) return;
    const txt = composer.trim(); setComposer("");
    const { error } = await supabase.from("mensagens").insert({
      company_id: companyId, user_id: ctx.user.id, numero: active, contato_nome: activeConv?.nome ?? null,
      direcao: "saida", autor: "humano", texto: txt,
    });
    if (error) return toast.error(error.message);
  }

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Conversas</h1>
          <p className="text-xs text-muted-foreground">Inbox em tempo real do WhatsApp</p>
        </div>
      </header>

      <div className="grid md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_260px] gap-0 border border-white/8 rounded-2xl overflow-hidden h-[calc(100vh-180px)] min-h-[480px] bg-[var(--panel)]">
        {/* LISTA */}
        <aside className="border-r border-white/8 flex flex-col min-h-0 bg-[var(--panel)]">
          <div className="p-3 border-b border-white/8">
            <Input placeholder="Buscar contato…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ul className="flex-1 overflow-auto">
            {conversations.length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">Nenhuma conversa.</li>}
            {conversations.map((c) => {
              const on = c.numero === active;
              const u = unread[c.numero] ?? 0;
              return (
                <li key={c.numero}>
                  <button
                    onClick={() => setActive(c.numero)}
                    className={`relative w-full text-left flex gap-3 p-3 border-b border-white/8 transition-colors ${on ? "bg-[rgba(37,211,102,.08)]" : "hover:bg-white/[0.03]"}`}
                  >
                    {on && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--brand)]" />}
                    <InitialsAvatar name={c.nome || c.numero} size={38} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <b className="text-[13px] truncate">{c.nome || c.numero}</b>
                        <span className="ml-auto text-[10.5px] text-[var(--dim,#5f7a6d)] whitespace-nowrap">
                          {new Date(c.last.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[12px] text-muted-foreground truncate flex-1">{c.last.texto}</p>
                        {u > 0 && (
                          <span className="bg-[var(--brand)] text-[#04140B] text-[10px] font-bold min-w-[18px] h-[18px] rounded-full grid place-items-center px-1">
                            {u}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* THREAD */}
        <section className="flex flex-col min-h-0 bg-[linear-gradient(180deg,#0a120d,#0b1410)]">
          {!active ? (
            <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
              <div className="text-center"><MessageSquareText className="mx-auto mb-2 size-6" />Selecione uma conversa</div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                <InitialsAvatar name={activeConv?.nome || active} size={36} />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{activeConv?.nome || active}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{active}</div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    IA ativa
                    <Switch checked={iaActive} onCheckedChange={setIaActive} />
                  </label>
                  <Button size="sm" variant="outline" onClick={pause}>
                    <Hand className="size-3.5 mr-1" /> Assumir
                  </Button>
                </div>
              </header>
              <div ref={threadRef} className="flex-1 overflow-auto p-4 flex flex-col gap-2.5">
                {thread.map((m) => <Bubble key={m.id} m={m} />)}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); void sendMsg(); }}
                className="px-4 py-3 border-t border-white/8 flex gap-2 items-center"
              >
                <input
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Digite uma mensagem…"
                  className="flex-1 bg-[var(--background)] border border-white/8 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]/60"
                />
                <button
                  type="submit"
                  className="size-10 rounded-full grid place-items-center text-[#04140B] bg-gradient-to-br from-[#00E676] to-[#25D366] hover:brightness-110 transition"
                  aria-label="Enviar"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </>
          )}
        </section>

        {/* INFO */}
        <aside className="hidden xl:flex flex-col gap-3 border-l border-white/8 p-4 bg-[var(--panel)] overflow-auto">
          {!active ? (
            <p className="text-xs text-muted-foreground text-center mt-6">Selecione uma conversa para ver os detalhes.</p>
          ) : (
            <>
              <div className="flex flex-col items-center text-center gap-2 pb-3 border-b border-white/8">
                <InitialsAvatar name={activeConv?.nome || active} size={72} />
                <div>
                  <div className="font-semibold text-sm">{activeConv?.nome || active}</div>
                  <div className="text-[11px] text-muted-foreground">{active}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Estágio CRM</div>
                <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full ${stageCfg.bg} ${stageCfg.fg}`}>
                  <Sparkles className="size-3.5" /> {stageCfg.label}
                </span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tags</div>
                <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-muted-foreground mr-1 mb-1">whatsapp</span>
                <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-muted-foreground mr-1 mb-1">{stage}</span>
              </div>
              {activeCard?.observacao && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Observações</div>
                  <p className="text-[12.5px] text-foreground/80 whitespace-pre-wrap">{activeCard.observacao}</p>
                </div>
              )}
              <div className="mt-auto pt-3 border-t border-white/8 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <User className="size-3" /> {thread.length} mensagens nesta conversa
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isOut = m.direcao === "saida";
  const ia = m.autor === "ia";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] sm:max-w-[62%] px-3.5 py-2.5 text-[13px] ${
          isOut
            ? "bg-gradient-to-br from-[#1f9d57] to-[#25D366] text-[#04140B] rounded-2xl rounded-br-md font-medium"
            : "bg-[#15241c] text-foreground rounded-2xl rounded-bl-md"
        }`}
      >
        {isOut && (
          <span className="block text-[9.5px] font-bold opacity-80 mb-1 uppercase tracking-wider">
            {ia ? "⚡ Agente IA" : "Atendente"}
          </span>
        )}
        {!isOut && <span className="block mb-1"><AuthorBadge autor={m.autor} /></span>}
        <div className="whitespace-pre-wrap break-words">{m.texto}</div>
        <div className={`text-[10px] mt-1 ${isOut ? "opacity-70" : "text-muted-foreground"}`}>
          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
