---
file: docs/auth/LOGTO_EXECUTION_PLAN.md
module: Sprint 2B - Logto Execution Plan by Branches and Commits
status: Active
related: [docs/auth/LOGTO_RUNTIME_CHECKLIST.md, docs/auth/LOGTO_RUNTIME_PLAN.md, docs/auth/LOGTO_IMPLEMENTATION_PLAN.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md]
---

# Sprint 2B - Plano de Execução por Branches e Commits

Objetivo: transformar a checklist de PRs em um plano de execução com branches e commits sugeridos.

Escopo:

- não altera código;
- não altera banco;
- não altera migrations;
- apenas documenta a sequência de branches, PRs e commits.

## PR 1

**Branch:** `feat/logto-bootstrap`

**PR:** Instalação e configuração Logto

**Commit sugerido:** `feat(auth): install and configure logto`

**Objetivo:** preparar o projeto para o runtime Logto, incluindo pacote, envs, configuração central e rotas base.

**Arquivos previstos:** `app/package.json`, `app/logto.ts`, `.env.example`, `docs/ENVIRONMENT.md`, `docs/auth/LOGTO_RUNTIME_PLAN.md`, `docs/auth/LOGTO_RUNTIME_CHECKLIST.md`

**Dependências do PR anterior:** nenhuma.

**Critérios de aceite:**

- `@logto/next` instalado;
- `LOGTO_*` documentadas;
- configuração central criada;
- rotas base definidas para login/logout/callback.

**Estratégia de rollback:**

- remover `@logto/next`;
- apagar `app/logto.ts`;
- manter o runtime legado intacto;
- preservar documentação como referência.

---

## PR 2

**Branch:** `feat/logto-session`

**PR:** Callback e sessão

**Commit sugerido:** `feat(auth): add logto callback and session handling`

**Objetivo:** substituir o callback Supabase pela sessão Logto e centralizar a leitura de usuário autenticado.

**Arquivos previstos:** `app/src/app/(auth)/auth/callback/route.ts`, `app/src/lib/logto/session.ts`, `app/src/lib/logto/user.ts`, `app/src/lib/auth/current-user.ts`, `app/src/lib/auth/profile-linking.ts`

**Dependências do PR anterior:** PR 1.

**Critérios de aceite:**

- callback usa `handleSignIn`;
- sessão é lida com Logto;
- `getCurrentUser()` retorna usuário de aplicação a partir de claims Logto.

**Estratégia de rollback:**

- reverter callback para Supabase;
- preservar os helpers Logto como código não consumido;
- manter o fluxo legado ativo até estabilização.

---

## PR 3

**Branch:** `feat/logto-user-flows`

**PR:** Login, cadastro, logout

**Commit sugerido:** `feat(auth): migrate login signup and logout flows`

**Objetivo:** substituir as ações de autenticação da interface pelo fluxo Logto.

**Arquivos previstos:** `app/src/components/auth/LoginForm.tsx`, `app/src/components/auth/CadastroForm.tsx`, `app/src/components/auth/RecuperarSenhaForm.tsx`, `app/src/components/meus-politicos/BotaoSair.tsx`, `app/src/app/(painel)/(auth)/login/page.tsx`, `app/src/app/(painel)/(auth)/cadastro/page.tsx`, `app/src/app/(painel)/(auth)/recuperar-senha/page.tsx`

**Dependências do PR anterior:** PR 2.

**Critérios de aceite:**

- login, cadastro e logout usam Logto;
- reset de senha segue o fluxo Logto;
- páginas de entrada permanecem as mesmas.

**Estratégia de rollback:**

- reverter handlers das telas para Supabase;
- manter URLs e páginas intactas;
- não remover callback/sessão antiga ainda.

---

## PR 4

**Branch:** `feat/logto-middleware`

**PR:** Middleware e proteção de rotas

**Commit sugerido:** `feat(auth): protect routes with logto middleware`

