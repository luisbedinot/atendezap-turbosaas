import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/master/painel")({
  head: () => ({ meta: [{ title: `${brand.name} — Master` }] }),
  component: Painel,
});

function Painel() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Painel Master</h1>
      <p className="text-sm text-muted-foreground">Aqui você vai gerenciar todas as empresas, usuários, planos e cobrança (Fase C).</p>
      <Card className="p-6 text-sm text-muted-foreground">
        Shell do master pronto. Funcionalidades virão na <b>Fase C</b>:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Listagem de empresas com filtro por status</li>
          <li>Suspender / reativar conta</li>
          <li>Resetar/forçar troca de senha</li>
          <li>Métricas globais</li>
        </ul>
      </Card>
    </div>
  );
}
