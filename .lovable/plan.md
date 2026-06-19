# Roadmap de evolução do AtendeZap

Lista grande demais pra entregar tudo numa só passada sem virar bagunça. Proponho 5 fases entregáveis, cada uma testável de ponta-a-ponta. Você aprova e eu começo pela Fase 1 imediatamente. Se quiser inverter prioridade ou cortar algo, é só dizer.

---

## Fase 1 — Operação no dia-a-dia (maior ROI) ⭐ começar por aqui
1. **Templates de mensagem rápidos** — CRUD em `Configurações`, atalho `/` na tela de Conversas para inserir.
2. **Horário de atendimento** — por dia da semana, com mensagem automática fora do horário (a IA respeita).
3. **Tags em contatos e conversas** — filtro no CRM e na lista de Conversas.
4. **Atalhos de teclado** em Conversas (`j/k`, `e` arquivar, `r` responder, `/` template).

**Tabelas novas:** `message_template`, `business_hours`, `tag`, `contact_tag`.

## Fase 2 — Campanhas e disparo em massa
1. Tela `/app/campanhas`: criar, segmentar por tag, agendar, anti-ban (intervalo aleatório 5–20s, pausa a cada N envios).
2. Worker via `pg_cron` chamando `/api/public/campaigns/tick` a cada minuto.
3. Relatório de entrega: enviado / lido / respondido / falhou.

**Tabelas:** `campaign`, `campaign_target`, `campaign_log`.

## Fase 3 — Insights e satisfação
1. **CSAT automático** ao fechar conversa (1 mensagem com 1-5).
2. **Relatório de produtividade por atendente:** TMA, TME, conversas resolvidas, CSAT médio.
3. **Exportação CSV** de contatos, conversas e relatórios.

## Fase 4 — Integrações
1. **Webhooks de saída** (eventos: lead.created, conversa.fechada, venda.ganha) — config em `Configurações > Integrações`.
2. **API pública** com token por empresa (gated no plano Business). Endpoints REST mínimos: contatos, conversas, mensagens.
3. **Captura de UTM** no clique-pra-WhatsApp e atribuição no CRM.

## Fase 5 — UX & Segurança
1. **Notificações push** no navegador (Web Push) para nova mensagem.
2. **Modo "minhas conversas" vs "todas"** com persistência por usuário.
3. **Logs de auditoria** (`audit_log`) — tela em Master e em Configurações (plano Business).
4. **2FA TOTP** para owner/admin.
5. **Exportação completa LGPD** da empresa (zip JSON + CSV) em Configurações.

---

## Como vou trabalhar
- Uma fase por vez, com migration + UI + server fns na mesma rodada.
- Cada fase respeita o `plan-features.ts` (libera/bloqueia por plano: Starter / Pro / Business).
- Sem mexer em pagamentos (já removido) — cobrança continua via webhooks Kiwify/Cakto/Perfectpay.
- Tema, cores, fontes e layout existentes preservados.

## Estimativa
- Fase 1: ~1 rodada longa
- Fase 2: ~2 rodadas (worker + UI)
- Fase 3: 1 rodada
- Fase 4: ~2 rodadas
- Fase 5: ~2 rodadas

**Aprovando, começo pela Fase 1 agora.** Se preferir outra ordem (ex.: Campanhas antes de Templates), me avise.
