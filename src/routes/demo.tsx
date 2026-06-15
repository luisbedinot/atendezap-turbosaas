import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { brand } from "@/config/brand";
import { Sparkles, LayoutDashboard, Inbox, KanbanSquare, Bot, Zap, LogIn } from "lucide-react";

export const Route = createFileRoute("/demo")({
  component: DemoLayout,
});

const items = [
  { to: "/demo/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/demo/conversas", label: "Conversas", icon: Inbox },
  { to: "/demo/crm", label: "CRM Kanban", icon: KanbanSquare },
  { to: "/demo/agente", label: "Agente IA", icon: Bot, tag: "IA" },
];

const PRIMARY = "#25D366";

function DemoLayout() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-white/5 bg-[color:var(--panel)]/80 backdrop-blur px-4 py-2.5 text-[13.5px] flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[color:var(--brand)] shadow-[0_0_10px_var(--brand)]" />
          <Sparkles className="size-4 text-[color:var(--brand)]" />
          <span><b className="text-gradient-brand font-display font-bold">Modo demonstração</b> — dados de exemplo, somente leitura.</span>
        </div>
        <Link to="/entrar" className="text-sm font-semibold px-3 py-1.5 rounded-md bg-gradient-brand text-[#062012] hover:opacity-90">
          Criar conta grátis
        </Link>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="md:w-[260px] md:min-h-screen md:border-r md:border-white/5 bg-[color:var(--sidebar-bg)] flex md:flex-col">
          <div className="px-5 py-5 flex items-center gap-3 md:border-b md:border-white/5">
            <div
              className="size-10 rounded-xl grid place-items-center text-[#04140B] shadow-md ring-1 ring-white/10"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, #A3E635 70%, #22D3EE)` }}
            >
              <Zap className="size-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="font-display font-extrabold tracking-tight truncate text-[16px]">{brand.name}</div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground truncate -mt-0.5">DEMO · Padaria</div>
            </div>
          </div>

          <nav className="p-3 flex-1 overflow-x-auto md:overflow-y-auto">
            <div className="hidden md:block px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              Explorar
            </div>
            <div className="flex md:flex-col gap-1">
              {items.map((it) => {
                const active = loc.pathname === it.to;
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`relative flex items-center gap-3 px-3 py-[11px] rounded-lg text-[14.5px] font-medium whitespace-nowrap transition-all ${
                      active ? "text-foreground bg-[rgba(37,211,102,.10)]" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                    style={active ? { boxShadow: `inset 0 0 0 1px rgba(37,211,102,.15), 0 0 22px -8px ${PRIMARY}` } : undefined}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: PRIMARY, boxShadow: `0 0 12px ${PRIMARY}` }} />
                    )}
                    <Icon className="size-[18px] shrink-0" style={active ? { color: PRIMARY } : undefined} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.tag && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(37,211,102,.15)] text-[#9af0bd] ring-1 ring-[rgba(37,211,102,.25)]">
                        {it.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden md:block p-3 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div
                className="size-9 rounded-full grid place-items-center text-[13px] font-bold text-[#9af0bd] ring-1 ring-[rgba(37,211,102,.25)] shrink-0"
                style={{ background: "rgba(37,211,102,.15)" }}
              >
                V
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold truncate">Visitante</div>
                <div className="text-[11px] text-muted-foreground truncate">Modo demo</div>
              </div>
              <Link to="/entrar" title="Entrar" className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06]">
                <LogIn className="size-4" />
              </Link>
            </div>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
