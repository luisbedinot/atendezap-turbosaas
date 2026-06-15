import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { brand } from "@/config/brand";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Bot, MessageCircle, Target, Trophy } from "lucide-react";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: `${brand.name} — Relatórios` }] }),
  component: RelatoriosPage,
});

const STAGE_COLORS: Record<string, string> = {
  conversas: "#22D3EE", negociando: "#FFB020", ganho: "#25D366", perda: "#FF5A5A",
};
const STAGE_LABELS: Record<string, string> = {
  conversas: "Conversas", negociando: "Negociando", ganho: "Ganho", perda: "Perda",
};
const STAGES = ["conversas", "negociando", "ganho", "perda"] as const;

function RelatoriosPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const [msgs, setMsgs] = useState<{ created_at: string; direcao: string; autor: string }[]>([]);
  const [cards, setCards] = useState<{ status: string }[]>([]);

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.from("mensagens").select("created_at,direcao,autor").eq("company_id", companyId).gte("created_at", since),
        supabase.from("crm_cards").select("status").eq("company_id", companyId),
      ]);
      setMsgs((m ?? []) as any); setCards(c ?? []);
    })();
  }, [companyId]);

  const perDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    msgs.forEach((m) => {
      const k = new Date(m.created_at).toISOString().slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([d, v]) => ({ dia: d.slice(5), mensagens: v }));
  }, [msgs]);

  const byStage = useMemo(() => {
    const m: Record<string, number> = { conversas: 0, negociando: 0, ganho: 0, perda: 0 };
    cards.forEach((c) => { m[c.status] = (m[c.status] ?? 0) + 1; });
    return STAGES.map((s) => ({ name: STAGE_LABELS[s], value: m[s], fill: STAGE_COLORS[s] }));
  }, [cards]);

  const totalMsgs = msgs.length;
  const respIa = msgs.filter((m) => m.autor === "ia").length;
  const ganho = byStage.find((s) => s.name === "Ganho")?.value ?? 0;
  const conversao = cards.length ? Math.round((ganho / cards.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Relatórios</h1>
          <p className="text-xs text-muted-foreground">Últimos 30 dias.</p>
        </div>
      </header>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard accent icon={<MessageCircle className="size-4" />} label="Mensagens" value={totalMsgs} trend={`${respIa} pela IA`} />
        <KpiCard icon={<Bot className="size-4" />} label="Cards no funil" value={cards.length} />
        <KpiCard icon={<Target className="size-4" />} label="Conversão" value={`${conversao}%`} trend={`${ganho} ganhos`} />
        <KpiCard icon={<Trophy className="size-4" />} label="Em negociação" value={byStage.find((s) => s.name === "Negociando")?.value ?? 0} />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-5">
          <h3 className="font-display text-[15px] font-semibold">Mensagens por dia</h3>
          <p className="text-xs text-muted-foreground mb-3">14 dias</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="dia" fontSize={11} stroke="#8AA89A" />
              <YAxis fontSize={11} allowDecimals={false} stroke="#8AA89A" />
              <Tooltip contentStyle={{ background: "#13211A", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, color: "#EAF6EF" }} />
              <Bar dataKey="mensagens" radius={[6, 6, 0, 0]} fill={brand.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-5">
          <h3 className="font-display text-[15px] font-semibold">Funil por estágio</h3>
          <p className="text-xs text-muted-foreground mb-3">distribuição atual</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStage} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {byStage.map((e, i) => <Cell key={i} fill={e.fill} stroke="#0E1813" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#13211A", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, color: "#EAF6EF" }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {byStage.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-[12.5px]">
                <span className="size-2.5 rounded-full" style={{ background: s.fill }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-semibold">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
