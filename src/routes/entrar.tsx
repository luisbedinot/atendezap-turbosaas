import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquareText } from "lucide-react";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({ meta: [{ title: `${brand.name} — Entrar` }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app/dashboard" });
  },
  component: EntrarPage,
});

const schema = z.object({ email: z.string().email("E-mail inválido"), password: z.string().min(6, "Mínimo 6 caracteres") });

function EntrarPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function routeAfterLogin() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (roles?.some((r) => r.role === "super_admin")) {
      navigate({ to: "/master/painel", replace: true });
      return;
    }
    const { data: cu } = await supabase.from("company_user").select("company_id").eq("user_id", u.user.id).eq("ativo", true).maybeSingle();
    navigate({ to: cu ? "/app/dashboard" : "/app/onboarding", replace: true });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const v = schema.safeParse({ email, password });
    if (!v.success) return toast.error(v.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    await routeAfterLogin();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const v = schema.safeParse({ email, password });
    if (!v.success) return toast.error(v.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/app/dashboard" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Faça login.");
    setTab("login");
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 relative overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #25D366 0%, transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 size-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 60%)" }} />

      <div className="relative w-full max-w-md panel p-8 glow-brand">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-xl grid place-items-center bg-gradient-brand text-[#062012] shadow-md">
            <MessageSquareText className="size-5" />
          </div>
          <div>
            <div className="font-display font-bold text-xl text-gradient-brand">{brand.name}</div>
            <div className="text-xs text-muted-foreground">{brand.tagline}</div>
          </div>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 mb-5 bg-muted/40 border border-border">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3">
              <Field id="le" label="E-mail" type="email" value={email} onChange={setEmail} />
              <Field id="lp" label="Senha" type="password" value={password} onChange={setPassword} />
              <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-[#062012] hover:opacity-90 font-semibold">
                {loading ? "Entrando…" : "Entrar"}
              </Button>
              <div className="text-right">
                <Link to="/esqueci-senha" className="text-xs text-muted-foreground hover:text-foreground">Esqueci minha senha</Link>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3">
              <Field id="se" label="E-mail" type="email" value={email} onChange={setEmail} />
              <Field id="sp" label="Senha (mín. 6)" type="password" value={password} onChange={setPassword} />
              <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-[#062012] hover:opacity-90 font-semibold">
                {loading ? "Criando…" : "Criar conta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ id, label, type, value, onChange }: { id: string; label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
