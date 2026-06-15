import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { Bot, KanbanSquare, MessageCircle, Target, Trophy } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MiniAreaChart, type AreaPoint } from "@/components/dashboard/mini-area-chart";
import { AgentStatusCard } from "@/components/dashboard/agent-status-card";
import { MessageTimeline, type TimelineItem } from "@/components/dashboard/message-timeline";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: `${brand.name} — Dashboard` }] }),
  component: Dashboard,
});

interface Stats { conversas: number; negociando: number; ganho: number; perda: number; respondidasIa: number; recebidas: number }

function Dashboard() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [numero, setNumero] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ conversas: 0, negociando: 0, ganho: 0, perda: 0, respondidasIa: 0, recebidas: 0 });
  const [series, setSeries] = useState<AreaPoint[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => { if (companyId) void load(companyId); }, [companyId]);

  async function load(cid: string) {
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const [{ data: inst }, { data: cards }, { data: msgs14 }, { data: last }] = await Promise.all([
      supabase.from("whatsapp_instances").select("status,numero").eq("company_id", cid).maybeSingle(),
      supabase.from("crm_cards").select("status").eq("company_id", cid),
      supabase.from("mensagens").select("direcao,autor,created_at").eq("company_id", cid).gte("created_at", since),
      supabase
        .from("mensagens")
        .select("id,numero,contato_nome,direcao,autor,texto,created_at")
        .eq("company_id", cid).order("created_at", { ascending: false }).limit(8),
    ]);
    setStatus(((inst?.status as any) || "disconnected"));
    setNumero(inst?.numero ?? null);
    const s: Stats = { conversas: 0, negociando: 0, ganho: 0, perda: 0, respondidasIa: 0, recebidas: 0 };
    (cards ?? []).forEach((c: any) => { (s as any)[c.status] = ((s as any)[c.status] || 0) + 1; });
    // 14-day series
    const days: AreaPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({ label: d.toISOString().slice(5, 10), a: 0, b: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.label, i]));
    (msgs14 ?? []).forEach((m: any) => {
      const k = new Date(m.created_at).toISOString().slice(5, 10);
      const i = idx.get(k); if (i === undefined) return;
      if (m.direcao === "entrada") { days[i].a += 1; s.recebidas += 1; }
      if (m.autor === "ia") { days[i].b = (days[i].b ?? 0) + 1; s.respondidasIa += 1; }
    });
    setSeries(days);
    setStats(s);
    setTimeline(
      (last ?? []).map((m: any) => ({
        id: m.id, nome: m.contato_nome || m.numero, autor: m.autor, texto: m.texto,
        quando: new Date(m.created_at),
      })),
    );
  }

  const hoje = useMemo(() => series[series.length - 1]?.a ?? 0, [series]);
  const ontem = useMemo(() => series[series.length - 2]?.a ?? 0, [series]);
  const trendHoje = ontem === 0 ? (hoje > 0 ? "+100% vs ontem" : "—") : `${Math.round(((hoje - ontem) / ontem) * 100)}% vs ontem`;
  const taxaIa = stats.recebidas ? Math.round((stats.respondidasIa / stats.recebidas) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold truncate">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Visão geral do seu atendimento</p>
        </div>
        <StatusPill status={status} />
      </header>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard accent icon={<MessageCircle className="size-4" />} label="Conversas hoje" value={hoje} trend={trendHoje} />
        <KpiCard icon={<Bot className="size-4" />} label="Respondidas pela IA" value={stats.respondidasIa} trend={`${taxaIa}% no automático`} />
        <KpiCard icon={<Target className="size-4" />} label="Em negociação" value={stats.negociando} trend={`${stats.conversas} em conversa`} />
        <KpiCard icon={<Trophy className="size-4" />} label="Ganhos no funil" value={stats.ganho} trend={`${stats.perda} perdas`} />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-5">
          <h3 className="font-display text-[15px] font-semibold">Atendimentos · 14 dias</h3>
          <p className="text-xs text-muted-foreground mb-3">recebidas vs respondidas pela IA</p>
          <MiniAreaChart data={series} />
        </div>
        <AgentStatusCard
          status={status}
          numero={numero}
          tempoMedio={status === "connected" ? "~3s" : "—"}
          taxaQualificacao={stats.conversas + stats.negociando > 0
            ? `${Math.round((stats.negociando / (stats.conversas + stats.negociando)) * 100)}%`
            : "—"}
        />
      </div>

      <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-display text-[15px] font-semibold">Últimas mensagens</h3>
            <p className="text-xs text-muted-foreground">atividade recente</p>
          </div>
          <KanbanSquare className="size-4 text-muted-foreground" />
        </div>
        <MessageTimeline items={timeline} empty="Conecte o WhatsApp para começar a ver conversas." />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "connected" | "connecting" | "disconnected" }) {
  const cfg = status === "connected"
    ? { txt: "Agente conectado", bg: "bg-[rgba(37,211,102,.12)]", bd: "border-[rgba(37,211,102,.3)]", fg: "text-[#bff5d4]", dot: "#00E676" }
    : status === "connecting"
    ? { txt: "Conectando…", bg: "bg-[rgba(255,176,32,.12)]", bd: "border-[rgba(255,176,32,.3)]", fg: "text-[#ffe1ad]", dot: "#FFB020" }
    : { txt: "Desconectado", bg: "bg-[rgba(255,90,90,.10)]", bd: "border-[rgba(255,90,90,.25)]", fg: "text-[#ffb3b3]", dot: "#FF5A5A" };
  return (
    <div className={`flex items-center gap-2 ${cfg.bg} ${cfg.bd} ${cfg.fg} border text-[12.5px] font-semibold px-3 py-1.5 rounded-full`}>
      <span className="relative inline-flex">
        <span className="size-2 rounded-full" style={{ background: cfg.dot }} />
        {status === "connected" && (
          <span className="absolute inset-0 size-2 rounded-full animate-ping opacity-60" style={{ background: cfg.dot }} />
        )}
      </span>
      {cfg.txt}
    </div>
  );
}
