import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { LayoutDashboard, MessageSquareText, Bot, KanbanSquare, LogOut, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/conexao", label: "Conexão", icon: Smartphone },
  { to: "/agente", label: "Agente IA", icon: Bot },
  { to: "/kanban", label: "CRM Kanban", icon: KanbanSquare },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r bg-card flex md:flex-col">
        <div className="px-5 py-4 flex items-center gap-2 md:border-b">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
            <MessageSquareText className="size-4" />
          </div>
          <div className="font-semibold tracking-tight">{brand.name}</div>
        </div>
        <nav className="flex md:flex-col gap-1 p-2 flex-1 overflow-x-auto">
          {nav.map((item) => {
            const active = loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex flex-col gap-2 p-3 border-t">
          <div className="text-xs text-muted-foreground truncate" title={email}>{email}</div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
