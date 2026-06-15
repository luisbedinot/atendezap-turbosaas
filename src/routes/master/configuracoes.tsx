import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, X, Save } from "lucide-react";
import { brand } from "@/config/brand";
import { getSuperAdminEmails, setSuperAdminEmails } from "@/lib/master.functions";

export const Route = createFileRoute("/master/configuracoes")({
  head: () => ({ meta: [{ title: `${brand.name} — Master Config` }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const get = useServerFn(getSuperAdminEmails);
  const set = useServerFn(setSuperAdminEmails);
  const [emails, setEmails] = useState<string[]>([]);
  const [novo, setNovo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try { const r = await get(); setEmails(r.emails); } catch (e: any) { toast.error(e?.message); }
      finally { setLoading(false); }
    })();
  }, []);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = novo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return toast.error("Email inválido");
    if (emails.includes(v)) return toast.message("Já está na lista");
    setEmails([...emails, v]); setNovo("");
  }

  async function save() {
    setSaving(true);
    try { await set({ data: { emails } }); toast.success("Salvo"); }
    catch (e: any) { toast.error(e?.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Quem pode acessar o painel master.</p>
      </div>
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Emails de super admin</h2>
        <form onSubmit={add} className="flex gap-2">
          <Input placeholder="email@exemplo.com" value={novo} onChange={(e) => setNovo(e.target.value)} />
          <Button type="submit" variant="outline"><Plus className="size-4 mr-1" /> Adicionar</Button>
        </form>
        {loading ? (
          <div className="grid place-items-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <ul className="space-y-2">
            {emails.length === 0 && <li className="text-sm text-muted-foreground">Nenhum email cadastrado.</li>}
            {emails.map((e) => (
              <li key={e} className="flex items-center justify-between border rounded-md px-3 py-2">
                <span className="text-sm">{e}</span>
                <button onClick={() => setEmails(emails.filter((x) => x !== e))} className="text-muted-foreground hover:text-destructive" title="Remover">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
            Salvar
          </Button>
        </div>
      </Card>
    </div>
  );
}
