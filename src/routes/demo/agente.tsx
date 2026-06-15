import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { Bot, Loader2, Send, Sparkles, Calendar, LinkIcon, Lock } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { buildSystemPrompt } from "@/lib/ai-prompt";

export const Route = createFileRoute("/demo/agente")({
  head: () => ({ meta: [{ title: `${brand.name} — Agente IA (demo)` }] }),
  component: AgenteDemo,
});

const CFG: any = {
  nome_agente: "Pão (assistente da Padaria)",
  nome_empresa: "Padaria do Bairro",
  segmento: "Alimentação / Padaria artesanal",
  regiao_horario: "Vila Mariana e Vila Clementino — seg a sáb, 6h às 20h",
  descricao_negocio: "Padaria de bairro desde 1998. Pães artesanais, doces, bolos sob encomenda e cestas de café da manhã.",
  diferenciais: "Massa de fermentação natural, entrega rápida via Loggi, atendimento humano e personalizado.",
  publico_alvo: "Moradores e empresas da Vila Mariana que valorizam pão fresco e qualidade.",
  sobre_empresa: "Padaria de bairro fundada em 1998. Atende Vila Mariana e Vila Clementino. Entrega via Loggi.",
  produtos_servicos: "Pães artesanais, doces, bolos sob encomenda, salgados, café e cestas de café da manhã.",
  ofertas: "Cesta de café da manhã com 15% off às terças. Combo família (6 pães + 2 doces) por R$ 49.",
  cupom: "PADARIA10",
  como_vender: "1) Cumprimente. 2) Descubra o pedido. 3) Sugira combos. 4) Confirme endereço e horário. 5) Envie link de pagamento.",
  objecoes: "“Tá caro” → reforce qualidade artesanal e desconto da terça. “Demora” → entrega em 45min via Loggi.",
  formas_pagamento: "Pix, cartão (todas bandeiras), dinheiro na entrega.",
  ticket_medio: "R$ 48",
  faq: "Funcionamos seg-sáb 6h-20h. Entregamos em até 5km. Bolos sob encomenda com 48h antecedência.",
  politicas: "Cancelamento até 2h antes da entrega. Troca em até 24h se houver defeito.",
  posvenda_msg: "Oi! Tudo certo com seu pedido? Adoraríamos saber se gostou 🥐",
  pedir_avaliacao: true,
  reativar_cliente: true,
  tom: 78,
  formalidade: 30,
  usar_emojis: true,
  tamanho_resposta: "curtas",
  apresentacao: "Oi! Aqui é o Pão, assistente da Padaria do Bairro 🥐 Em que posso ajudar?",
  estilo_comunicacao: "Acolhedor, simpático e direto. Usa emojis com moderação.",
  agendamento_ativo: true,
  servicos_agendaveis: "Encomenda de bolo, retirada de cesta personalizada.",
  duracao_padrao: "30 min",
  antecedencia_min: "2 horas",
  horarios_disponiveis: "Seg a sex: 9h–18h. Sáb: 9h–13h.",
  pode_fazer: "Mostrar cardápio, informar preços, confirmar entrega, anotar pedidos.",
  nao_pode_fazer: "Inventar preço, prazo ou promessa fora do prompt.",
  telefone_transferencia: "+55 11 99999-0000",
  palavra_pausar: "/pausar",
  palavra_despausar: "/despausar",
  segundos_buffer: 8,
  responder_em_partes: true,
};

const PRODUTOS = [
  { nome: "Pão de queijo (500g)", preco: 18, descricao: "Tradicional mineiro, mineirinho mesmo." },
  { nome: "Pão francês (kg)", preco: 22, descricao: "Crocante por fora, macio por dentro." },
  { nome: "Cesta café da manhã", preco: 89, descricao: "Pães, queijos, frios, frutas, suco e café." },
  { nome: "Bolo sob encomenda", preco: 120, descricao: "Sabor à escolha, mínimo 48h de antecedência." },
];

const TABS: [string, string][] = [
  ["negocio","Negócio"],["produtos","Produtos"],["ofertas","Ofertas"],["vendas","Vendas"],
  ["suporte","Suporte"],["posvenda","Pós-venda"],["personalidade","Personalidade"],
  ["agendamento","Agendamento"],["regras","Regras"],
];

