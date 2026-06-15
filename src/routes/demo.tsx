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
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-primary/10 px-4 py-2.5 text-sm flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span><b>Modo demonstração</b> — dados de exemplo, somente leitura.</span>
        </div>
        <Link to="/entrar" className="text-sm font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90">
          Criar conta grátis
        </Link>
      </header>
      <div className="flex flex-1 flex-col md:flex-row bg-muted/30">
        <aside className="md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r bg-sidebar flex md:flex-col">
          <div className="px-5 py-4 md:border-b">
            <div className="font-semibold tracking-tight">{brand.name}</div>
            <div className="text-[10px] text-muted-foreground">Demo Padaria do Bairro</div>
          </div>
          <nav className="flex md:flex-col gap-1 p-2 flex-1 overflow-x-auto">
            {nav.map((it) => {
              const active = loc.pathname === it.to;
              const Icon = it.icon;
              return (
                <Link key={it.to} to={it.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                  <Icon className="size-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
