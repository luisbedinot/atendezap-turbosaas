import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { Shield, LogOut, BarChart3, Building2, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/master")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/entrar" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const isSuper = (roles ?? []).some((r: any) => r.role === "super_admin");
    if (!isSuper) throw redirect({ to: "/app/dashboard" });
    return { user: u.user };
  },
  component: MasterLayout,
});

const nav = [
  { to: "/master/painel", label: "Painel", icon: BarChart3 },
  { to: "/master/empresas", label: "Empresas", icon: Building2 },
  { to: "/master/nova-empresa", label: "Nova empresa", icon: Plus },
  { to: "/master/configuracoes", label: "Configurações", icon: Settings },
];

const RED = "#FF5A5A";

function MasterLayout() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <aside className="md:w-64 md:min-h-screen md:border-r md:border-white/5 bg-[color:var(--sidebar-bg)] flex md:flex-col">
        <div className="px-5 py-5 flex items-center gap-3 md:border-b md:border-white/5">
          <div
            className="size-10 rounded-xl grid place-items-center text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${RED}, #B91C1C)` }}
          >
            <Shield className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold tracking-tight" style={{ color: RED }}>Master</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{brand.name}</div>
          </div>
        </div>
        <nav className="p-3 flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {nav.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                  active ? "text-foreground bg-white/[0.04]" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                }`}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r"
                    style={{ background: RED, boxShadow: `0 0 12px ${RED}` }}
                  />
                )}
                <Icon className="size-4" style={active ? { color: RED } : undefined} />
                {it.label}
              </Link>
            );
          })}
          <Link to="/app/dashboard" className="mt-3 pt-3 border-t border-white/5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground">
            ← Voltar ao app
          </Link>
        </nav>
        <div className="p-3 border-t border-white/5 hidden md:block">
          <Button variant="outline" size="sm" className="w-full border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/entrar"; }}>
            <LogOut className="size-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto"><Outlet /></main>
    </div>
  );
}
