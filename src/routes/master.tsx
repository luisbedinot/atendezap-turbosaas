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

function MasterLayout() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ ["--brand" as any]: "#DC2626" }}>
      <aside className="md:w-60 md:min-h-screen border-r bg-[oklch(0.16_0.02_250)] text-white flex md:flex-col">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-destructive grid place-items-center"><Shield className="size-4" /></div>
          <div>
            <div className="font-semibold">Master</div>
            <div className="text-[10px] text-white/60">{brand.name}</div>
          </div>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {nav.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
                className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 whitespace-nowrap ${active ? "bg-destructive text-white" : "hover:bg-white/10"}`}>
                <Icon className="size-4" /> {it.label}
              </Link>
            );
          })}
          <Link to="/app/dashboard" className="px-3 py-2 rounded-md text-sm hover:bg-white/10 mt-2 border-t border-white/10 pt-3">← Voltar ao app</Link>
        </nav>
        <div className="p-3 border-t border-white/10 hidden md:block">
          <Button variant="outline" size="sm" className="w-full bg-transparent text-white border-white/20 hover:bg-white/10"
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/entrar"; }}>
            <LogOut className="size-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 bg-background"><Outlet /></main>
    </div>
  );
}
