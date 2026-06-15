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
  const initials = (company?.nome || brand.name).slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" style={{ ["--brand" as any]: primary }}>
      {company && <TrialBanner company={company} />}
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="md:w-64 md:min-h-screen md:border-r md:border-white/5 bg-[color:var(--sidebar-bg)] flex md:flex-col">
          <div className="px-5 py-5 flex items-center gap-3 md:border-b md:border-white/5">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.nome} className="size-10 rounded-xl object-cover ring-1 ring-white/10" />
            ) : (
              <div
                className="size-10 rounded-xl text-white grid place-items-center font-bold text-sm shadow-md"
                style={{ background: `linear-gradient(135deg, ${primary}, #A3E635 70%, #22D3EE)` }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-display font-bold tracking-tight truncate text-foreground">{company?.nome || brand.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground -mt-0.5">{brand.name}</div>
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 p-3 flex-1 overflow-x-auto">
            {nav.filter((i) => !i.adminOnly || isAdmin).map((item) => {
              const active = loc.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                    active
                      ? "text-foreground bg-white/[0.04]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r"
                      style={{ background: `linear-gradient(180deg, ${primary}, #A3E635)`, boxShadow: `0 0 12px ${primary}` }}
                    />
                  )}
                  <Icon className={`size-4 ${active ? "" : "opacity-70"}`} style={active ? { color: primary } : undefined} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex flex-col gap-2 p-3 border-t border-white/5">
            {isSuperAdmin && (
              <Link to="/master/painel" className="text-xs flex items-center gap-1.5 text-destructive hover:text-destructive/80">
                <Shield className="size-3.5" /> Painel Master
              </Link>
            )}
            {email && <div className="text-xs text-muted-foreground truncate" title={email}>{email}</div>}
            <Button variant="outline" size="sm" onClick={signOut} className="border-white/10 bg-white/[0.02] hover:bg-white/[0.06]">
              <LogOut className="size-4 mr-2" /> Sair
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[color:var(--brand)] shadow-[0_0_10px_var(--brand)]" />
              Plataforma ativa
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {email && <span className="hidden md:inline">{email}</span>}
              <div
                className="size-8 rounded-full grid place-items-center text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, #22D3EE)` }}
              >
                {(email || "U").slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
