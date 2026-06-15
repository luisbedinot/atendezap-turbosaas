import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { brand } from "@/config/brand";
import { Building2, MessageSquareText, KanbanSquare, TrendingUp } from "lucide-react";
import { masterKpis } from "@/lib/master.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/master/painel")({
  head: () => ({ meta: [{ title: `${brand.name} — Master` }] }),
  component: Painel,
});

function Painel() {
  const kpis = useServerFn(masterKpis);
  const [data, setData] = useState<{ stats: any; series: { mes: string; total: number }[] } | null>(null);

  useEffect(() => {
    void (async () => {
      try { setData(await kpis()); } catch (e: any) { toast.error(e?.message); }
    })();
  }, []);

  if (!data) return <div className="text-sm text-muted-foreground">Carregando…</div>;
  const s = data.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Master</h1>
        <p className="text-sm text-muted-foreground">Visão geral de toda a plataforma.</p>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Building2 className="size-4" />} label="Empresas" value={s.total} />
        <Stat icon={<TrendingUp className="size-4" />} label="Ativas" value={s.ativas} />
        <Stat icon={<TrendingUp className="size-4" />} label="Em trial" value={s.trial} />
        <Stat icon={<TrendingUp className="size-4" />} label="Suspensas" value={s.suspensas} accent />
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Stat icon={<Building2 className="size-4" />} label="Novas no mês" value={s.novasMes} />
        <Stat icon={<MessageSquareText className="size-4" />} label="Mensagens (total)" value={s.mensagens} />
        <Stat icon={<KanbanSquare className="size-4" />} label="Cards (total)" value={s.cards} />
      </div>
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Crescimento de empresas (12 meses)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="mes" fontSize={11} stroke="#8AA89A" />
            <YAxis fontSize={11} allowDecimals={false} stroke="#8AA89A" />
            <Tooltip contentStyle={{ background: "#13211A", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, color: "#EAF6EF" }} />
            <Line type="monotone" dataKey="total" stroke="#FF5A5A" strokeWidth={2} dot={{ r: 3, fill: "#FF5A5A" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-destructive/30 bg-destructive/5" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}
