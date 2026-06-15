import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useDroppable, useDraggable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Sparkles } from "lucide-react";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/app/crm")({
  head: () => ({ meta: [{ title: `${brand.name} — CRM Kanban` }] }),
  component: KanbanPage,
});

type Status = "conversas" | "negociando" | "ganho" | "perda";
const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: "conversas", label: "Conversas", color: "#22D3EE" },
  { id: "negociando", label: "Negociando", color: "#FFB020" },
  { id: "ganho", label: "Ganho", color: "#25D366" },
  { id: "perda", label: "Perda", color: "#FF5A5A" },
];

interface CardRow {
  id: string; numero: string; nome: string | null; status: Status;
  ultima_mensagem: string | null; ultima_em: string; observacao: string | null;
  valor?: number | null;
}

function KanbanPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id ?? "";
  const userId = ctx.user.id;
  const [cards, setCards] = useState<CardRow[]>([]);
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!companyId) return;
    void reload(companyId);
    const channel = supabase
      .channel("crm_cards_realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "crm_cards", filter: `company_id=eq.${companyId}` },
        () => { void reload(companyId); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  async function reload(cid: string) {
    const { data } = await supabase.from("crm_cards").select("*").eq("company_id", cid).order("ultima_em", { ascending: false });
    setCards((data ?? []) as CardRow[]);
  }

  const byStatus = useMemo(() => {
    const m: Record<Status, CardRow[]> = { conversas: [], negociando: [], ganho: [], perda: [] };
    cards.forEach((c) => m[c.status].push(c));
    return m;
  }, [cards]);

  async function moveCard(id: string, status: Status) {
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    const { error } = await supabase.from("crm_cards").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); setCards(prev); }
  }

  async function removeCard(id: string) {
    const { error } = await supabase.from("crm_cards").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Card removido");
    setCards((cs) => cs.filter((c) => c.id !== id));
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase.from("crm_cards").update({ nome: editing.nome, observacao: editing.observacao }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Card atualizado");
    setEditing(null);
    void reload(companyId);
  }

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id); const status = String(over.id) as Status;
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    void moveCard(id, status);
  }

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold">CRM Kanban</h1>
          <p className="text-xs text-muted-foreground">Arraste cards entre colunas. A IA também move automaticamente.</p>
        </div>
        <Button onClick={() => setAdding(true)} size="sm" className="shrink-0">
          <Plus className="size-4 mr-1.5" /> Adicionar do WhatsApp
        </Button>
      </header>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} label={col.label} color={col.color} count={byStatus[col.id].length}>
              {byStatus[col.id].map((c) => (
                <KCard key={c.id} card={c} onEdit={() => setEditing(c)} onRemove={() => removeCard(c.id)} />
              ))}
              {byStatus[col.id].length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-6 border border-dashed border-white/8 rounded-xl">
                  vazio
                </div>
              )}
            </Column>
          ))}
        </div>
        <DragOverlay>{activeCard ? <CardBody card={activeCard} dragging /> : null}</DragOverlay>
      </DndContext>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar card</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
              <div><Label>Número</Label><Input value={editing.numero} disabled /></div>
              <div><Label>Observação</Label><Textarea value={editing.observacao ?? ""} onChange={(e) => setEditing({ ...editing, observacao: e.target.value })} rows={4} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddFromWhatsappDialog
        open={adding}
        onClose={() => setAdding(false)}
        companyId={companyId}
        userId={userId}
        onAdded={() => reload(companyId)}
        existingNumbers={new Set(cards.map((c) => c.numero))}
      />
    </div>
  );
}

