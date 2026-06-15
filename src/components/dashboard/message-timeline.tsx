import { InitialsAvatar } from "@/components/ui/initials-avatar";

export interface TimelineItem {
  id: string;
  nome: string;
  autor: "ia" | "humano" | "contato";
  texto: string;
  quando: Date;
}

export function MessageTimeline({ items, empty }: { items: TimelineItem[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{empty || "Nenhuma atividade ainda."}</p>;
  }
  return (
    <ul>
      {items.map((m) => (
        <li key={m.id} className="flex gap-3 py-3 border-b border-white/8 last:border-b-0">
          <InitialsAvatar
            name={m.nome}
            size={36}
            forceGradient={m.autor === "ia" ? "linear-gradient(135deg,#A3E635,#25D366)" : undefined}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px]">
              <b className="truncate">{m.nome}</b>
              <AuthorBadge autor={m.autor} />
              <span className="ml-auto text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                {m.quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-muted-foreground text-[12.5px] mt-0.5 truncate">{m.texto}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AuthorBadge({ autor }: { autor: "ia" | "humano" | "contato" }) {
  const cls =
    autor === "ia" ? "bg-[rgba(37,211,102,.15)] text-[#9af0bd]"
    : autor === "humano" ? "bg-[rgba(77,163,255,.15)] text-[#a9d3ff]"
    : "bg-white/[0.07] text-muted-foreground";
  const txt = autor === "ia" ? "IA" : autor === "humano" ? "Atendente" : "Contato";
  return <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md ${cls}`}>{txt}</span>;
}
