import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogIn, Pause, Play, CalendarClock, Loader2, KeyRound, Eye } from "lucide-react";
import { brand } from "@/config/brand";
import { listCompanies, suspendCompany, extendTrial, resetCompanyOwnerPassword, getCompanyDetails } from "@/lib/master.functions";

export const Route = createFileRoute("/master/empresas")({
  head: () => ({ meta: [{ title: `${brand.name} — Empresas` }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const navigate = useNavigate();
  const list = useServerFn(listCompanies);
  const suspend = useServerFn(suspendCompany);
  const extend = useServerFn(extendTrial);
  const resetPwd = useServerFn(resetCompanyOwnerPassword);
  const details = useServerFn(getCompanyDetails);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const r = await list({ data: { search, page } });
      setRows(r.rows); setTotal(r.total); setPageSize(r.pageSize);
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void reload(); }, [page]);

  function impersonate(companyId: string) {
    try {
      sessionStorage.setItem("master_impersonate_company", companyId);
      toast.success("Entrando como empresa…");
      navigate({ to: "/app/dashboard" });
    } catch (e: any) { toast.error(e?.message); }
  }

  async function toggleSuspend(c: any) {
    const next = c.status_cobranca !== "suspenso";
    await suspend({ data: { companyId: c.id, suspend: next } });
    toast.success(next ? "Empresa suspensa" : "Empresa reativada");
    reload();
  }

  async function doExtend(c: any) {
    const days = Number(prompt("Estender trial por quantos dias?", "14"));
    if (!days || isNaN(days)) return;
    await extend({ data: { companyId: c.id, days } });
    toast.success(`Trial estendido +${days}d`);
    reload();
  }

  async function doResetPassword(c: any) {
    const custom = prompt(
      `Definir senha do responsável de "${c.nome}".\n\nDeixe em branco para gerar uma senha temporária (forçará troca no próximo login).\nOu digite uma senha (mín. 8 caracteres):`,
      "",
    );
    if (custom === null) return;
    const newPassword = custom.trim();
    if (newPassword && newPassword.length < 8) return toast.error("Mínimo 8 caracteres");
    try {
      const r: any = await resetPwd({ data: { companyId: c.id, newPassword: newPassword || undefined } });
      if (r.tempPassword) {
        try { await navigator.clipboard.writeText(r.tempPassword); } catch {}
        toast.success(
          `Senha temporária para ${r.ownerEmail ?? "responsável"}: ${r.tempPassword} (copiada)`,
          { duration: 20000 },
        );
      } else {
        toast.success(`Senha atualizada para ${r.ownerEmail ?? "responsável"}`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao redefinir senha");
    }
  }

  const pages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">{total} no total</p>
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(0); reload(); }}>
          <Input placeholder="Buscar por nome…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button type="submit" variant="outline">Buscar</Button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2">
          <div className="col-span-3">Nome</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Trial até</div>
          <div className="col-span-2">Criada</div>
          <div className="col-span-1">Atividade</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {loading ? (
          <div className="p-8 grid place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma empresa.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li key={c.id} className="grid grid-cols-12 px-4 py-3 items-center text-sm">
                <div className="col-span-3 min-w-0">
                  <div className="font-medium truncate">{c.nome}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.slug}</div>
                </div>
                <div className="col-span-2">
                  <StatusBadge s={c.status_cobranca} />
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {c.trial_ate ? new Date(c.trial_ate).toLocaleDateString("pt-BR") : "—"}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">
                  {c.ultima_atividade ? new Date(c.ultima_atividade).toLocaleDateString("pt-BR") : "—"}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <Button size="sm" variant="outline" onClick={() => doResetPassword(c)} title="Redefinir senha do responsável">
                    <KeyRound className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doExtend(c)} title="Estender trial">
                    <CalendarClock className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleSuspend(c)}
                    title={c.status_cobranca === "suspenso" ? "Reativar" : "Suspender"}>
                    {c.status_cobranca === "suspenso" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  </Button>
                  <Button size="sm" onClick={() => impersonate(c.id)} title="Entrar como">
                    <LogIn className="size-3.5 mr-1" /> Entrar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Anterior</Button>
          <span className="text-muted-foreground">Página {page + 1} de {pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}>Próxima</Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  if (s === "ativo") return <Badge className="bg-primary">Ativa</Badge>;
  if (s === "trial") return <Badge variant="secondary">Trial</Badge>;
  return <Badge variant="destructive">Suspensa</Badge>;
}
