import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { brand } from "@/config/brand";
import { Sparkles, LayoutDashboard, Inbox, KanbanSquare, Bot } from "lucide-react";

export const Route = createFileRoute("/demo")({
  component: DemoLayout,
});

const nav = [
  { to: "/demo/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/demo/conversas", label: "Conversas", icon: Inbox },
  { to: "/demo/crm", label: "CRM Kanban", icon: KanbanSquare },
  { to: "/demo/agente", label: "Agente IA", icon: Bot },
];

function DemoLayout() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-white/5 bg-[color:var(--panel)]/80 backdrop-blur px-4 py-2.5 text-sm flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[color:var(--brand)] shadow-[0_0_10px_var(--brand)]" />
          <Sparkles className="size-4 text-[color:var(--brand)]" />
          <span><b className="text-gradient-brand font-display">Modo demonstração</b> — dados de exemplo, somente leitura.</span>
        </div>
        <Link to="/entrar" className="text-sm font-medium px-3 py-1.5 rounded-md bg-gradient-brand text-[#062012] hover:opacity-90">
          Criar conta grátis
        </Link>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="md:w-60 md:min-h-screen md:border-r md:border-white/5 bg-[color:var(--sidebar-bg)] flex md:flex-col">
          <div className="px-5 py-5 md:border-b md:border-white/5">
            <div className="font-display font-bold tracking-tight">{brand.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Demo · Padaria do Bairro</div>
          </div>
          <nav className="flex md:flex-col gap-1 p-3 flex-1 overflow-x-auto">
            {nav.map((it) => {
              const active = loc.pathname === it.to;
              const Icon = it.icon;
              return (
                <Link key={it.to} to={it.to}
                  className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                    active ? "text-foreground bg-white/[0.04]" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[color:var(--brand)] shadow-[0_0_12px_var(--brand)]" />}
                  <Icon className="size-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