**Objetivo:** trocar a leitura/renovação de sessão no edge e manter a política de rotas por host.

**Arquivos previstos:** `app/src/proxy.ts`, `app/src/lib/supabase/middleware.ts`, `app/src/lib/auth/current-user.ts`, `app/src/lib/auth/providers.ts`, `app/src/app/(painel)/(dashboard)/painel/page.tsx`, `app/src/app/(admin)/admin/layout.tsx`

**Dependências do PR anterior:** PR 3.

**Critérios de aceite:**

- `proxy` usa sessão Logto;
- rotas protegidas continuam bloqueando anônimos;
- painel e admin continuam fechados para usuário sem permissão.

**Estratégia de rollback:**

- reverter `proxy` e `middleware` para Supabase;
- manter rotas e guards originais;
- deixar o fluxo Logto desativado por flag.

---

## PR 5

**Branch:** `feat/logto-profile-linking`

**PR:** Perfil e reconciliação

**Commit sugerido:** `feat(auth): link logto identities to user profiles`

**Objetivo:** vincular Logto ao perfil da aplicação sem perder compatibilidade com a base legada.

**Arquivos previstos:** `app/src/lib/auth/profile-linking.ts`, `app/src/lib/auth/current-user.ts`, `app/src/lib/auth/types.ts`, `docs/auth/LOGTO_RUNTIME_PLAN.md`, `docs/auth/AUTH_MIGRATION_LOGTO.md`

**Dependências do PR anterior:** PR 4.

**Critérios de aceite:**

- `logto_sub` é a identidade principal;
- `supabase_user_id` continua como legado;
- reconciliação por `auth.users.email` só funciona como fallback controlado.

**Status Sprint 5B/5C:** concluído.

- Login Logto operacional.
- Callback Logto operacional.
- Reconciliação automática por e-mail legado operacional.
- `logto_sub` preenchido automaticamente.
- `auth_provider` migrado para `logto`.
- `migrado_logto_em` preenchido.
- Supabase Auth não é mais necessário para usuários já migrados.

**Resultado operacional:** `getCurrentUser()` resolve primeiro por `logto_sub`; se não houver vínculo, usa o e-mail entregue pelo Logto para localizar exatamente um usuário legado em `auth.users` e aplicar o update condicional em `public.perfis`. Depois do vínculo, o perfil passa a ser resolvido diretamente por Logto.

**Estratégia de rollback:**

- voltar a usar `supabase_user_id` como identificador de trabalho;
- preservar `logto_sub`;
- não promover Logto como fonte única até validar tudo.

---

## PR 6

**Branch:** `feat/logto-following`

**PR:** Acompanhamentos

**Commit sugerido:** `feat(auth): restore follow and user dashboard features`

**Objetivo:** migrar follow/unfollow e o recorte do painel para a identidade de aplicação resolvida pelo Logto.

**Arquivos previstos:** `app/src/app/api/acompanhamentos/route.ts`, `app/src/app/api/acompanhamentos/[politicoId]/route.ts`, `app/src/components/politico/BotaoAcompanhar.tsx`, `app/src/app/(painel)/(dashboard)/painel/page.tsx`, `app/src/lib/auth/current-user.ts`

**Dependências do PR anterior:** PR 5.

**Critérios de aceite:**

- follow/unfollow funcionam com `CurrentUser`;
- `meus-politicos` continua encaminhando para o painel;
- `isSeguindo` usa a identidade nova sem quebrar a UI.

**Estratégia de rollback:**

- reverter handlers para `user.id` Supabase;
- manter políticas antigas enquanto a migração não estiver fechada.

---

## PR 7

**Branch:** `feat/logto-admin`

**PR:** Admin

**Commit sugerido:** `feat(auth): migrate admin authorization to logto`

**Objetivo:** mover autorização de admin para a identidade de aplicação e preservar as rotas administrativas.

