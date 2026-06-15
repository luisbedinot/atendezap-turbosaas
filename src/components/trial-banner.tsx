import { AlertTriangle, Sparkles } from "lucide-react";
import { trialDaysLeft, type CompanyRow } from "@/lib/tenant";

export function TrialBanner({ company }: { company: CompanyRow }) {
  if (company.status_cobranca !== "trial") return null;
  const days = trialDaysLeft(company.trial_ate);
  const urgent = days <= 3;

  return (
    <div
      className={`px-4 py-2 text-sm flex items-center gap-2 border-b ${
        urgent
          ? "bg-amber-50 text-amber-900 border-amber-200"
          : "bg-primary/5 text-foreground border-primary/15"
      }`}
    >
      {urgent ? <AlertTriangle className="size-4" /> : <Sparkles className="size-4 text-primary" />}
      <span>
        {days > 0
          ? <>Você está no <b>período de teste</b>. Restam <b>{days} {days === 1 ? "dia" : "dias"}</b>.</>
          : <>Seu período de teste terminou. Ative seu plano para continuar com tudo destravado.</>}
      </span>
    </div>
  );
}
