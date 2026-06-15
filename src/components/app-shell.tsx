import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, Bot, KanbanSquare, LogOut, Smartphone, Shield,
  Inbox, Users, BarChart3, Settings, Contact, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { TrialBanner } from "@/components/trial-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import type { CompanyRow, Membership } from "@/lib/tenant";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  tag?: string;
  badge?: boolean; // unread badge slot
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Atendimento",
    items: [
      { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/app/conversas", label: "Conversas", icon: Inbox, badge: true },
      { to: "/app/crm", label: "CRM Kanban", icon: KanbanSquare },
      { to: "/app/agente", label: "Agente IA", icon: Bot, tag: "IA" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/app/contatos", label: "Contatos", icon: Contact },
      { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/app/conexao", label: "Conexão", icon: Smartphone },
      { to: "/app/equipe", label: "Equipe", icon: Users, adminOnly: true },
      { to: "/app/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
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
  const roleLabel =
    membership?.role === "owner" ? "Dono"
    : membership?.role === "admin" ? "Admin"
    : membership?.role === "atendente" ? "Atendente"
    : "Membro";
  const userName = (email || "Você").split("@")[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" style={{ ["--brand" as any]: primary }}>
      {company && <TrialBanner company={company} />}
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar
          loc={loc}
          company={company}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          primary={primary}
          userName={userName}
          email={email}
          roleLabel={roleLabel}
          signOut={signOut}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
              <span className="size-1.5 rounded-full bg-[color:var(--brand)] shadow-[0_0_10px_var(--brand)]" />
              Plataforma ativa
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  loc, company, isSuperAdmin, isAdmin, primary, userName, email, roleLabel, signOut,
}: any) {
  const initials = (company?.nome || brand.name).slice(0, 2).toUpperCase();
  return (
    <aside className="md:w-[260px] md:min-h-screen md:border-r md:border-white/5 bg-[color:var(--sidebar-bg)] flex md:flex-col">
      {/* brand */}
      <div className="px-5 py-5 flex items-center gap-3 md:border-b md:border-white/5">
        {company?.logo_url ? (
          <img src={company.logo_url} alt={company.nome} className="size-10 rounded-xl object-cover ring-1 ring-white/10" />
        ) : (
          <div
            className="size-10 rounded-xl grid place-items-center text-[#04140B] shadow-md ring-1 ring-white/10"
            style={{ background: `linear-gradient(135deg, ${primary}, #A3E635 70%, #22D3EE)` }}
          >
            <Zap className="size-5" strokeWidth={2.5} />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-display font-extrabold tracking-tight truncate text-[16px]">{brand.name}</div>
          <div className="text-[11px] text-muted-foreground truncate -mt-0.5">{company?.nome || "Sua empresa"}</div>
        </div>
      </div>

      {/* nav */}
      <nav className="p-3 flex-1 overflow-x-auto md:overflow-y-auto space-y-5">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="hidden md:block px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              {sec.label}
            </div>
            <div className="flex md:flex-col gap-1">
              {sec.items.filter((i) => !i.adminOnly || isAdmin).map((item) => (
                <NavLink key={item.to} item={item} active={loc.pathname.startsWith(item.to)} primary={primary} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* footer user block */}
      <div className="hidden md:block p-3 border-t border-white/5">
        {isSuperAdmin && (
          <Link to="/master/painel" className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-destructive hover:bg-white/[0.04]">
            <Shield className="size-4" /> Painel Master
          </Link>
        )}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div
            className="size-9 rounded-full grid place-items-center text-[13px] font-bold text-[#9af0bd] ring-1 ring-[rgba(37,211,102,.25)] shrink-0"
            style={{ background: "rgba(37,211,102,.15)" }}
          >
            {(userName || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold truncate">{userName}</div>
            <div className="text-[11px] text-muted-foreground truncate" title={email || ""}>{roleLabel}</div>
          </div>
          <button onClick={signOut} title="Sair" className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06]">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, active, primary }: { item: NavItem; active: boolean; primary: string }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`relative flex items-center gap-3 px-3 py-[11px] rounded-lg text-[14.5px] font-medium whitespace-nowrap transition-all ${
        active
          ? "text-foreground bg-[rgba(37,211,102,.10)]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
      }`}
      style={active ? { boxShadow: `inset 0 0 0 1px rgba(37,211,102,.15), 0 0 22px -8px ${primary}` } : undefined}
    >
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
          style={{ background: primary, boxShadow: `0 0 12px ${primary}` }}
        />
      )}
      <Icon className="size-[18px] shrink-0" style={active ? { color: primary } : undefined} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.tag && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(37,211,102,.15)] text-[#9af0bd] ring-1 ring-[rgba(37,211,102,.25)]">
          {item.tag}
        </span>
      )}
    </Link>
  );
}