**Arquivos previstos:** `app/src/app/(admin)/admin/layout.tsx`, `app/src/app/(admin)/admin/page.tsx`, `app/src/app/(admin)/admin/analytics/page.tsx`, `app/src/app/(admin)/admin/usuarios/page.tsx`, `app/src/app/(admin)/admin/flags/page.tsx`, `app/src/app/(admin)/admin/etl/page.tsx`, `app/src/app/(admin)/admin/dados/page.tsx`, `app/src/app/api/admin/*`, `app/src/lib/auth/current-user.ts`

**Dependências do PR anterior:** PR 6.

**Critérios de aceite:**

- `requireAdmin()` funciona;
- `perfis.role` continua sendo a fonte de autorização;
- APIs admin continuam protegidas;
- listagem de usuários não perde capacidade operacional.

**Estratégia de rollback:**

- reverter autorização para o modelo antigo baseado em Supabase;
- preservar as rotas e o adminClient até a validação completa.

---

## PR 8

**Branch:** `cleanup/remove-supabase-auth`

**PR:** Remoção Supabase Auth legado

**Commit sugerido:** `refactor(auth): remove legacy supabase auth`

**Objetivo:** remover do runtime os resíduos de Supabase Auth depois que o Logto estiver estável.

**Arquivos previstos:** `app/src/lib/supabase/*`, `app/src/components/auth/*`, `app/src/components/meus-politicos/BotaoSair.tsx`, `app/src/app/(auth)/auth/callback/route.ts`, `app/src/proxy.ts`, `.env.example`, `docs/ENVIRONMENT.md`, `docs/AUTH.md`, `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md`, `docs/AUTH_MIGRATION_LOGTO.md`

**Dependências do PR anterior:** PR 7.

**Critérios de aceite:**

- nenhum fluxo de auth depende de `@supabase/ssr`, `@supabase/supabase-js`, `SUPABASE_SERVICE_ROLE_KEY` ou callbacks legados;
- docs e envs deixam de tratar Supabase Auth como runtime.

**Estratégia de rollback:**

- reintroduzir imports e configuração legada;
- manter helpers de compatibilidade;
- restaurar o fluxo Supabase como fallback operacional.

---

## Roadmap resumido

- PR 1 prepara a base de Logto.
- PR 2 liga sessão e callback.
- PR 3 troca a UI de autenticação.
- PR 4 protege o edge/runtime.
- PR 5 resolve identidade e vínculo com `perfis`.
- PR 6 devolve o fluxo de acompanhamentos.
- PR 7 migra admin e autorização.
- PR 8 remove o legado Supabase Auth.

## Estimativa de risco por PR

| PR | Risco |
|---|---|
| PR 1 | Baixo |
| PR 2 | Médio |
| PR 3 | Médio |
| PR 4 | Alto |
| PR 5 | Alto |
| PR 6 | Médio |
| PR 7 | Alto |
| PR 8 | Alto |

## Ponto de não retorno

O ponto de não retorno ocorre no PR 5, quando `logto_sub` passa a ser a identidade principal de aplicação e a reconciliação por `auth.users.email` deixa de ser apenas uma reserva teórica e passa a ser o mecanismo real de compatibilidade. A partir dali, o rollback continua possível, mas exige disciplina maior sobre dados legados e perfis já vinculados.

## Checklist de deploy

- Validar branches e PRs na ordem planejada.
- Confirmar variáveis `LOGTO_*` no ambiente.
- Confirmar redirect URIs no Console Logto.
- Testar login, logout e reset de senha antes de avançar ao PR seguinte.
- Validar painel, admin, acompanhamentos e analytics após PRs 4, 6 e 7.
- Somente remover o legado Supabase depois do PR 7 estabilizado.

## Checklist de rollback

- Reverter o PR mais recente primeiro.
- Preservar `supabase_user_id` e `auth_provider`.
- Manter o callback legado até a fase final.
- Desativar Logto com `AUTH_PROVIDER=supabase` se necessário.
- Não apagar helpers nem docs até a validação completa.
