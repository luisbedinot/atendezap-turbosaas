// Tipos / utilitários compartilhados de tenant.
export type CompanyRow = {
  id: string;
  nome: string;
  slug: string;
  primary_color: string;
  logo_url: string | null;
  telefone: string | null;
  status_cobranca: "trial" | "ativo" | "suspenso";
  trial_ate: string;
};

export type Membership = {
  company_id: string;
  role: "owner" | "admin" | "atendente";
  forcar_troca_senha: boolean;
};

export type TenantContext = {
  user: { id: string; email?: string | null };
  company: CompanyRow | null;
  membership: Membership | null;
  isSuperAdmin: boolean;
};

export function trialDaysLeft(trialAte: string): number {
  const end = new Date(trialAte).getTime();
  const ms = end - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "empresa";
}
