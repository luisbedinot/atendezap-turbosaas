import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: `${brand.name} — Configurações` }] }),
  beforeLoad: ({ context }: any) => {
    const r = context?.membership?.role;
    if (r === "atendente") throw redirect({ to: "/app/dashboard" });
  },
  component: ConfigPage,
});


function ConfigPage() {
  const ctx = Route.useRouteContext();
  const companyId = ctx.company?.id;
  const userId = ctx.user.id;

  const [empresa, setEmpresa] = useState({ nome: "", telefone: "" });
  const [identidade, setIdentidade] = useState({ primary_color: "#22C55E", logo_url: "" });
  const [perfil, setPerfil] = useState({ nome: "", email: ctx.user.email ?? "" });
  const [senha, setSenha] = useState({ nova: "", confirma: "" });
  const [savingE, setSavingE] = useState(false);
  const [savingI, setSavingI] = useState(false);
  const [savingP, setSavingP] = useState(false);
  const [savingS, setSavingS] = useState(false);

  useEffect(() => {
    if (ctx.company) {
      setEmpresa({ nome: ctx.company.nome, telefone: ctx.company.telefone ?? "" });
      setIdentidade({ primary_color: ctx.company.primary_color, logo_url: ctx.company.logo_url ?? "" });
    }
    void (async () => {
      const { data } = await supabase.from("profiles").select("nome").eq("user_id", userId).maybeSingle();
      if (data) setPerfil((p) => ({ ...p, nome: data.nome ?? "" }));
    })();
  }, [companyId, userId]);

  async function saveEmpresa() {
    if (!companyId) return;
    setSavingE(true);
    const { error } = await supabase.from("company").update({ nome: empresa.nome, telefone: empresa.telefone || null }).eq("id", companyId);
    setSavingE(false);
    if (error) return toast.error(error.message);
    toast.success("Empresa atualizada"); setTimeout(() => location.reload(), 500);
  }

  async function saveIdentidade() {
    if (!companyId) return;
    setSavingI(true);
    const { error } = await supabase.from("company").update({
      primary_color: identidade.primary_color, logo_url: identidade.logo_url || null,
    }).eq("id", companyId);
    setSavingI(false);
    if (error) return toast.error(error.message);
    toast.success("Identidade atualizada"); setTimeout(() => location.reload(), 500);
  }

  async function savePerfil() {
    setSavingP(true);
    const { error } = await supabase.from("profiles").update({ nome: perfil.nome || null }).eq("user_id", userId);
    setSavingP(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
  }

  async function saveSenha() {
    if (senha.nova.length < 8) return toast.error("Mínimo 8 caracteres");
    if (senha.nova !== senha.confirma) return toast.error("Senhas não conferem");
    setSavingS(true);
    const { error } = await supabase.auth.updateUser({ password: senha.nova });
    setSavingS(false);
    if (error) return toast.error(error.message);
    setSenha({ nova: "", confirma: "" });
    toast.success("Senha alterada");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Empresa, identidade e perfil.</p>
      </div>
      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card className="p-5 space-y-4 max-w-xl">
            <div><Label>Nome da empresa</Label><Input value={empresa.nome} onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={empresa.telefone} onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })} /></div>
            <div className="flex justify-end">
              <Button onClick={saveEmpresa} disabled={savingE}>
                {savingE ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />} Salvar
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="identidade">
          <Card className="p-5 space-y-4 max-w-xl">
            <div>
              <Label>Cor primária</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={identidade.primary_color} onChange={(e) => setIdentidade({ ...identidade, primary_color: e.target.value })} className="h-10 w-14 rounded border" />
                <Input value={identidade.primary_color} onChange={(e) => setIdentidade({ ...identidade, primary_color: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>URL do logo</Label>
              <Input value={identidade.logo_url} onChange={(e) => setIdentidade({ ...identidade, logo_url: e.target.value })} placeholder="https://…" />
              {identidade.logo_url && <img src={identidade.logo_url} alt="logo" className="mt-2 size-16 rounded object-cover border" />}
            </div>
            <div className="flex justify-end">
              <Button onClick={saveIdentidade} disabled={savingI}>
                {savingI ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />} Salvar
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="perfil">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold">Meus dados</h2>
              <div><Label>Email</Label><Input value={perfil.email} disabled /></div>
              <div><Label>Nome</Label><Input value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} /></div>
              <div className="flex justify-end">
                <Button onClick={savePerfil} disabled={savingP}>
                  {savingP ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />} Salvar
                </Button>
              </div>
            </Card>
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold">Trocar senha</h2>
              <div><Label>Nova senha</Label><Input type="password" value={senha.nova} onChange={(e) => setSenha({ ...senha, nova: e.target.value })} /></div>
              <div><Label>Confirmar</Label><Input type="password" value={senha.confirma} onChange={(e) => setSenha({ ...senha, confirma: e.target.value })} /></div>
              <div className="flex justify-end">
                <Button onClick={saveSenha} disabled={savingS}>
                  {savingS ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />} Trocar
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
