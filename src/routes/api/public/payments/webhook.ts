import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function findCompanyId(supabase: any, customData: any, customerId: string | null): Promise<string | null> {
  if (customData?.companyId) return customData.companyId as string;
  if (customerId) {
    const { data } = await supabase
      .from("subscription")
      .select("company_id")
      .eq("paddle_customer_id", customerId)
      .maybeSingle();
    if (data?.company_id) return data.company_id as string;
  }
  return null;
}

async function findPlanId(supabase: any, priceExternalId: string | null): Promise<string | null> {
  if (!priceExternalId) return null;
  const { data } = await supabase
    .from("plan")
    .select("id")
    .eq("paddle_price_id", priceExternalId)
    .maybeSingle();
  return data?.id ?? null;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const supabase = await getAdmin();
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;
  const item = items?.[0];
  const priceExternalId = item?.price?.importMeta?.externalId ?? null;

  const companyId = await findCompanyId(supabase, customData, customerId);
  if (!companyId) {
    console.warn("[paddle.webhook] subscription.created without companyId", { id, customData });
    return;
  }
  const planId = await findPlanId(supabase, priceExternalId);

  await supabase.from("subscription").upsert(
    {
      company_id: companyId,
      plan_id: planId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      status,
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      trial_ends_at: data.startedAt && status === "trialing" ? currentBillingPeriod?.endsAt ?? null : null,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      metadata: { env, raw_price_id: item?.price?.id, raw_product_id: item?.product?.id },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  );

  // Reflete no company: tira do trial se passou a pagar
  await supabase
    .from("company")
    .update({ status_cobranca: status === "active" ? "ativo" : status === "trialing" ? "trial" : "pendente" })
    .eq("id", companyId);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const supabase = await getAdmin();
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const item = items?.[0];
  const priceExternalId = item?.price?.importMeta?.externalId ?? null;
  const planId = await findPlanId(supabase, priceExternalId);

  const update: any = {
    status,
    current_period_start: currentBillingPeriod?.startsAt ?? null,
    current_period_end: currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: scheduledChange?.action === "cancel",
    updated_at: new Date().toISOString(),
  };
  if (planId) update.plan_id = planId;

  const { data: row } = await supabase
    .from("subscription")
    .update(update)
    .eq("paddle_subscription_id", id)
    .select("company_id")
    .maybeSingle();

  if (row?.company_id) {
    const billing =
      status === "active" ? "ativo" :
      status === "past_due" ? "pendente" :
      status === "canceled" ? "suspenso" : "trial";
    await supabase.from("company").update({ status_cobranca: billing }).eq("id", row.company_id);
  }
  void env;
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const supabase = await getAdmin();
  const { data: row } = await supabase
    .from("subscription")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .select("company_id, current_period_end")
    .maybeSingle();
  if (row?.company_id) {
    const stillActive = row.current_period_end && new Date(row.current_period_end as string) > new Date();
    await supabase
      .from("company")
      .update({ status_cobranca: stillActive ? "ativo" : "suspenso" })
      .eq("id", row.company_id);
  }
  void env;
}

async function handleTransactionPaymentFailed(data: any) {
  const supabase = await getAdmin();
  if (!data?.subscriptionId) return;
  const { data: row } = await supabase
    .from("subscription")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.subscriptionId)
    .select("company_id")
    .maybeSingle();
  if (row?.company_id) {
    await supabase.from("company").update({ status_cobranca: "pendente" }).eq("id", row.company_id);
  }
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionPaymentFailed:
      await handleTransactionPaymentFailed(event.data);
      break;
    default:
      console.log("[paddle.webhook] unhandled", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[paddle.webhook] error", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
