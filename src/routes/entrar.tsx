import { createFileRoute, redirect, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquareText, Sparkles, Loader2 } from "lucide-react";
import { brand } from "@/config/brand";

type Search = { modo?: "login" | "signup"; plano?: string };

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({ meta: [{ title: `${brand.name} — Começar` }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    modo: s.modo === "login" ? "login" : "signup",
    plano: typeof s.plano === "string" ? s.plano : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const dest = search.plano ? `/app/checkout?plano=${encodeURIComponent(search.plano)}` : "/app/dashboard";
      throw redirect({ href: dest });
    }
  },
  component: EntrarPage,
});

const PLAN_LABEL: Record<string, { nome: string; preco: string }> = {
  starter: { nome: "Starter", preco: "R$ 97/mês" },
  pro: { nome: "Pro", preco: "R$ 197/mês" },
  business: { nome: "Business", preco: "R$ 497/mês" },
};

const emailSchema = z.string().email("E-mail inválido");

function genStrongPassword() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "Az9!" + btoa(String.fromCharCode(...arr)).replace(/[+/=]/g, "x").slice(0, 28);
}

function EntrarPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/entrar" }) as Search;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(search.modo === "login");
  const [loading, setLoading] = useState(false);

  const planInfo = search.plano ? PLAN_LABEL[search.plano] : null;

  async function routeAfterAuth() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (search.plano) {
      navigate({ to: "/app/checkout", search: { plano: search.plano } as any, replace: true });
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (roles?.some((r) => r.role === "super_admin")) {
      navigate({ to: "/master/painel", replace: true });
      return;
    }
    const { data: cu } = await supabase.from("company_user").select("company_id").eq("user_id", u.user.id).eq("ativo", true).maybeSingle();
    navigate({ href: cu ? "/app/dashboard" : "/app/checkout", replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = emailSchema.safeParse(email);
    if (!v.success) return toast.error(v.error.issues[0].message);
    setLoading(true);

    // Se já voltou pedindo senha (conta existente), faz login direto.
    if (needsPassword) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("Senha incorreta. Tente novamente ou recupere sua senha.");
      toast.success("Bem-vindo de volta!");
      return routeAfterAuth();
    }

    // 1 clique: cria conta com senha forte gerada e já entra
    const generated = genStrongPassword();
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: generated,
      options: { emailRedirectTo: window.location.origin + (search.plano ? `/app/checkout?plano=${search.plano}` : "/app/dashboard") },
    });

    if (signUpErr) {
      const msg = (signUpErr.message || "").toLowerCase();
      // Email já existe: pede a senha
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setNeedsPassword(true);
        setLoading(false);
        toast.message("Já existe uma conta com esse e-mail.", { description: "Digite sua senha para continuar." });
        return;
      }
      setLoading(false);
      return toast.error(signUpErr.message);
    }

    // Se tem sessão já (auto_confirm), seguimos
    if (signUpData.session) {
      setLoading(false);
      toast.success("Conta criada! Vamos para o pagamento.");
      return routeAfterAuth();
    }

    // Tenta entrar imediatamente (caso de auto_confirm)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: generated });
    setLoading(false);
    if (signInErr) {
      // Provavelmente exige confirmação por e-mail
      toast.success("Enviamos um link de confirmação para o seu e-mail.");
      return;
    }
    toast.success("Conta criada!");
    routeAfterAuth();
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 relative overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #25D366 0%, transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 size-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 60%)" }} />

      <div className="relative w-full max-w-md panel p-8 glow-brand">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-xl grid place-items-center bg-gradient-brand text-primary-foreground shadow-md">
            <MessageSquareText className="size-5" />
          </div>
          <div>
            <div className="font-display font-bold text-xl text-gradient-brand">{brand.name}</div>
            <div className="text-xs text-muted-foreground">{brand.tagline}</div>
          </div>
        </div>

        {planInfo && (
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Plano escolhido
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="font-display text-lg">{planInfo.nome}</div>
              <div className="text-sm font-semibold">{planInfo.preco}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">3 dias grátis • cancele antes e não paga nada</div>
          </div>
        )}

        <h1 className="font-display text-2xl font-bold mb-1">
          {needsPassword ? "Bem-vindo de volta" : "Comece em 1 clique"}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          {needsPassword ? "Você já tem conta — informe sua senha." : "Só precisamos do seu e-mail. Criamos sua conta na hora e te levamos para o pagamento."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (needsPassword) setNeedsPassword(false); }}
              required
              autoFocus
              placeholder="voce@empresa.com"
            />
          </div>

          {needsPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Senha</Label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
              <div className="text-right">
                <Link to="/esqueci-senha" className="text-xs text-muted-foreground hover:text-foreground">Esqueci minha senha</Link>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} size="lg" className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90 font-semibold">
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            {needsPassword ? "Entrar e continuar" : (planInfo ? "Continuar para o pagamento" : "Criar conta")}
          </Button>

          {!needsPassword && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              Sem cartão para começar os 3 dias grátis. Cancele quando quiser.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
