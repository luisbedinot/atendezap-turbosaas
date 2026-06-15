import { createFileRoute, redirect } from "@tanstack/react-router";
import { brand } from "@/config/brand";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  Zap,
  Play,
  Check,
  MessageSquareText,
  Bot,
  KanbanSquare,
  Users,
  PauseCircle,
  LineChart,
  Star,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `${brand.name} — IA atende seu WhatsApp 24h e organiza o CRM sozinha` },
      {
        name: "description",
        content:
          "Conecte seu número de WhatsApp em 2 minutos. A IA do AtendeZap responde, qualifica e move cada lead no funil automaticamente. 14 dias grátis, sem cartão.",
      },
      { property: "og:title", content: `${brand.name} — WhatsApp + IA + CRM no automático` },
      {
        property: "og:description",
        content: "Sua IA atende o WhatsApp 24h e organiza o CRM sozinha.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  async function cta(path: "/entrar" | "/demo/dashboard") {
    if (path === "/entrar") {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          window.location.href = "/app/dashboard";
          return;
        }
      } catch {}
    }
    window.location.href = path;
  }

  useScrollReveal();

  return (
    <div
      className="min-h-screen w-full text-white antialiased overflow-x-hidden"
      style={{
        background: "#04100A",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* radial glows — absolute (não fixed) e mais leves no mobile pra fluidez */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1400px] z-0 overflow-hidden">
        <div
          className="hidden md:block absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #25D366 0%, transparent 60%)" }}
        />
        <div
          className="hidden md:block absolute top-[20%] -right-40 h-[700px] w-[700px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 65%)" }}
        />
        <div
          className="md:hidden absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full opacity-30 blur-2xl"
          style={{ background: "radial-gradient(circle, #25D366 0%, transparent 60%)" }}
        />
      </div>

      <div className="relative z-10">
        <Header onCta={cta} />
        <Hero onCta={cta} />
        <Stats />
        <Pain />
        <HowItWorks />
        <Features />
        <Pricing onCta={cta} />
        <Testimonials />
        <Faq />
        <FinalCta onCta={cta} />
        <Footer />
      </div>

      <style>{`
        html { scroll-behavior: smooth; }
        .font-display { font-family: 'Sora', 'Inter', system-ui, sans-serif; font-weight: 800; letter-spacing: -0.02em; }
        .text-grad {
          background: linear-gradient(95deg, #25D366 0%, #a3e635 45%, #22d3ee 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .btn-glow {
          box-shadow: 0 10px 30px -12px rgba(37,211,102,0.55), 0 0 0 1px rgba(37,211,102,0.35) inset;
        }
        .glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
        }
        .glass-strong {
          background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.14);
        }
        @media (min-width: 768px) {
          .glass { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
          .glass-strong { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
        }
        .dot-pulse { position: relative; }
        .dot-pulse::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: 9999px;
          background: #25D366;
          animation: dot-pulse 1.8s ease-out infinite;
          opacity: 0.6;
        }
        @keyframes dot-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          80%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float-y 6s ease-in-out infinite; will-change: transform; }
        @media (max-width: 640px) { .animate-float { animation: none; } }
        .reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s ease; will-change: opacity, transform; }
        .reveal.in { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; transition: none; }
          .animate-float { animation: none; }
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}</style>
    </div>
  );
}

/* ===================== HEADER ===================== */
function Header({ onCta }: { onCta: (p: "/entrar" | "/demo/dashboard") => void }) {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{ background: "rgba(4,16,10,0.55)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl btn-glow" style={{ background: "linear-gradient(135deg,#25D366,#16a34a)" }}>
            <Zap className="size-4 text-black" strokeWidth={2.6} />
          </span>
          <span className="font-display text-lg">{brand.name}</span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
          <a href="#como" className="hover:text-white transition">Como funciona</a>
          <a href="#recursos" className="hover:text-white transition">Recursos</a>
          <a href="#planos" className="hover:text-white transition">Planos</a>
          <a href="#faq" className="hover:text-white transition">Dúvidas</a>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => onCta("/entrar")} className="hidden sm:inline text-sm px-4 py-2 rounded-lg text-white/80 hover:text-white">
            Entrar
          </button>
          <button
            onClick={() => onCta("/entrar")}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg text-black btn-glow"
            style={{ background: "linear-gradient(135deg,#25D366,#16a34a)" }}
          >
            Começar grátis
          </button>
        </div>
      </div>
    </header>
  );
}

/* ===================== HERO ===================== */
function Hero({ onCta }: { onCta: (p: "/entrar" | "/demo/dashboard") => void }) {
  return (
    <section className="relative px-4 sm:px-6 md:px-8 pt-10 md:pt-24 pb-16 md:pb-20">
      <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] opacity-40" />
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-10 md:gap-14 items-center relative">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass">
            <span className="relative inline-block size-2 rounded-full bg-[#25D366] dot-pulse" />
            <span className="text-white/80 font-medium">WhatsApp + IA + CRM no automático</span>
          </div>

          <h1 className="font-display text-[clamp(2rem,7vw,4.6rem)] leading-[1.05] mt-5">
            Sua IA atende o WhatsApp <span className="text-grad">24h</span> e organiza o CRM <span className="text-grad">sozinha</span>.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/65 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Conecte seu número, treine o agente em uma tela e veja cada lead ser respondido na hora,
            qualificado e movido no funil — sem você levantar o dedo.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
            <button
              onClick={() => onCta("/entrar")}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-black font-semibold btn-glow"
              style={{ background: "linear-gradient(135deg,#25D366,#16a34a)" }}
            >
              Começar grátis (14 dias)
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => onCta("/demo/dashboard")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass-strong text-white/90 hover:bg-white/10 transition"
            >
              <Play className="size-4" /> Ver demonstração
            </button>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-white/55">
            <li className="flex items-center gap-1.5"><Check className="size-4 text-[#25D366]" /> Sem cartão</li>
            <li className="flex items-center gap-1.5"><Check className="size-4 text-[#25D366]" /> Conecta em 2 minutos</li>
            <li className="flex items-center gap-1.5"><Check className="size-4 text-[#25D366]" /> Cancele quando quiser</li>
          </ul>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="relative animate-float">
      {/* glow */}
      <div
        className="absolute -inset-10 rounded-[3rem] blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, #25D366 0%, transparent 60%)" }}
      />
      {/* phone */}
      <div
        className="relative w-[300px] sm:w-[340px] h-[640px] rounded-[2.5rem] p-3 shadow-2xl"
        style={{ background: "linear-gradient(180deg,#1a1f1d,#0b0f0d)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="relative w-full h-full rounded-[2rem] overflow-hidden flex flex-col"
          style={{ background: "#0b1410" }}
        >
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] text-white/60">
            <span>9:41</span>
            <span>●●● 5G</span>
          </div>
          {/* chat header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#111d18", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="grid place-items-center size-9 rounded-full text-black font-bold" style={{ background: "linear-gradient(135deg,#25D366,#16a34a)" }}>
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">AtendeZap • IA</div>
              <div className="text-[10px] text-[#25D366] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#25D366]" /> online agora
              </div>
            </div>
          </div>
          {/* messages */}
          <div className="flex-1 px-3 py-4 space-y-3 overflow-hidden">
            <Bubble side="left" delay="0s">Oi! Vi o anúncio do site. Vocês ainda têm vaga pra essa semana?</Bubble>
            <Bubble side="right" delay=".4s">Oi Marina, tudo bem? 👋 Temos sim! Pra qual serviço você tá pensando?</Bubble>
            <Bubble side="left" delay=".8s">Quero fazer design de sobrancelha + cílios</Bubble>
            <Bubble side="right" delay="1.2s">
              Perfeito 🤌 Tenho quinta 15h ou sexta 10h. Qual prefere?
            </Bubble>
            <div className="flex items-center gap-2 text-[10px] text-white/50 pl-2 reveal" style={{ animationDelay: "1.6s" }}>
              <Sparkles className="size-3 text-[#25D366]" />
              respondido pela IA em 3s
            </div>
          </div>
          {/* input */}
          <div className="px-3 py-3 flex items-center gap-2" style={{ background: "#111d18" }}>
            <div className="flex-1 h-9 rounded-full px-4 text-xs text-white/40 grid place-items-start content-center" style={{ background: "#0b1410" }}>
              Mensagem
            </div>
            <div className="size-9 rounded-full grid place-items-center" style={{ background: "#25D366" }}>
              <ArrowRight className="size-4 text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* floating CRM card */}
      <div className="absolute -left-6 sm:-left-16 bottom-20 glass-strong rounded-2xl p-3.5 w-[230px] shadow-2xl animate-float" style={{ animationDelay: "1.5s" }}>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
          <KanbanSquare className="size-3 text-[#25D366]" />
          CRM atualizado
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <div className="size-9 rounded-full grid place-items-center font-bold text-black" style={{ background: "#a3e635" }}>M</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Marina</div>
            <div className="text-[11px] text-white/55 truncate">8 pessoas → Negociando</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3" style={{ background: "linear-gradient(90deg,#25D366,#a3e635)" }} />
        </div>
      </div>

      {/* floating badge top */}
      <div className="absolute -right-4 sm:-right-10 top-12 glass-strong rounded-xl px-3 py-2 flex items-center gap-2 shadow-2xl animate-float" style={{ animationDelay: "3s" }}>
        <span className="size-2 rounded-full bg-[#25D366] dot-pulse relative" />
        <span className="text-xs font-medium">Lead respondido</span>
      </div>
    </div>
  );
}

function Bubble({ children, side, delay }: { children: React.ReactNode; side: "left" | "right"; delay: string }) {
  const isRight = side === "right";
  return (
    <div
      className={`reveal flex ${isRight ? "justify-end" : "justify-start"}`}
      style={{ transitionDelay: delay, animationDelay: delay }}
      data-reveal
    >
      <div
        className={`max-w-[78%] px-3 py-2 text-[13px] leading-snug rounded-2xl ${isRight ? "rounded-br-sm text-black" : "rounded-bl-sm text-white"}`}
        style={
          isRight
            ? { background: "linear-gradient(135deg,#25D366,#16a34a)", boxShadow: "0 8px 24px -8px rgba(37,211,102,0.5)" }
            : { background: "#1b2926", border: "1px solid rgba(255,255,255,0.05)" }
        }
      >
        {children}
      </div>
    </div>
  );
}

/* ===================== STATS ===================== */
function Stats() {
  const items = [
    { n: "3s", l: "tempo de resposta" },
    { n: "24/7", l: "no ar" },
    { n: "+38%", l: "conversão" },
    { n: "0", l: "lead esquecido" },
  ];
  return (
    <section className="px-5 md:px-8 py-10">
      <div className="mx-auto max-w-6xl glass rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 reveal" data-reveal>
        {items.map((it) => (
          <div key={it.l} className="px-6 py-6 text-center">
            <div className="font-display text-3xl md:text-4xl text-grad">{it.n}</div>
            <div className="text-xs uppercase tracking-wider text-white/55 mt-1">{it.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===================== PAIN ===================== */
function Pain() {
  return (
    <section className="px-5 md:px-8 py-20">
      <div className="mx-auto max-w-3xl text-center reveal" data-reveal>
        <h2 className="font-display text-3xl md:text-5xl leading-tight">
          Lead que espera, lead que <span className="text-grad">compra do concorrente</span>.
        </h2>
        <p className="mt-5 text-lg text-white/65 leading-relaxed">
          A primeira empresa a responder vende. Sempre. Enquanto você está dirigindo, atendendo na loja
          ou dormindo, os leads do anúncio que você pagou estão sumindo na fila. O AtendeZap responde
          em segundos, qualifica e já te entrega o lead pronto pra fechar.
        </p>
      </div>
    </section>
  );
}

/* ===================== HOW IT WORKS ===================== */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Conecte o WhatsApp",
      d: "Escaneia o QR Code uma vez e pronto. Funciona com o número que você já usa.",
      icon: <MessageSquareText className="size-5" />,
    },
    {
      n: "02",
      t: "Treine sua IA",
      d: "Uma tela com a personalidade da empresa, produtos, regras. Salvou? Já tá atendendo.",
      icon: <Bot className="size-5" />,
    },
    {
      n: "03",
      t: "A IA atende e organiza o CRM",
      d: "Responde no automático, qualifica, e move o card no kanban — você só fecha.",
      icon: <KanbanSquare className="size-5" />,
    },
  ];
  return (
    <section id="como" className="px-5 md:px-8 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Como funciona" title={<>Em 3 passos. <span className="text-grad">Sério.</span></>} />
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-7 relative reveal" data-reveal>
              <div className="font-display text-5xl text-white/10 absolute right-5 top-4">{s.n}</div>
              <div className="size-11 rounded-xl grid place-items-center" style={{ background: "rgba(37,211,102,0.15)", color: "#25D366" }}>
                {s.icon}
              </div>
              <h3 className="font-display text-xl mt-4">{s.t}</h3>
              <p className="text-white/65 text-sm mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== FEATURES ===================== */
function Features() {
  const items = [
    { t: "Inbox unificado", d: "Todas as conversas em um só lugar, com histórico completo por contato.", icon: <MessageSquareText className="size-5" /> },
    { t: "IA que responde como você", d: "Treinada com o tom da sua empresa. Faz uma pergunta por vez, não soa robô.", icon: <Bot className="size-5" /> },
    { t: "CRM kanban automático", d: "A IA classifica e move: Conversas, Negociando, Ganho, Perda. Sem digitar.", icon: <KanbanSquare className="size-5" /> },
    { t: "Multi-atendente", d: "Convide seu time. Cada um vê o que importa, com papéis e permissões.", icon: <Users className="size-5" /> },
    { t: "Pausa por palavra", d: "Digitou /pausar? A IA cala a boca e você assume aquele contato.", icon: <PauseCircle className="size-5" /> },
    { t: "Relatórios que mostram o dinheiro", d: "Tempo de resposta, conversão, taxa de ganho. Decisão em segundos.", icon: <LineChart className="size-5" /> },
  ];
  return (
    <section id="recursos" className="px-5 md:px-8 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Recursos" title={<>Tudo que você precisa pra <span className="text-grad">parar de perder venda</span>.</>} />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <div key={it.t} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform reveal" data-reveal>
              <div className="size-11 rounded-xl grid place-items-center" style={{ background: "rgba(37,211,102,0.15)", color: "#25D366" }}>
                {it.icon}
              </div>
              <h3 className="font-display text-lg mt-4">{it.t}</h3>
              <p className="text-white/65 text-sm mt-2 leading-relaxed">{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== PRICING ===================== */
function Pricing({ onCta }: { onCta: (p: "/entrar" | "/demo/dashboard") => void }) {
  const plans = [
    {
      n: "Starter",
      p: "R$ 97",
      d: "Pra começar a parar de perder lead hoje.",
      f: ["1 número de WhatsApp", "IA respondendo 24/7", "CRM Kanban", "14 dias grátis"],
    },
    {
      n: "Pro",
      p: "R$ 197",
      d: "O preferido pra quem já tem time.",
      f: ["Tudo do Starter", "Multi-atendente", "Relatórios completos", "Suporte prioritário"],
      highlight: true,
    },
    {
      n: "Scale",
      p: "R$ 397",
      d: "Pra operações que faturam alto.",
      f: ["Tudo do Pro", "Branding white-label", "Atendentes ilimitados", "Onboarding 1:1"],
    },
  ];
  return (
    <section id="planos" className="px-5 md:px-8 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Planos" title={<>Simples. <span className="text-grad">Direto.</span> Sem pegadinha.</>} />
        <div className="mt-12 grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((pl) => (
            <div
              key={pl.n}
              className={`relative rounded-2xl p-7 flex flex-col reveal ${pl.highlight ? "glass-strong" : "glass"}`}
              data-reveal
              style={pl.highlight ? { boxShadow: "0 20px 60px -20px rgba(37,211,102,0.5), 0 0 0 1px rgba(37,211,102,0.4) inset" } : undefined}
            >
              {pl.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-black" style={{ background: "linear-gradient(135deg,#25D366,#a3e635)" }}>
                  Mais popular
                </div>
              )}
              <div className="text-sm text-white/60">{pl.n}</div>
              <div className="font-display text-4xl mt-2">
                {pl.p}
                <span className="text-base text-white/50 font-normal">/mês</span>
              </div>
              <p className="text-sm text-white/60 mt-2">{pl.d}</p>
              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {pl.f.map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <span className="mt-0.5 size-4 rounded-full grid place-items-center shrink-0" style={{ background: "rgba(37,211,102,0.2)" }}>
                      <Check className="size-2.5 text-[#25D366]" strokeWidth={3} />
                    </span>
                    <span className="text-white/80">{x}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onCta("/entrar")}
                className={`mt-7 w-full px-4 py-3 rounded-xl font-semibold transition ${
                  pl.highlight ? "text-black btn-glow" : "glass-strong text-white hover:bg-white/10"
                }`}
                style={pl.highlight ? { background: "linear-gradient(135deg,#25D366,#16a34a)" } : undefined}
              >
                Começar agora
              </button>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-white/40">Valores de exemplo durante o lançamento.</p>
      </div>
    </section>
  );
}

/* ===================== TESTIMONIALS ===================== */
function Testimonials() {
  const items = [
    {
      n: "Camila — Studio de Estética",
      t: "Eu atendia entre clientes e perdia muita agenda. Agora a IA marca sozinha. Faturei 32% a mais no segundo mês.",
    },
    {
      n: "Rafael — Loja de Suplementos",
      t: "A galera me chamava no WhatsApp 1h da manhã. Hoje todo mundo é respondido na hora. CRM organizado sem eu tocar.",
    },
    {
      n: "Marina — Agência de Marketing",
      t: "Tirei o lead frio do operacional do time. A IA filtra e só passa quem é quente. Salvou minha sanidade.",
    },
  ];
  return (
    <section className="px-5 md:px-8 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow="Quem usa" title={<>Times que pararam de perder venda <span className="text-grad">no 'oi, sumiu'</span>.</>} />
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {items.map((it) => (
            <div key={it.n} className="glass rounded-2xl p-6 reveal" data-reveal>
              <div className="flex gap-1 text-[#facc15]">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}
              </div>
              <p className="text-white/85 mt-4 leading-relaxed text-[15px]">"{it.t}"</p>
              <div className="mt-5 text-sm text-white/55">{it.n}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== FAQ ===================== */
function Faq() {
  const items = [
    {
      q: "Preciso saber programar?",
      a: "Não. Você conecta o WhatsApp por QR Code, preenche uma tela contando sobre sua empresa, e a IA já tá atendendo. Quem sabe usar WhatsApp consegue.",
    },
    {
      q: "Funciona com vários atendentes?",
      a: "Funciona. Você convida sua equipe, cada um com seu acesso. A IA atende o que dá pra atender; o que precisa de humano, o time assume.",
    },
    {
      q: "A IA responde igual um robô?",
      a: "Não. Ela é treinada pra falar como gente — mensagens curtas, uma pergunta por vez, no tom da sua empresa. Em testes cegos, cliente nem percebe.",
    },
    {
      q: "Meu número fica seguro?",
      a: "Sim. Cada empresa tem ambiente isolado, dados criptografados e você é dono da conversa. Você pode desconectar a qualquer momento.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-5 md:px-8 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Dúvidas" title={<>Antes de você perguntar.</>} center />
        <div className="mt-10 space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q} className="glass rounded-2xl overflow-hidden reveal" data-reveal>
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left">
                  <span className="font-semibold">{it.q}</span>
                  <span className="size-7 grid place-items-center rounded-full shrink-0" style={{ background: "rgba(37,211,102,0.15)", color: "#25D366" }}>
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>
                {isOpen && <div className="px-5 pb-5 text-white/70 text-sm leading-relaxed">{it.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===================== FINAL CTA ===================== */
function FinalCta({ onCta }: { onCta: (p: "/entrar" | "/demo/dashboard") => void }) {
  return (
    <section className="px-5 md:px-8 py-20">
      <div
        className="mx-auto max-w-6xl rounded-3xl p-10 md:p-16 text-center relative overflow-hidden reveal"
        data-reveal
        style={{
          background: "linear-gradient(135deg,#0c3a23,#0a1a13)",
          border: "1px solid rgba(37,211,102,0.3)",
          boxShadow: "0 40px 120px -40px rgba(37,211,102,0.6)",
        }}
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle,#25D366,transparent 60%)" }} />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl leading-tight">
            Pare de perder venda no <span className="text-grad">"oi, sumiu"</span>.
          </h2>
          <p className="mt-5 text-white/70 max-w-xl mx-auto text-lg">
            14 dias grátis. Sem cartão. Liga em 2 minutos. Você vai ver os leads sendo respondidos na hora.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onCta("/entrar")}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-black font-bold text-lg btn-glow"
              style={{ background: "linear-gradient(135deg,#25D366,#16a34a)" }}
            >
              Começar agora, de graça <ArrowRight className="size-5" />
            </button>
            <button onClick={() => onCta("/demo/dashboard")} className="inline-flex items-center gap-2 px-7 py-4 rounded-xl glass-strong text-white hover:bg-white/10">
              <Play className="size-4" /> Ver demonstração
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== FOOTER ===================== */
function Footer() {
  return (
    <footer className="px-5 md:px-8 py-12 border-t border-white/5">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row gap-6 items-center justify-between text-sm text-white/50">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg,#25D366,#16a34a)" }}>
            <Zap className="size-3.5 text-black" strokeWidth={2.6} />
          </span>
          <span className="font-display text-base text-white/90">{brand.name}</span>
          <span className="text-white/30">© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="hover:text-white">Termos</a>
          <a href="#" className="hover:text-white">Privacidade</a>
          <a href="#" className="hover:text-white">Suporte</a>
        </nav>
      </div>
    </footer>
  );
}

/* ===================== HELPERS ===================== */
function SectionTitle({ eyebrow, title, center }: { eyebrow: string; title: React.ReactNode; center?: boolean }) {
  return (
    <div className={`reveal ${center ? "text-center" : ""}`} data-reveal>
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 font-semibold">
        <span className="h-px w-6 bg-white/30" />
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl md:text-5xl leading-tight mt-4 max-w-3xl">
        {title}
      </h2>
    </div>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" },
    );
    // single pass — todos os elementos já estão no markup ao montar
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

export const _unused = redirect;
