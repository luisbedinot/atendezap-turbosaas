import { createFileRoute, redirect } from "@tanstack/react-router";
import { brand } from "@/config/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `${brand.name} — IA que atende WhatsApp 24/7 + CRM Kanban` },
      { name: "description", content: "Conecte seu WhatsApp em 1 minuto. A IA responde, qualifica leads e organiza tudo num kanban que anda sozinho." },
      { property: "og:title", content: `${brand.name} — IA + WhatsApp + CRM` },
      { property: "og:description", content: "IA que atende seu WhatsApp 24/7 e organiza seu CRM sozinha." },
    ],
  }),
  component: Landing,
});

function Landing() {
  async function cta(path: "/entrar" | "/demo/dashboard") {
    const { data } = await supabase.auth.getUser();
    if (data.user && path === "/entrar") {
      window.location.href = "/app/dashboard";
    } else {
      window.location.href = path;
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.12_0.02_250)] text-white">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center font-bold text-primary-foreground">A</div>
          <span className="font-bold tracking-tight">{brand.name}</span>
        </div>
        <nav className="flex items-center gap-2">
          <button onClick={() => cta("/demo/dashboard")} className="text-sm px-3 py-2 hover:underline">Ver demo</button>
          <button onClick={() => cta("/entrar")} className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">Entrar</button>
        </nav>
      </header>

      <section className="px-6 pt-16 pb-24 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/15 text-primary mb-6">
          <span className="size-1.5 rounded-full bg-primary" /> WhatsApp + IA + CRM
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          IA que atende seus leads no <span className="text-primary">WhatsApp 24/7</span><br className="hidden md:block" />
          e organiza seu CRM <span className="text-primary">sozinha</span>.
        </h1>
        <p className="mt-5 text-lg text-white/70 max-w-2xl mx-auto">
          Em poucos minutos sua linha de WhatsApp começa a responder com a personalidade da sua empresa,
          qualificar contatos e mover cards no kanban automaticamente.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => cta("/entrar")} className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">Começar grátis (14 dias)</button>
          <button onClick={() => cta("/demo/dashboard")} className="px-6 py-3 rounded-md border border-white/20 hover:bg-white/5">Ver demonstração</button>
        </div>
      </section>

      <section className="px-6 py-12 max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        {[
          { t: "Inbox unificado", d: "Todas as conversas do WhatsApp num só lugar, com histórico completo por contato." },
          { t: "IA que responde", d: "Treina com sua empresa em 1 tela. Responde como você responderia — só que 24h por dia." },
          { t: "CRM que anda sozinho", d: "A IA classifica conversas em Conversa / Negociação / Ganho / Perda e move os cards." },
        ].map((b) => (
          <div key={b.t} className="rounded-2xl p-6 bg-white/5 border border-white/10">
            <h3 className="font-semibold text-lg">{b.t}</h3>
            <p className="text-white/70 text-sm mt-2">{b.d}</p>
          </div>
        ))}
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Planos simples</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "Starter", p: "R$ 97", f: ["1 número WhatsApp", "IA Gemini", "CRM Kanban", "Trial 14 dias"] },
            { n: "Pro", p: "R$ 197", f: ["Tudo do Starter", "Histórico ilimitado", "Múltiplos atendentes", "Suporte prioritário"], highlight: true },
            { n: "Business", p: "R$ 497", f: ["Tudo do Pro", "Branding personalizado", "Domínio próprio", "API & integrações"] },
          ].map((p) => (
            <div key={p.n} className={`rounded-2xl p-6 border ${p.highlight ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10"}`}>
              <div className="text-sm text-white/70">{p.n}</div>
              <div className="text-3xl font-bold mt-1">{p.p}<span className="text-sm text-white/60 font-normal">/mês</span></div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.f.map((x) => <li key={x} className="flex gap-2"><span className="text-primary">✓</span>{x}</li>)}
              </ul>
              <button onClick={() => cta("/entrar")} className={`mt-6 w-full px-4 py-2.5 rounded-md font-medium ${p.highlight ? "bg-primary text-primary-foreground" : "border border-white/20 hover:bg-white/5"}`}>
                Começar
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-white/50 border-t border-white/10">
        © {new Date().getFullYear()} {brand.name}. Feito pra atender melhor.
      </footer>
    </div>
  );
}

// Static helper to avoid Tree shaking warning for redirect import
export const _unused = redirect;
