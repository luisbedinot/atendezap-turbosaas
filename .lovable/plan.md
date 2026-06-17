
# Diagnóstico — Modo Plan (nada alterado)

## 1) Signup e confirmação de e-mail

**Estado atual no Supabase Auth deste projeto:**
- `auto_confirm_email` está **DESLIGADO**. Tenho evidência empírica: dos 10 últimos cadastros, 8 confirmaram em segundos (clicaram no link) e 2 (`reinaldo.santos240884@gmail.com`, `lilliancarrilho2@gmail.com`) estão com `email_confirmed_at = NULL` há horas — ou seja, o sistema realmente exige confirmação.
- O provedor SMTP padrão do Lovable Cloud está ativo (é por isso que a maioria recebe e confirma). **Não estamos sem provedor** — é o SMTP compartilhado da plataforma. Para usar `from` próprio precisaria escalar domínio (Cloud → Emails), mas hoje funciona.

**Como o `src/routes/entrar.tsx` lida com isso (linhas 95-118):**
1. Faz `supabase.auth.signUp(email, senhaGerada)`.
2. Se vier `signUpData.session` → loga e segue (cenário auto-confirm).
3. Se NÃO vier sessão → tenta `signInWithPassword` imediatamente.
4. Se falhar → mostra toast "Enviamos um link de confirmação".

Como `auto_confirm` está OFF, o caminho real é o passo 4: **o usuário precisa abrir o e-mail e clicar no link** antes de conseguir entrar. Se o e-mail demorar/cair no spam, ele fica preso na tela "verifique seu e-mail".

**Como contornar (3 opções, da mais simples à mais cirúrgica):**
- **A) Ligar `auto_confirm_email = true`** via `supabase--configure_auth`. Resolve 100% — signup já entra logado, sem depender de e-mail. Trade-off: aceita e-mails não verificados (qualquer string@dominio funciona). Para o seu cenário de demo/gravação, é o ideal.
- **B) Manter confirmação obrigatória, mas adicionar um botão "reenviar e-mail de confirmação"** na tela de login quando detectar `email_not_confirmed`. Resolve quando o e-mail atrasa, mas ainda depende do SMTP.
- **C) Endpoint admin (server fn protegida por super_admin) "confirmar usuário manualmente"** — útil para emergência (você confirma na mão pelo painel master), mas não resolve para o usuário comum.

**Recomendação:** **A** agora (para você gravar tranquilo) + **B** como UX adicional depois.

---

## 2) Atribuição do papel `super_admin`

**Como funciona hoje:**

Existem **dois mecanismos**, ambos em SQL (functions `SECURITY DEFINER`):

a) **`public.handle_new_user()`** — trigger `on auth.users` no INSERT. Quando um novo usuário se cadastra:
   - Cria linha em `profiles`.
   - Se **ainda não existe nenhum super_admin no projeto**, promove esse novo usuário a `super_admin` e grava o e-mail em `app_config.super_admin_emails`.
   - **Importante:** roda apenas no primeiro usuário do clone. A partir do segundo, ninguém é promovido automaticamente.

b) **`public.claim_super_admin_if_empty()`** — function `RPC` (não tem trigger automático). Roda **só se algum código do front chamar `supabase.rpc('claim_super_admin_if_empty')`**. Pelo que vasculhei (`rg "claim_super_admin"` no src), **nada chama essa RPC hoje**. Ou seja: ela existe como "rede de segurança" para o caso de o trigger ter falhado, mas hoje é código morto.

**Estado do `luis.bedinot@gmail.com` no banco AGORA:**
```
auth.users:      confirmed_at = 2026-06-17 16:13 (confirmado)
user_roles:      role = super_admin  ✓
app_config:      super_admin_emails = ['luis.bedinot@gmail.com']  ✓
company_user:    0 linhas (não pertence a nenhuma empresa)
```

**Então por que cai no onboarding / é jogado pra fora do /master?**

