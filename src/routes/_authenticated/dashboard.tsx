import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brand } from "@/config/brand";
import { Bot, KanbanSquare, MessageSquareText, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: `${brand.name} — Dashboard` }] }),
  component: Dashboard,
});

interface Stats {
  conversas: number;
  negociando: number;
  ganho: number;
  perda: number;
}

function Dashboard() {
  const [status, setStatus] = useState<string>("disconnected");
  const [stats, setStats] = useState<Stats>({ conversas: 0, negociando: 0, ganho: 0, perda: 0 });
  const [mensagens, setMensagens] = useState<any[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ data: inst }, { data: cards }, { data: msgs }] = await Promise.all([
      supabase.from("whatsapp_instances").select("status").eq("user_id", u.user.id).maybeSingle(),
      supabase.from("crm_cards").select("status").eq("user_id", u.user.id),
      supabase
        .from("mensagens")
        .select("numero,contato_nome,direcao,autor,texto,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setStatus(inst?.status || "disconnected");
    const s: Stats = { conversas: 0, negociando: 0, ganho: 0, perda: 0 };
    (cards ?? []).forEach((c: any) => { (s as any)[c.status] = ((s as any)[c.status] || 0) + 1; });
    setStats(s);
    setMensagens(msgs ?? []);
  }

  const statusLabel = status === "connected" ? "Conectado" : status === "connecting" ? "Conectando" : "Desconectado";
  const statusColor = status === "connected" ? "bg-primary" : status === "connecting" ? "bg-amber-500" : "bg-muted";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu atendimento.</p>
        </div>
        <Badge variant="outline" className="gap-2 py-1.5 px-3">
          <span className={`size-2 rounded-full ${statusColor}`} />
          {statusLabel}
        </Badge>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat icon={<MessageSquareText className="size-4" />} label="Conversas" value={stats.conversas} />
        <Stat icon={<Bot className="size-4" />} label="Em negociação" value={stats.negociando} />
        <Stat icon={<KanbanSquare className="size-4" />} label="Ganhos" value={stats.ganho} accent />
        <Stat icon={<Smartphone className="size-4" />} label="Perdas" value={stats.perda} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Últimas mensagens</h2>
        {mensagens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada por aqui ainda. Conecte o WhatsApp para começar.</p>
        ) : (
          <ul className="divide-y">
            {mensagens.map((m, i) => (
              <li key={i} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {m.contato_nome || m.numero} <span className="text-muted-foreground">· {m.direcao === "entrada" ? "recebida" : m.autor === "ia" ? "IA" : "enviada"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{m.texto}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}
