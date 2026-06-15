import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export function KpiCard({
  icon, label, value, trend, accent, className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        accent
          ? "border-[rgba(37,211,102,.3)] bg-[linear-gradient(160deg,rgba(37,211,102,.14),rgba(37,211,102,.02))]"
          : "border-white/8 bg-[var(--panel)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <span className="grid place-items-center text-[var(--brand-strong)]">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="font-display font-extrabold text-2xl sm:text-3xl mt-2 tracking-tight">{value}</div>
      {trend && (
        <div className="text-xs mt-2 text-[var(--brand-strong)] flex items-center gap-1.5">
          <TrendingUp className="size-3.5" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
