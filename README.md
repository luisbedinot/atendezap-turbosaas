# AtendeZap

SaaS multiempresa para atendimento de WhatsApp com IA, CRM Kanban, campanhas, equipe, relatórios, integrações e planos comerciais.

## Stack

- React 19 + TypeScript + TanStack Start
- Tailwind CSS + shadcn/ui
- Lovable Cloud / Supabase
- Evolution API v2 para conexão via QR Code

## Desenvolvimento local

```bash
npm install
npm run dev
```

Validações principais:

```bash
npm run build
npm run lint
```

## Configuração

O Lovable preenche a conexão pública do Supabase ao ativar o Cloud. Não reutilize secrets ou serviços externos do projeto original.

Secrets de backend:

```text
EVOLUTION_API_URL
EVOLUTION_API_KEY
CAMPAIGN_WORKER_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_STATE_SECRET
KIWIFY_WEBHOOK_TOKEN
CAKTO_WEBHOOK_TOKEN
PERFECTPAY_WEBHOOK_TOKEN
```

Variáveis públicas opcionais estão documentadas em `.env.example`.

## Clonagem

Leia [MANUAL.md](./MANUAL.md) antes de entregar uma cópia. Ele cobre:

- ativação do banco e migrations;
- primeiro super administrador do clone;
- Evolution API e QR Code;
- IA e limitações de mídia;
- planos e créditos;
- worker autenticado das campanhas;
- webhooks idempotentes de cobrança;
- Google OAuth e checklist ponta a ponta.

## Segurança aplicada

- isolamento multiempresa com RLS;
- primeiro administrador sem UUID ou e-mail herdado;
- campos de plano, cobrança e créditos protegidos de alterações pelo cliente;
- integrações e tokens restritos a owner/admin;
- webhooks do WhatsApp com token por instância;
- worker de campanhas autenticado e com reserva atômica de destinatários;
- proteção contra replay de eventos de cobrança;
- OAuth state assinado e com expiração.

## Lovable

Conecte cada clone ao seu próprio projeto Lovable e ao seu próprio repositório. Alterações enviadas ao GitHub são sincronizadas conforme a branch escolhida na Lovable. Confirme o preview e publique somente depois das validações de banco e integração externa.
