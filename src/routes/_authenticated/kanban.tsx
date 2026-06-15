import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/kanban")({
  head: () => ({ meta: [{ title: `${brand.name} — CRM Kanban` }] }),
  component: KanbanPage,
});

type Status = "conversas" | "negociando" | "ganho" | "perda";
const COLUMNS: { id: Status; label: string; accent: string }[] = [
  { id: "conversas", label: "Conversas", accent: "bg-blue-500" },
  { id: "negociando", label: "Negociando", accent: "bg-amber-500" },
  { id: "ganho", label: "Ganho", accent: "bg-primary" },
  { id: "perda", label: "Perda", accent: "bg-rose-500" },
];

interface CardRow {
  id: string;
  numero: string;
  nome: string | null;
  status: Status;
  ultima_mensagem: string | null;
  ultima_em: string;
  observacao: string | null;
}

function KanbanPage() {
  const [userId, setUserId] = useState<string>("");
  const [cards, setCards] = useState<CardRow[]>([]);
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      await reload(u.user.id);

      const channel = supabase
        .channel("crm_cards_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "crm_cards", filter: `user_id=eq.${u.user.id}` },
          () => { void reload(u.user!.id); },
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    })();
  }, []);

  async function reload(uid: string) {
    const { data } = await supabase
      .from("crm_cards")
      .select("*")
      .eq("user_id", uid)
      .order("ultima_em", { ascending: false });
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
    if (error) {
      toast.error(error.message);
      setCards(prev);
    }
  }

  async function removeCard(id: string) {
    const { error } = await supabase.from("crm_cards").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Card removido");
    setCards((cs) => cs.filter((c) => c.id !== id));
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase
      .from("crm_cards")
      .update({ nome: editing.nome, observacao: editing.observacao })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Card atualizado");
    setEditing(null);
    void reload(userId);
  }

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const status = String(over.id) as Status;
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    void moveCard(id, status);
  }

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Kanban</h1>
          <p className="text-sm text-muted-foreground">Arraste cards entre colunas. A IA também move automaticamente.</p>
        </div>
        <Button onClick={() => setAdding(true)} size="sm">
          <Plus className="size-4 mr-1.5" /> Adicionar do WhatsApp
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} label={col.label} accent={col.accent} count={byStatus[col.id].length}>
              {byStatus[col.id].map((c) => (
                <KCard
                  key={c.id}
                  card={c}
                  onEdit={() => setEditing(c)}
                  onRemove={() => removeCard(c.id)}
                />
              ))}
            </Column>
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <CardBody card={activeCard} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar card</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={editing.numero} disabled />
              </div>
              <div>
                <Label>Observação</Label>
                <Textarea value={editing.observacao ?? ""} onChange={(e) => setEditing({ ...editing, observacao: e.target.value })} rows={4} />
              </div>
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
        userId={userId}
        onAdded={() => reload(userId)}
        existingNumbers={new Set(cards.map((c) => c.numero))}
      />
    </div>
  );
}

function Column({ id, label, accent, count, children }: { id: Status; label: string; accent: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`rounded-xl border bg-card p-3 transition-colors ${isOver ? "ring-2 ring-primary/40" : ""}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${accent}`} />
          <h3 className="font-semibold text-sm">{label}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2 min-h-32">{children}</div>
    </div>
  );
}

function KCard({ card, onEdit, onRemove }: { card: CardRow; onEdit: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <CardBody card={card} onEdit={onEdit} onRemove={onRemove} dragHandle={listeners} />
    </div>
  );
}

function CardBody({
  card,
  onEdit,
  onRemove,
  dragHandle,
  dragging,
}: {
  card: CardRow;
  onEdit?: () => void;
  onRemove?: () => void;
  dragHandle?: any;
  dragging?: boolean;
}) {
  return (
    <Card className={`p-3 ${dragging ? "shadow-xl ring-2 ring-primary/40" : "hover:shadow-md"} transition-shadow`}>
      <div className="flex items-start gap-2">
        <button {...(dragHandle ?? {})} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing pt-0.5">
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{card.nome || card.numero}</div>
          <div className="text-xs text-muted-foreground truncate">{card.numero}</div>
          {card.ultima_mensagem && (
            <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{card.ultima_mensagem}</div>
          )}
          <div className="text-[10px] text-muted-foreground mt-1.5">
            {new Date(card.ultima_em).toLocaleString("pt-BR")}
          </div>
        </div>
        {onEdit && (
          <div className="flex flex-col gap-1">
            <button onClick={onEdit} className="text-muted-foreground hover:text-foreground p-1" title="Editar">
              <Pencil className="size-3.5" />
            </button>
            {onRemove && (
              <button onClick={onRemove} className="text-muted-foreground hover:text-destructive p-1" title="Remover">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function AddFromWhatsappDialog({
  open, onClose, userId, onAdded, existingNumbers,
}: {
  open: boolean; onClose: () => void; userId: string; onAdded: () => void; existingNumbers: Set<string>;
}) {
  const [convs, setConvs] = useState<{ numero: string; contato_nome: string | null; texto: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("mensagens")
        .select("numero,contato_nome,texto,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      // dedup por número, manter o mais recente
      const seen = new Set<string>();
      const list: typeof convs = [];
      (data ?? []).forEach((m: any) => {
        if (seen.has(m.numero) || existingNumbers.has(m.numero)) return;
        seen.add(m.numero);
        list.push(m);
      });
      setConvs(list);
      setLoading(false);
    })();
  }, [open, userId]);

  async function add(c: { numero: string; contato_nome: string | null; texto: string }) {
    const { error } = await supabase.from("crm_cards").upsert(
      {
        user_id: userId,
        numero: c.numero,
        nome: c.contato_nome,
        status: "conversas",
        ultima_mensagem: c.texto.slice(0, 240),
        ultima_em: new Date().toISOString(),
      },
      { onConflict: "user_id,numero" },
    );
    if (error) return toast.error(error.message);
    toast.success("Adicionado ao kanban");
    onAdded();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Conversas recentes do WhatsApp</DialogTitle></DialogHeader>
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
        ) : convs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma conversa nova encontrada.</div>
        ) : (
          <ul className="max-h-80 overflow-auto divide-y">
            {convs.map((c) => (
              <li key={c.numero} className="py-2.5 flex items-center gap-3">
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
