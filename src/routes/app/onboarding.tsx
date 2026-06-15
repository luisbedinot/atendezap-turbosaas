import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { brand } from "@/config/brand";
import { slugify } from "@/lib/tenant";
import { Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: `${brand.name} — Bem-vindo` }] }),
  component: Onboarding,
});

const STEPS = ["Empresa", "Identidade", "Agente IA"] as const;

function Onboarding() {
  const ctx = Route.useRouteContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Empresa
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [telefone, setTelefone] = useState("");

  // Identidade
  const [primaryColor, setPrimaryColor] = useState(brand.primary);
  const [logoUrl, setLogoUrl] = useState("");

  // Agente
  const [agente, setAgente] = useState({
    nome_agente: "Atendente Virtual",
    papel_objetivo: "Atender clientes, tirar dúvidas e ajudar a fechar vendas.",
    estilo_comunicacao: "Cordial, profissional e objetivo.",
    sobre_empresa: "",
    produtos_servicos: "",
  });

  // Caso o usuário já tenha empresa (ctx.company não-null), envia para dashboard
  if (ctx.company) {
    if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/app/dashboard", replace: true }), 0);
    return null;
  }

  function next() { if (step < STEPS.length - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }

  async function finalizar() {
    if (!nome.trim()) return toast.error("Informe o nome da empresa.");
    setSaving(true);
    try {
      const finalSlug = (slug || slugify(nome)).slice(0, 48);
      const { data: comp, error: e1 } = await supabase
        .from("company")
        .insert({
          nome: nome.trim(),
          slug: finalSlug,
          primary_color: primaryColor,
          logo_url: logoUrl || null,
          telefone: telefone || null,
          created_by: ctx.user.id,
          status_cobranca: "trial",
        })
        .select("id")
        .single();
      if (e1) throw e1;
      const companyId = comp.id;

      const { error: e2 } = await supabase.from("company_user").insert({
        user_id: ctx.user.id,
        company_id: companyId,
        role: "owner",
        ativo: true,
      });
      if (e2) throw e2;

      const { error: e3 } = await supabase.from("agent_config").insert({
        company_id: companyId,
        user_id: ctx.user.id,
        nome_empresa: nome.trim(),
        ...agente,
      });
      if (e3) throw e3;

      toast.success("Tudo pronto! Bem-vindo ao " + brand.name);
      window.location.href = "/app/dashboard";
    } catch (e: any) {
      toast.error(e.message || "Falha ao criar empresa");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Vamos configurar seu {brand.name}</h1>
        <p className="text-sm text-muted-foreground">Leva menos de 2 minutos.</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            <div className={`text-sm ${i === step ? "font-semibold" : "text-muted-foreground"}`}>{s}</div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        {step === 0 && (
          <>
            <Row label="Nome da empresa">
              <Input value={nome} onChange={(e) => { setNome(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="Ex: Padaria do João" />
            </Row>
            <Row label="Slug (URL amigável)">
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="padaria-do-joao" />
            </Row>
            <Row label="Telefone (opcional)">
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </Row>
          </>
        )}
        {step === 1 && (
          <>
            <Row label="Cor primária">
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded border" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </Row>
            <Row label="URL do logo (opcional)">
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
            </Row>
          </>
        )}
        {step === 2 && (
          <>
            <Row label="Nome do agente">
              <Input value={agente.nome_agente} onChange={(e) => setAgente({ ...agente, nome_agente: e.target.value })} />
            </Row>
            <Row label="Papel e objetivo">
              <Textarea value={agente.papel_objetivo} onChange={(e) => setAgente({ ...agente, papel_objetivo: e.target.value })} rows={2} />
            </Row>
            <Row label="Estilo de comunicação">
              <Textarea value={agente.estilo_comunicacao} onChange={(e) => setAgente({ ...agente, estilo_comunicacao: e.target.value })} rows={2} />
            </Row>
            <Row label="Sobre a empresa">
              <Textarea value={agente.sobre_empresa} onChange={(e) => setAgente({ ...agente, sobre_empresa: e.target.value })} rows={3} />
            </Row>
            <Row label="Produtos / serviços">
              <Textarea value={agente.produtos_servicos} onChange={(e) => setAgente({ ...agente, produtos_servicos: e.target.value })} rows={3} />
            </Row>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={back} disabled={step === 0 || saving}>Voltar</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Avançar</Button>
          ) : (
            <Button onClick={finalizar} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null} Concluir
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
