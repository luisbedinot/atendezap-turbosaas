import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { Shield, LogOut, BarChart3, Building2, Plus, Settings, ArrowLeft } from "lucide-react";

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

const sections = [
  {
    label: "Operação",
    items: [
      { to: "/master/painel", label: "Painel", icon: BarChart3 },
      { to: "/master/empresas", label: "Empresas", icon: Building2 },
    ],
  },
  {
    label: "Administração",
    items: [
      { to: "/master/nova-empresa", label: "Nova empresa", icon: Plus },
      { to: "/master/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

const RED = "#FF5A5A";

function MasterLayout() {
  const loc = useLocation();
  const ctx = Route.useRouteContext() as any;
  const email: string | null = ctx?.user?.email ?? null;
  const userName = (email || "Master").split("@")[0];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <aside className="md:w-[260px] md:min-h-screen md:border-r md:border-white/5 bg-[color:var(--sidebar-bg)] flex md:flex-col">
        <div className="px-5 py-5 flex items-center gap-3 md:border-b md:border-white/5">
          <div
            className="size-10 rounded-xl grid place-items-center text-white shadow-md ring-1 ring-white/10"
            style={{ background: `linear-gradient(135deg, ${RED}, #B91C1C)` }}
          >
            <Shield className="size-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="font-display font-extrabold tracking-tight truncate text-[16px]" style={{ color: RED }}>
              Master
            </div>
            <div className="text-[11px] text-muted-foreground truncate -mt-0.5">{brand.name} · admin</div>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-x-auto md:overflow-y-auto space-y-5">
          {sections.map((sec) => (
            <div key={sec.label}>
              <div className="hidden md:block px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {sec.label}
              </div>
              <div className="flex md:flex-col gap-1">
                {sec.items.map((it) => {
                  const active = loc.pathname.startsWith(it.to);
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={`relative flex items-center gap-3 px-3 py-[11px] rounded-lg text-[14.5px] font-medium whitespace-nowrap transition-all ${
                        active ? "text-foreground bg-[rgba(255,90,90,.10)]" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                      }`}
                      style={active ? { boxShadow: `inset 0 0 0 1px rgba(255,90,90,.18), 0 0 22px -8px ${RED}` } : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: RED, boxShadow: `0 0 12px ${RED}` }} />
                      )}
                      <Icon className="size-[18px] shrink-0" style={active ? { color: RED } : undefined} />
                      <span className="flex-1 truncate">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <Link to="/app/dashboard" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/[0.03]">
            <ArrowLeft className="size-3.5" /> Voltar ao app
          </Link>
        </nav>

        <div className="hidden md:block p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div
              className="size-9 rounded-full grid place-items-center text-[13px] font-bold text-white ring-1 shrink-0"
              style={{ background: "rgba(255,90,90,.18)", color: "#FFB1B1", boxShadow: "inset 0 0 0 1px rgba(255,90,90,.25)" }}
            >
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold truncate">{userName}</div>
              <div className="text-[11px] truncate" style={{ color: "#FF9B9B" }}>Super admin</div>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/entrar"; }}
              title="Sair"
              className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto"><Outlet /></main>
    </div>
  );
}