const DEMO_REPLIES = [
  "Oi! Entregamos sim na Vila Mariana 👋",
  "Quer que eu te mande o cardápio do dia?",
];

function AgenteDemo() {
  const [testMsg, setTestMsg] = useState("Oi, vocês entregam aqui?");
  const [reply, setReply] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  function runTest() {
    setTesting(true); setReply([]);
    setTimeout(() => { setReply(DEMO_REPLIES); setTesting(false); }, 700);
  }

  const prompt = buildSystemPrompt(CFG, {
    responderEmPartes: true,
    produtos: PRODUTOS,
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Agente IA</h1>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Lock className="size-3" /> Configuração de exemplo — somente leitura.
          </p>
        </div>
        <Button disabled title="Indisponível no demo">Salvar</Button>
      </header>

      <div className="grid lg:grid-cols-[1fr_minmax(380px,440px)] gap-6">
        <div>
          <Tabs defaultValue="negocio">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              {TABS.map(([k, l]) => (
                <TabsTrigger key={k} value={k} className="text-sm">{l}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="negocio" className="space-y-3">
              <Section>
                <div className="grid sm:grid-cols-2 gap-3">
                  <RO label="Nome do agente" value={CFG.nome_agente} />
                  <RO label="Nome da empresa" value={CFG.nome_empresa} />
                  <RO label="Segmento" value={CFG.segmento} />
                  <RO label="Região / horário" value={CFG.regiao_horario} />
                </div>
                <ROArea label="Descrição do negócio" value={CFG.descricao_negocio} rows={3} />
                <ROArea label="Diferenciais" value={CFG.diferenciais} />
                <ROArea label="Público-alvo" value={CFG.publico_alvo} />
                <ROArea label="Sobre a empresa" value={CFG.sobre_empresa} rows={3} />
              </Section>
            </TabsContent>

            <TabsContent value="produtos" className="space-y-3">
              <Section>
                <p className="text-sm text-muted-foreground">Catálogo usado pela IA.</p>
                <div className="space-y-2">
                  {PRODUTOS.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border bg-muted p-3 grid sm:grid-cols-[1fr_120px_auto] gap-2 items-center">
                      <Input readOnly value={p.nome} />
                      <Input readOnly value={`R$ ${p.preco}`} />
                      <Switch checked disabled />
                      <Textarea readOnly className="sm:col-span-3" rows={2} value={p.descricao} />
                    </div>
                  ))}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="ofertas" className="space-y-3">
              <Section>
                <ROArea label="Ofertas ativas" value={CFG.ofertas} rows={4} />
                <RO label="Cupom" value={CFG.cupom} />
              </Section>
            </TabsContent>

            <TabsContent value="vendas" className="space-y-3">
              <Section>
                <ROArea label="Como vender (passo a passo)" value={CFG.como_vender} rows={4} />
                <ROArea label="Objeções comuns e respostas" value={CFG.objecoes} rows={4} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <RO label="Formas de pagamento" value={CFG.formas_pagamento} />
                  <RO label="Ticket médio" value={CFG.ticket_medio} />
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="suporte" className="space-y-3">
              <Section>
                <ROArea label="FAQ" value={CFG.faq} rows={5} />
                <ROArea label="Políticas (troca/cancelamento/garantia)" value={CFG.politicas} rows={4} />
              </Section>
            </TabsContent>

            <TabsContent value="posvenda" className="space-y-3">
              <Section>
                <ROArea label="Mensagem de pós-venda" value={CFG.posvenda_msg} rows={3} />
                <ROToggle label="Pedir avaliação após venda" v={CFG.pedir_avaliacao} />
                <ROToggle label="Reativar clientes inativos" v={CFG.reativar_cliente} />
              </Section>
            </TabsContent>

            <TabsContent value="personalidade" className="space-y-3">
              <Section>
                <ROSlider label="Tom (sério → caloroso)" v={CFG.tom} />
                <ROSlider label="Formalidade (informal → formal)" v={CFG.formalidade} />
                <ROToggle label="Usar emojis" v={CFG.usar_emojis} />
                <div className="space-y-1.5">
                  <Label>Tamanho das respostas</Label>
                  <Select value={CFG.tamanho_resposta} disabled>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curtas">Curtas (WhatsApp)</SelectItem>
                      <SelectItem value="medias">Médias</SelectItem>
                      <SelectItem value="longas">Longas (explicativas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ROArea label="Apresentação (1ª mensagem)" value={CFG.apresentacao} rows={2} />
                <ROArea label="Estilo de comunicação" value={CFG.estilo_comunicacao} rows={2} />
              </Section>
            </TabsContent>

            <TabsContent value="agendamento" className="space-y-3">
              <Section>
                <div className="rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-[var(--brand-text)] mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">Google Agenda</div>
                      <p className="text-xs text-muted-foreground mt-1">Permite que a IA marque eventos automaticamente.</p>
                    </div>
                    <Button size="sm" disabled><LinkIcon className="size-3.5 mr-1" />Conectar</Button>
                  </div>
                </div>
                <ROToggle label="Agendamento ativo" v={CFG.agendamento_ativo} />
                <ROArea label="Serviços agendáveis" value={CFG.servicos_agendaveis} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <RO label="Duração padrão" value={CFG.duracao_padrao} />
                  <RO label="Antecedência mínima" value={CFG.antecedencia_min} />
                </div>
                <ROArea label="Horários disponíveis" value={CFG.horarios_disponiveis} />
              </Section>
            </TabsContent>

            <TabsContent value="regras" className="space-y-3">
              <Section>
                <div className="grid sm:grid-cols-2 gap-3">
                  <ROArea label="O que PODE fazer" value={CFG.pode_fazer} rows={4} />
                  <ROArea label="O que NÃO pode fazer" value={CFG.nao_pode_fazer} rows={4} />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <RO label="Telefone p/ transferência" value={CFG.telefone_transferencia} />
                  <RO label="Palavra para pausar" value={CFG.palavra_pausar} />
                  <RO label="Palavra para despausar" value={CFG.palavra_despausar} />
                </div>
                <ROSlider label="Esperar antes de responder (segundos)" v={CFG.segundos_buffer} max={20} unit="s" />
                <ROToggle label="Responder em partes (1-3 bolhas)" v={CFG.responder_em_partes} />
              </Section>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          <Section title="Prompt gerado" icon={<Bot className="size-3.5" />}>
            <pre className="rounded-xl border border-border bg-muted p-4 font-mono text-[12px] leading-relaxed text-foreground whitespace-pre-wrap max-h-[360px] overflow-auto">
{prompt}
            </pre>
          </Section>
          <Section title="Testar resposta" icon={<Sparkles className="size-3.5" />}>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 min-h-[160px]">
              <div className="flex justify-end">
                <div className="max-w-[78%] bg-muted rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px]">{testMsg}</div>
              </div>
              {reply.map((p, i) => (
                <div key={i} className="flex justify-start gap-2 items-end">
                  <InitialsAvatar name="IA" size={24} forceGradient="linear-gradient(135deg,#A3E635,#25D366)" />
                  <div className="max-w-[78%] bg-gradient-to-br from-[#1f9d57] to-[#25D366] text-primary-foreground rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] font-medium">
                    <span className="block text-[9.5px] font-bold opacity-80 mb-1 uppercase tracking-wider">⚡ Agente IA</span>
                    {p}
                  </div>
                </div>
              ))}
              {testing && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" />pensando…</div>}
            </div>
            <div className="flex gap-2 mt-3">
              <Input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} placeholder="Mensagem do cliente…" />
              <Button onClick={runTest} disabled={testing} size="icon">
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      {title && (
        <h3 className="font-display text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-text)] flex items-center gap-1.5">
          {icon}{title}
        </h3>
      )}
      {children}
    </div>
  );
}
function RO({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input readOnly value={value} /></div>;
}
function ROArea({ label, value, rows = 2 }: { label: string; value: string; rows?: number }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Textarea readOnly value={value} rows={rows} /></div>;
}
function ROToggle({ label, v }: { label: string; v: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={!!v} disabled />
    </div>
  );
}
function ROSlider({ label, v, max = 100, unit = "" }: { label: string; v: number; max?: number; unit?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground font-mono">{v}{unit}</span>
      </div>
      <Slider value={[v]} max={max} step={1} disabled />
    </div>
  );
}
