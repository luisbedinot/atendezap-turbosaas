import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { brand } from "@/config/brand";
import {
  Loader2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowLeft,
  Check,
  Zap,
  TrendingUp,
  Crown,
  Smartphone,
  Users,
  MessageSquare,
  Headphones,
  Calendar,
  BarChart3,
  Webhook,
} from "lucide-react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createCheckoutCompany } from "@/lib/checkout.functions";

type Search = { plano?: string };

type Plano = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  preco_cents: number;
  trial_days: number;
  paddle_price_id: string;
  destaque: boolean;
  limite_mensagens: number;
  limite_instancias: number;
  limite_usuarios: number;
  limite_contatos: number;
  features: string[];
};

export const Route = createFileRoute("/app/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plano: typeof s.plano === "string" ? s.plano : undefined,
  }),
  head: () => ({ meta: [{ title: `${brand.name} — Escolha seu plano` }] }),
  component: CheckoutPage,
});

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function defaultCompanyName(email?: string | null) {
  const local = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local ? `Empresa de ${local}` : "Minha empresa";
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  "número de WhatsApp": <Smartphone className="size-4" />,
  "usuários": <Users className="size-4" />,
  "conversas": <MessageSquare className="size-4" />,
  "contatos": <Users className="size-4" />,
  "CRM": <BarChart3 className="size-4" />,
  "IA": <Zap className="size-4" />,
  "Google Agenda": <Calendar className="size-4" />,
  "Relatórios": <BarChart3 className="size-4" />,
  "Suporte": <Headphones className="size-4" />,
  "API": <Webhook className="size-4" />,
  "Webhooks": <Webhook className="size-4" />,
  "Onboarding": <Crown className="size-4" />,
  "Gerente": <Crown className="size-4" />,
  "SLA": <ShieldCheck className="size-4" />,
};

function featureIcon(text: string) {
  for (const key of Object.keys(FEATURE_ICONS)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return FEATURE_ICONS[key];
  }
  return <Check className="size-4" />;
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

  useEffect(() => {
    if (ctx.company) {
      navigate({ href: ctx.company.onboarding_completed ? "/app/dashboard" : "/app/onboarding", replace: true });
    }
  }, [ctx.company, navigate]);

  useEffect(() => {
    supabase
      .from("plan")
      .select("*")
      .eq("ativo", true)
      .order("ordem")
      .then(({ data }) => {
        if (data?.length) {
          const list = data as Plano[];
          setPlans(list);
          if (!selected || !list.find((p) => p.slug === selected)) {
            // Default to the highlighted plan, or the first one.
            const highlighted = list.find((p) => p.destaque) ?? list[0];
            setSelected(highlighted.slug);
          }
        }
      });
  }, []);

  const plano = useMemo(() => plans.find((p) => p.slug === selected), [plans, selected]);

  async function continuar() {
    if (!plano) return toast.error("Selecione um plano.");
    setCreating(true);
    try {
      const { companyId } = await createCompany({ data: { nome: defaultCompanyName(ctx.user.email) } });

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
          setTimeout(() => {
            window.location.href = "/app/onboarding?checkout=success";
          }, 1500);
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

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft className="size-3.5" /> Sair
        </button>

        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="size-3.5 mr-1.5" />
            {plans[0]?.trial_days ?? 3} dias grátis em todos os planos
          </Badge>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Escolha o plano ideal para escalar suas vendas
          </h1>
          <p className="text-muted-foreground mt-3 text-base md:text-lg">
            Você começa no trial sem pagar nada. Cancele antes do prazo e não é cobrado.
            Pode trocar de plano a qualquer momento.
          </p>
          {search.plano && (
            <p className="text-sm text-muted-foreground mt-2">
              Plano pré-selecionado da landing page: <span className="font-semibold text-foreground capitalize">{search.plano}</span>.
              Aqui você pode comparar e mudar se quiser.
            </p>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Plan cards */}
            <div className="grid md:grid-cols-3 gap-4 lg:gap-6 items-stretch mb-10 md:mb-14">
              {plans.map((p) => {
                const isSelected = selected === p.slug;
                return (
                  <Card
                    key={p.id}
                    className={`relative flex flex-col p-6 md:p-7 transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl"
                        : "hover:shadow-md"
                    } ${p.destaque ? "md:-my-4 md:py-10 border-primary/30 bg-gradient-to-b from-primary/5 to-background" : ""}`}
                  >
                    {p.destaque && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary px-3 py-1 text-[10px] uppercase tracking-wider font-bold shadow-sm">
                          <TrendingUp className="size-3 mr-1" />
                          Mais popular · 4× mais conversas
                        </Badge>
                      </div>
                    )}

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {p.nome}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                            <Check className="size-3" /> Selecionado
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold">{formatBRL(p.preco_cents)}</span>
                        <span className="text-muted-foreground text-sm">/mês</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 min-h-[2.5rem]">{p.descricao}</p>
                    </div>

                    {/* Limits summary */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      <Limit label="WhatsApp" v={p.limite_instancias} />
                      <Limit label="Usuários" v={p.limite_usuarios} />
                      <Limit label="Conversas/mês" v={p.limite_mensagens} />
                      <Limit label="Contatos" v={p.limite_contatos} />
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 text-sm flex-1 mb-6">
                      {(p.features || []).map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span className="mt-0.5 size-5 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                            {featureIcon(f)}
                          </span>
                          <span className="text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => setSelected(p.slug)}
                      variant={isSelected ? "default" : "outline"}
                      size="lg"
                      className="w-full font-semibold"
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-4 mr-1.5" /> Plano escolhido
                        </>
                      ) : p.destaque ? (
                        "Quero o mais popular"
                      ) : (
                        "Escolher este plano"
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>

            {/* Payment CTA */}
            <div className="max-w-2xl mx-auto">
              <Card className="p-6 md:p-8 text-center">
                {waitingWebhook ? (
                  <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Confirmando pagamento e liberando sua conta…</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <CreditCard className="size-5 text-primary" />
                      <h2 className="font-display text-xl font-bold">Validar cartão e começar o trial</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">
                      Plano selecionado: <span className="font-semibold text-foreground">{plano?.nome}</span> —{" "}
                      {formatBRL(plano?.preco_cents ?? 0)}/mês após os {plano?.trial_days ?? 3} dias grátis.
                      Sem cobrança agora.
                    </p>
                    <Button
                      onClick={continuar}
                      disabled={!plano || creating || paddleLoading}
                      size="lg"
                      className="w-full md:w-auto min-w-[280px] bg-gradient-brand text-primary-foreground hover:opacity-90 font-semibold"
                    >
                      {creating || paddleLoading ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="size-4 mr-2" />
                      )}
                      {plano
                        ? `Começar trial no ${plano.nome} — validar cartão`
                        : "Selecione um plano"}
                    </Button>
                  </>
                )}

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" />
                  Pagamento seguro. Cancele a qualquer momento.
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Limit({ label, v }: { label: string; v: number }) {
  return (
    <div className="bg-muted/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{v.toLocaleString("pt-BR")}</span>
    </div>
  );
}
