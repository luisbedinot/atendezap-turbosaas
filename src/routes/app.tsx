import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import type { CompanyRow, Membership } from "@/lib/tenant";

type Ctx = {
  user: { id: string; email?: string | null };
  company: CompanyRow | null;
  membership: Membership | null;
  isSuperAdmin: boolean;
};

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async ({ location }): Promise<Ctx> => {
    const { data: u, error } = await supabase.auth.getUser();
    if (error || !u.user) throw redirect({ to: "/entrar" });

    const [{ data: cu }, { data: roles }] = await Promise.all([
      supabase
        .from("company_user")
        .select("company_id, role, forcar_troca_senha, ativo, created_at, company:company(*)")
        .eq("user_id", u.user.id)
        .eq("ativo", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);

    const isSuperAdmin = (roles ?? []).some((r: any) => r.role === "super_admin");

    if (!cu) {
      if (location.pathname !== "/app/onboarding") throw redirect({ to: "/app/onboarding" });
      return { user: { id: u.user.id, email: u.user.email }, company: null, membership: null, isSuperAdmin };
    }

    if (cu.forcar_troca_senha && location.pathname !== "/trocar-senha") {
      throw redirect({ to: "/trocar-senha" });
    }

    return {
      user: { id: u.user.id, email: u.user.email },
      company: (cu.company as any) as CompanyRow,
      membership: { company_id: cu.company_id, role: cu.role as any, forcar_troca_senha: cu.forcar_troca_senha },
      isSuperAdmin,
    };
  },
  component: AppLayout,
});

function AppLayout() {
  const ctx = Route.useRouteContext();
  if (ctx.company?.status_cobranca === "suspenso") {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-background">
        <div className="max-w-md text-center space-y-3">
          <div className="text-3xl">⛔</div>
          <h1 className="text-2xl font-bold">Conta suspensa</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta foi suspensa por inadimplência. Regularize o pagamento para voltar a usar o {ctx.company.nome}.
          </p>
          <Button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/entrar"; }} variant="outline">
            Sair
          </Button>
        </div>
      </div>
    );
  }
  return (
    <AppShell company={ctx.company} email={ctx.user.email} isSuperAdmin={ctx.isSuperAdmin}>
      <Outlet />
    </AppShell>
  );
}
