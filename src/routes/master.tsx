import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { Shield, LogOut } from "lucide-react";
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

function MasterLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ ["--brand" as any]: "#DC2626" }}>
      <aside className="md:w-60 md:min-h-screen border-r bg-[oklch(0.16_0.02_250)] text-white">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-destructive grid place-items-center"><Shield className="size-4" /></div>
          <div>
            <div className="font-semibold">Master</div>
            <div className="text-[10px] text-white/60">{brand.name}</div>
          </div>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          <Link to="/master/painel" className="px-3 py-2 rounded-md text-sm hover:bg-white/10">Painel</Link>
          <Link to="/app/dashboard" className="px-3 py-2 rounded-md text-sm hover:bg-white/10">← Voltar ao app</Link>
        </nav>
        <div className="p-3 border-t border-white/10 mt-auto">
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
