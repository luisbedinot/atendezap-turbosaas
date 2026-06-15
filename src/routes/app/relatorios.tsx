import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: `${brand.name} — Relatórios` }] }),
  component: RelatoriosPage,
});

const COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];
const STAGES = ["conversas", "negociando", "ganho", "perda"] as const;

function RelatoriosPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const [msgs, setMsgs] = useState<{ created_at: string }[]>([]);
  const [cards, setCards] = useState<{ status: string }[]>([]);

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.from("mensagens").select("created_at").eq("company_id", companyId).gte("created_at", since),
        supabase.from("crm_cards").select("status").eq("company_id", companyId),
      ]);
      setMsgs(m ?? []); setCards(c ?? []);
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
    return STAGES.map((s, i) => ({ name: s, value: m[s], fill: COLORS[i] }));
  }, [cards]);

  const total = cards.length;
  const ganho = byStage.find((s) => s.name === "ganho")?.value ?? 0;
  const conversao = total ? Math.round((ganho / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 dias.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3">Mensagens por dia (14d)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="mensagens" stroke={brand.primary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3">Cards por estágio</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byStage} dataKey="value" nameKey="name" outerRadius={80} label>
                {byStage.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-3">Conversão</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byStage.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-sm text-muted-foreground mt-2">
            Taxa de conversão (ganhos / total): <span className="font-semibold text-foreground">{conversao}%</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