Lendo `src/routes/master.tsx` (linha 13) e `src/routes/app.tsx` (linha 23), os dois fazem o **mesmo query** para checar a role:
```ts
supabase.from("user_roles").select("role").eq("user_id", u.user.id)
```
Esse SELECT é gated por **RLS na tabela `user_roles`** (só 1 policy, conforme `<supabase-tables>`). Se a policy não permite o próprio usuário ler suas roles, o array volta `[]`, `isSuperAdmin = false`, e:
- `/master` → redirect para `/app/dashboard`
- `/app` → como ele não tem `company_user`, e `isSuperAdmin` (falso) cai no else → redirect para `/app/checkout` (não onboarding, mas é o "fora do master" que você descreveu).

Outra causa possível e mais provável: **a sessão do navegador é de OUTRO usuário** (não a do luis). Os logs de auth mostram um login recente de `teste@teste.com` (16:18:44) e tentativa fracassada de login (16:19:28, `invalid_credentials`). Você pode estar logado como `teste@teste.com` no preview enquanto tenta acessar /master — esse usuário não tem role super_admin, por isso é expulso.

**Plano de investigação (sem alterar nada):**
1. Confirmar quem está logado no navegador (rodar `supabase.auth.getUser()` no console do preview, ou só conferir o badge no canto superior).
2. Se for o luis, testar o SELECT com RLS ativa: rodar como o user dele (impersonate via service role) para ver se a policy de `user_roles` retorna a linha.
3. Se a policy estiver bloqueando, ajustar (`USING (user_id = auth.uid())`). Migration simples.

---

## 3) Definir/redefinir senha DENTRO do sistema (sem e-mail)

**Estado atual:**

| Tela | Arquivo | Precisa e-mail? | O que faz |
|---|---|---|---|
| Esqueci minha senha | `src/routes/esqueci-senha.tsx` | **Sim** | Chama `supabase.auth.resetPasswordForEmail` → manda link |
| Definir nova senha (após clicar no link) | `src/routes/reset-senha.tsx` | **Sim** (precisa do token no hash) | `supabase.auth.updateUser({password})` |
| Trocar senha (logado) | `src/routes/trocar-senha.tsx` | **Não** | Usuário JÁ LOGADO define nova senha. Usado quando `forcar_troca_senha=true` em `company_user`. |

**O que NÃO existe hoje:**
- Não há fluxo super-admin → "definir senha do usuário X manualmente" pelo painel master.
- Não há "trocar minha senha" acessível a qualquer momento via Configurações (só dispara via `forcar_troca_senha`).
- Não há "esqueci senha sem e-mail" (autoatendimento via outro fator).

**Como você (super admin) já consegue resetar senha de alguém HOJE:**
- Não pela UI. Só via Admin API (foi o que eu fiz com seu usuário ontem usando `service_role_key` num endpoint temporário). Não existe botão "resetar senha" em `/master/empresas`.

**Opções para fechar essa lacuna:**
- **D) Adicionar botão "Definir nova senha" em `/master/empresas/[id]`** que chama uma server fn protegida (`requireSupabaseAuth` + check de super_admin) e usa `supabaseAdmin.auth.admin.updateUserById`. Gera senha temporária + marca `forcar_troca_senha=true` para a próxima sessão.
- **E) Adicionar link "Trocar senha" em `/app/configuracoes`** (qualquer usuário logado) reutilizando a tela `trocar-senha.tsx` já existente.

---

## Resumo executivo para decidir o próximo passo

| Pergunta | Resposta curta |
|---|---|
| Confirmação de e-mail está ligada? | **Sim**, e o e-mail está sendo entregue (80% confirma) |
| Como entrar sem depender do e-mail? | Ligar `auto_confirm_email` (recomendado p/ demo) |
| Por que o luis é expulso do /master? | Mais provável: você está logado como `teste@teste.com` no navegador, não como luis. Segunda hipótese: RLS de `user_roles` bloqueando o SELECT |
| Existe redefinir senha sem e-mail? | Só `trocar-senha.tsx` (precisa estar logado). Não há ação de super admin pela UI |

---

## Próximos passos sugeridos (espero sua escolha — nada será alterado ainda)

1. **Ligo `auto_confirm_email = true`** para destravar signups na gravação? (Sim/Não)
2. **Investigo a RLS de `user_roles`** e/ou confirmo quem está logado no navegador agora? (Sim/Não)
3. **Crio a tela super-admin "definir senha do usuário"** + atalho "trocar senha" em `/app/configuracoes`? (Sim/Não)
