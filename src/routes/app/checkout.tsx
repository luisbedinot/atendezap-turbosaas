import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { brand } from "@/config/brand";
import { Loader2, ShieldCheck, CreditCard, Sparkles, ArrowLeft } from "lucide-react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createCheckoutCompany } from "@/lib/checkout.functions";

type Search = { plano?: string };

export const Route = createFileRoute("/app/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plano: typeof s.plano === "string" ? s.plano : undefined,
  }),
  head: () => ({ meta: [{ title: `${brand.name} — Começar 3 dias grátis` }] }),
  component: CheckoutPage,
});

type Plano = {
  id: string;
  slug: string;
  nome: string;
  preco_cents: number;
  trial_days: number;
  paddle_price_id: string;
  destaque: boolean;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function defaultCompanyName(email?: string | null) {
  const local = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local ? `Empresa de ${local}` : "Minha empresa";
}

function CheckoutPage() {
  const ctx = Route.useRouteContext();
  const navigate = useNavigate();
  const search = useSearch({ from: "/app/checkout" }) as Search;
  const { openCheckout, loading: paddleLoading } = usePaddleCheckout();
  const createCompany = useServerFn(createCheckoutCompany);

  const [plans, setPlans] = useState<Plano[]>([]);
  const [selected, setSelected] = useState<string | null>(search.plano ?? null);
  const [creating, setCreating] = useState(false);
  const [waitingWebhook, setWaitingWebhook] = useState(false);

  // Se já tem empresa, segue fluxo (onboarding ou dashboard)
  useEffect(() => {
    if (ctx.company) {
      navigate({ href: ctx.company.onboarding_completed ? "/app/dashboard" : "/app/onboarding", replace: true });
    }
  }, [ctx.company, navigate]);

  useEffect(() => {
    supabase.from("plan").select("*").eq("ativo", true).order("ordem")
      .then(({ data }) => {
        if (data?.length) {
          setPlans(data as any);
          if (!selected) setSelected(data[0].slug as string);
        }
      });
  }, []);

  const plano = plans.find((p) => p.slug === selected);

  async function continuar() {
    if (!plano) return toast.error("Selecione um plano.");
    setCreating(true);
    try {
      const { companyId } = await createCompany({ data: { nome: defaultCompanyName(ctx.user.email) } });

      // Abre Paddle Checkout (3d trial — cobrança após validar cartão)
      await openCheckout({
        priceId: plano.paddle_price_id,
        customerEmail: ctx.user.email ?? undefined,
        customData: {
          companyId,
          userId: ctx.user.id,
          planSlug: plano.slug,
        },
        successUrl: `${window.location.origin}/app/onboarding?checkout=success`,
        onCompleted: () => {
          setWaitingWebhook(true);
          // Webhook leva alguns segundos — damos um respiro e levamos para onboarding
          setTimeout(() => {
            window.location.href = "/app/onboarding?checkout=success";
          }, 1500);
        },
        onClosed: () => {
          // Usuário fechou sem concluir — mantemos a empresa em checkout_pending
          // para que ele possa retomar a partir desta mesma página.
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Falha ao iniciar checkout");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft className="size-3.5" /> Sair
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="size-3.5" /> 3 dias grátis
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Quase lá. Vamos liberar sua conta.</h1>
          <p className="text-muted-foreground mt-2 text-sm">Validamos seu cartão para liberar o acesso. Você só é cobrado depois dos 3 dias — cancele antes e não paga nada.</p>
        </div>

        {/* Plano */}
        <Card className="p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">1. Escolha o plano</h2>
            {plano && <div className="text-sm text-muted-foreground">{formatBRL(plano.preco_cents)}<span className="opacity-60">/mês</span> após o trial</div>}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.slug)}
                className={`text-left rounded-xl border-2 p-4 transition relative ${
                  selected === p.slug ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {p.destaque && (
                  <div className="absolute -top-2 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</div>
                )}
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{p.nome}</div>
                <div className="font-display text-2xl mt-1">{formatBRL(p.preco_cents)}<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                <div className="text-xs text-muted-foreground mt-1">{p.trial_days} dias grátis</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Pagamento */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2"><CreditCard className="size-4" /> 2. Validar cartão</h2>
          <p className="text-sm text-muted-foreground mb-4">Vamos abrir um checkout seguro. Sem cobrança nos próximos 3 dias.</p>

          {waitingWebhook ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Confirmando pagamento e liberando sua conta…</span>
            </div>
          ) : (
            <Button
              onClick={continuar}
              disabled={!plano || creating || paddleLoading}
              size="lg"
              className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90 font-semibold"
            >
              {creating || paddleLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              {plano ? `Validar cartão e começar — ${formatBRL(plano.preco_cents)}/mês após trial` : "Selecione um plano"}
            </Button>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Pagamento seguro. Cancele a qualquer momento.
          </div>
        </Card>
      </div>
    </div>
  );
}