function Column({ id, label, color, count, children }: { id: Status; label: string; color: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border bg-[var(--panel)] p-3.5 min-h-[420px] transition-colors ${
        isOver ? "border-[var(--brand)]/60 bg-[rgba(37,211,102,.05)]" : "border-white/8"
      }`}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <span className="size-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        <b className="font-display text-[13.5px]">{label}</b>
        <span className="ml-auto text-[11px] text-muted-foreground bg-white/[0.06] px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function KCard({ card, onEdit, onRemove }: { card: CardRow; onEdit: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.3 : 1, cursor: "grab" }}>
      <CardBody card={card} onEdit={onEdit} onRemove={onRemove} />
    </div>
  );
}

function CardBody({ card, onEdit, onRemove, dragging }: { card: CardRow; onEdit?: () => void; onRemove?: () => void; dragging?: boolean }) {
  const time = new Date(card.ultima_em);
  return (
    <div
      className={`rounded-xl border border-white/8 bg-[var(--panel-2)] p-3 transition-all ${
        dragging ? "shadow-2xl ring-2 ring-[var(--brand)]/40 rotate-1" : "hover:border-white/15"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <InitialsAvatar name={card.nome || card.numero} size={34} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">{card.nome || card.numero}</div>
          <div className="text-[10.5px] text-[var(--dim,#5f7a6d)] font-mono truncate">{card.numero}</div>
        </div>
        {onEdit && (
          <div className="flex flex-col gap-1 -my-1">
            <button onPointerDown={(e) => e.stopPropagation()} onClick={onEdit} className="text-muted-foreground hover:text-foreground p-1" title="Editar">
              <Pencil className="size-3.5" />
            </button>
            {onRemove && (
              <button onPointerDown={(e) => e.stopPropagation()} onClick={onRemove} className="text-muted-foreground hover:text-destructive p-1" title="Remover">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      {card.ultima_mensagem && (
        <p className="text-muted-foreground text-[12px] mt-2 line-clamp-2">{card.ultima_mensagem}</p>
      )}
      <div className="flex items-center gap-2 mt-2.5">
        {card.valor != null && (
          <span className="font-display font-bold text-[13px] text-[#A3E635]">
            R$ {Number(card.valor).toLocaleString("pt-BR")}
          </span>
        )}
        <span className="text-[9.5px] font-bold text-[#00E676] bg-[rgba(37,211,102,.12)] px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <Sparkles className="size-2.5" /> IA
        </span>
        <span className="ml-auto text-[10.5px] text-[var(--dim,#5f7a6d)]">
          {time.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function AddFromWhatsappDialog({
  open, onClose, companyId, userId, onAdded, existingNumbers,
}: { open: boolean; onClose: () => void; companyId: string; userId: string; onAdded: () => void; existingNumbers: Set<string> }) {
  const [convs, setConvs] = useState<{ numero: string; contato_nome: string | null; texto: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !companyId) return;
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("mensagens")
        .select("numero,contato_nome,texto,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);
      const seen = new Set<string>();
      const list: typeof convs = [];
      (data ?? []).forEach((m: any) => {
        if (seen.has(m.numero) || existingNumbers.has(m.numero)) return;
        seen.add(m.numero); list.push(m);
      });
      setConvs(list); setLoading(false);
    })();
  }, [open, companyId]);

  async function add(c: { numero: string; contato_nome: string | null; texto: string }) {
    const { error } = await supabase.from("crm_cards").upsert(
      {
        company_id: companyId,
        user_id: userId,
        numero: c.numero,
        nome: c.contato_nome,
        status: "conversas",
        ultima_mensagem: c.texto.slice(0, 240),
        ultima_em: new Date().toISOString(),
      },
      { onConflict: "company_id,numero" },
    );
    if (error) return toast.error(error.message);
    toast.success("Adicionado ao kanban");
    onAdded(); onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Conversas recentes do WhatsApp</DialogTitle></DialogHeader>
        {loading ? <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
          : convs.length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma conversa nova.</div>
          : (
            <ul className="max-h-80 overflow-auto divide-y divide-white/8">
              {convs.map((c) => (
                <li key={c.numero} className="py-2.5 flex items-center gap-3">
                  <InitialsAvatar name={c.contato_nome || c.numero} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.contato_nome || c.numero}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.texto}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => add(c)}>Adicionar</Button>
                </li>
              ))}
            </ul>
          )}
      </DialogContent>
    </Dialog>
  );
}
