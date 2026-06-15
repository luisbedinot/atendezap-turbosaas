import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, MessageSquareText, Bot, KanbanSquare, LogOut, Smartphone, Shield,
  Inbox, Users, BarChart3, Settings, Contact,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { TrialBanner } from "@/components/trial-banner";
import { toast } from "sonner";
import type { CompanyRow, Membership } from "@/lib/tenant";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/conversas", label: "Conversas", icon: Inbox },
  { to: "/app/crm", label: "CRM Kanban", icon: KanbanSquare },
  { to: "/app/contatos", label: "Contatos", icon: Contact },
  { to: "/app/conexao", label: "Conexão", icon: Smartphone },
  { to: "/app/agente", label: "Agente IA", icon: Bot },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/equipe", label: "Equipe", icon: Users, adminOnly: true },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({
  children,
  company,
  membership,
  email,
  isSuperAdmin,
}: {
  children: ReactNode;
  company: CompanyRow | null;
  membership?: Membership | null;
  email?: string | null;
  isSuperAdmin?: boolean;
}) {
  const loc = useLocation();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/entrar", replace: true });
  }

  const primary = company?.primary_color || brand.primary;
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-muted/30" style={{ ["--brand" as any]: primary }}>
      {company && <TrialBanner company={company} />}
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r bg-sidebar flex md:flex-col">
          <div className="px-5 py-4 flex items-center gap-2 md:border-b">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.nome} className="size-8 rounded-lg object-cover" />
            ) : (
              <div className="size-8 rounded-lg text-primary-foreground grid place-items-center font-bold" style={{ background: primary }}>
                <MessageSquareText className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold tracking-tight truncate">{company?.nome || brand.name}</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">{brand.name}</div>
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 p-2 flex-1 overflow-x-auto">
            {nav.filter((i) => !i.adminOnly || isAdmin).map((item) => {
              const active = loc.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                    active
                      ? "text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                  style={active ? { background: primary } : undefined}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex flex-col gap-2 p-3 border-t">
            {isSuperAdmin && (
              <Link to="/master/painel" className="text-xs flex items-center gap-1.5 text-destructive hover:underline">
                <Shield className="size-3.5" /> Painel Master
              </Link>
            )}
            {email && <div className="text-xs text-muted-foreground truncate" title={email}>{email}</div>}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4 mr-2" /> Sair
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
