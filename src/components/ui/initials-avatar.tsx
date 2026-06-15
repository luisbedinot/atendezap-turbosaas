import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg,#22D3EE,#25D366)",
  "linear-gradient(135deg,#A3E635,#25D366)",
  "linear-gradient(135deg,#25D366,#22D3EE)",
  "linear-gradient(135deg,#A3E635,#22D3EE)",
  "linear-gradient(135deg,#22D3EE,#A3E635)",
];

function initials(s: string | null | undefined): string {
  if (!s) return "??";
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function InitialsAvatar({
  name,
  size = 36,
  className,
  forceGradient,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
  forceGradient?: string;
}) {
  const key = (name || "?").trim();
  const grad = forceGradient || GRADIENTS[hash(key) % GRADIENTS.length];
  const fontSize = Math.max(10, Math.round(size * 0.36));
  return (
    <div
      className={cn(
        "shrink-0 rounded-full grid place-items-center font-display font-bold text-[#04140B] ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size, background: grad, fontSize }}
    >
      {initials(key)}
    </div>
  );
}
