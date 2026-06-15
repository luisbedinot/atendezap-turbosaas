import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { brand } from "@/config/brand";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/demo")({
  component: DemoLayout,
});

function DemoLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-primary/5 px-4 py-2.5 text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span><b>Modo demonstração</b> — dados de exemplo, somente leitura.</span>
        </div>
        <Link to="/entrar" className="text-sm font-medium underline">Criar minha conta</Link>
      </header>
      <main className="flex-1 bg-muted/30"><Outlet /></main>
    </div>
  );
}
