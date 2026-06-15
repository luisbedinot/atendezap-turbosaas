import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Copy } from "lucide-react";
import { brand } from "@/config/brand";
import { createCompanyWithOwner } from "@/lib/master.functions";

export const Route = createFileRoute("/master/nova-empresa")({
  head: () => ({ meta: [{ title: `${brand.name} — Nova empresa` }] }),
  component: NovaEmpresa,
});

function NovaEmpresa() {
  const create = useServerFn(createCompanyWithOwner);
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setTempPwd(null);
    try {
      const r = await create({ data: { nome, ownerEmail } });
      toast.success("Empresa criada");
      setNome(""); setOwnerEmail("");
      if (r.tempPassword) setTempPwd(r.tempPassword);
      else navigate({ to: "/master/empresas" });
    } catch (e: any) { toast.error(e?.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova empresa</h1>
        <p className="text-sm text-muted-foreground">Cria empresa + owner. Se o email não existir, geramos uma senha temporária.</p>
      </div>
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Nome da empresa</Label><Input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Padaria do Bairro" /></div>
          <div><Label>Email do owner</Label><Input required type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="dono@empresa.com" /></div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Plus className="size-4 mr-1.5" />}
              Criar empresa
            </Button>
          </div>
        </form>
        {tempPwd && (
          <div className="mt-4 rounded-md border bg-amber-500/10 p-3 text-sm">
            <div className="font-medium mb-1">Senha temporária do owner</div>
            <div className="text-xs text-muted-foreground mb-2">No primeiro acesso ele será obrigado a trocar.</div>
            <div className="flex items-center gap-2">
              <code className="bg-background px-2 py-1 rounded text-xs flex-1 break-all">{tempPwd}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(tempPwd); toast.success("Copiado"); }}>
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
