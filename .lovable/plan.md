# Fallback Evolution + número de suporte

## 1. `src/config/brand.ts`
Adicionar constantes exportadas:
- `supportWhatsapp = "5551982913030"` — número cru, sem máscara.
- `supportWhatsappUrl = "https://wa.me/5551982913030"` — link clicável pronto.
- `supportWhatsappDisplay = "(51) 98291-3030"` — formato amigável.

## 2. `src/lib/evolution.server.ts` (server-only)
Adicionar fallback hardcoded dentro da função `env()`:

```ts
const FALLBACK_URL = "http://187.77.59.202:8080";
const FALLBACK_KEY = "jEpxtxy82V61ueUen5AinQWpa6SSNwLF";

function env() {
  const url = process.env.EVOLUTION_API_URL || FALLBACK_URL;
  const key = process.env.EVOLUTION_API_KEY || FALLBACK_KEY;
  return { url: url.replace(/\/+$/, ""), key };
}
```

- Mantém prioridade para `process.env` (permite sobrescrever sem mexer no código).
- Remove o `throw` de "secret não configurado" — sempre haverá valor.
- Arquivo é `*.server.ts` (bloqueado do bundle client), então o segredo nunca vai pro browser.

Em `evo()`, quando `fetch` falhar (TypeError de rede) ou a API responder erro, encapsular a mensagem incluindo o número de suporte:
`Evolution API: <msg>. Se persistir, fale com o suporte: https://wa.me/5551982913030`.

## 3. Tela de erro / 404 — mostrar suporte
- `src/components/route-fallbacks.tsx` (`RouteErrorComponent`): abaixo dos botões, linha discreta "Precisa de ajuda? Falar com suporte" linkando para `supportWhatsappUrl` (target=_blank).
- `src/routes/__root.tsx` (`NotFoundComponent` e `ErrorComponent` local): mesmo link de suporte.

## 4. Rodapé do app shell
`src/components/app-shell.tsx`: adicionar um pequeno rodapé dentro do `<aside>` da sidebar (acima ou abaixo do bloco do usuário) e também no header mobile drawer — texto curto:
"Suporte: (51) 98291-3030" com ícone do WhatsApp (lucide `MessageCircle`), linkando para `supportWhatsappUrl`. Estilo discreto, `text-[11px] text-muted-foreground`.

## 5. Sem mudanças em
- secrets do Lovable Cloud (continuam funcionando como override).
- `src/lib/config.server.ts`, fluxo de checkout/onboarding, RLS, agente.
- `.env*` (não vamos versionar a chave lá; o fallback fica no `.server.ts`).

## Notas técnicas
- A chave fica versionada em `src/lib/evolution.server.ts`. Confirmado pelo usuário.
- `*.server.ts` é filtrado pelo guard do template; nunca vai pro client bundle.
- Clones do projeto herdam a chave automaticamente sem precisar configurar secret.
