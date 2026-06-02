---
file: docs/auth/LOGTO_RUNTIME_CHECKLIST.md
module: Sprint 2B - Logto Runtime Implementation Checklist
status: Active
related: [docs/auth/LOGTO_RUNTIME_PLAN.md, docs/auth/LOGTO_IMPLEMENTATION_PLAN.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md]
---

# Sprint 2B - Checklist de Implementação por PRs

Objetivo: quebrar o plano de runtime Logto em PRs pequenos, com ordem segura de entrega.

Escopo:

- não altera código;
- não altera banco;
- não cria migrations;
- apenas organiza a implementação futura em lotes menores e auditáveis.

## Ordem sugerida

1. PR 1 - Instalação e configuração Logto
2. PR 2 - Callback e sessão
3. PR 3 - Login, cadastro, logout
4. PR 4 - Middleware e proteção de rotas
5. PR 5 - Perfil e reconciliação
6. PR 6 - Acompanhamentos
7. PR 7 - Admin
8. PR 8 - Remoção Supabase Auth legado

---

## PR 1 - Instalação e configuração Logto

| Campo | Detalhe |
|---|---|
| Objetivo | Preparar o projeto para o runtime Logto sem mudar comportamento funcional ainda. |
| Arquivos prováveis | `app/package.json`, `app/logto.ts`, `.env.example`, `docs/ENVIRONMENT.md`, `docs/auth/LOGTO_RUNTIME_PLAN.md`, `docs/auth/AUTH_MIGRATION_LOGTO.md` |
| Critérios de aceite | `@logto/next` instalado; variáveis `LOGTO_*` documentadas; config central criada; rotas base definidas para login/logout/callback. |
| Testes | `npm ls @logto/next`; revisão de build sem runtime; validação manual dos redirects previstos no Console Logto. |
| Riscos | Configuração incompleta de `cookieSecret`; redirect URI divergente; app Logto criado com tipo errado; conflito com sessões Supabase ainda ativas. |
| Rollback | Remover `@logto/next`, apagar `app/logto.ts`, voltar a usar apenas o runtime legado, manter docs como referência. |

---

## PR 2 - Callback e sessão

| Campo | Detalhe |
|---|---|
| Objetivo | Fazer o callback Logto emitir sessão válida e centralizar a leitura de usuário autenticado. |
| Arquivos prováveis | `app/src/app/(auth)/auth/callback/route.ts`, `app/src/lib/logto/session.ts`, `app/src/lib/logto/user.ts`, `app/src/lib/auth/current-user.ts`, `app/src/lib/auth/profile-linking.ts`, `docs/auth/LOGTO_RUNTIME_PLAN.md` |
| Critérios de aceite | Callback usa `handleSignIn`; sessão é lida com Logto; `getCurrentUser()` retorna usuário de aplicação a partir de claims Logto. |
| Testes | Login redireciona para callback e retorna autenticado; logout não quebra a sessão; `getCurrentUser()` funciona em Server Components e route handlers. |
| Riscos | Cookie de sessão não persistir entre subdomínios; callback não respeitar redirect; `getCurrentUser()` divergir do modelo de usuário de aplicação. |
| Rollback | Reverter callback para Supabase, preservar helpers Logto como código morto temporário, não remover o fluxo legado até estabilização. |

---

## PR 3 - Login, cadastro, logout

| Campo | Detalhe |
|---|---|
| Objetivo | Substituir as ações de autenticação da interface pelo fluxo Logto. |
| Arquivos prováveis | `app/src/components/auth/LoginForm.tsx`, `app/src/components/auth/CadastroForm.tsx`, `app/src/components/auth/RecuperarSenhaForm.tsx`, `app/src/components/meus-politicos/BotaoSair.tsx`, `app/src/app/(painel)/(auth)/login/page.tsx`, `app/src/app/(painel)/(auth)/cadastro/page.tsx`, `app/src/app/(painel)/(auth)/recuperar-senha/page.tsx` |
| Critérios de aceite | Login, cadastro e logout usam o SDK Logto; reset de senha segue o fluxo Logto; UX continua com as mesmas páginas de entrada. |
| Testes | Login social e e-mail/senha; cadastro novo; recuperação de senha; logout encerra sessão local e central; redirecionamentos pós-ação corretos. |
| Riscos | Diferença de UX entre fluxo Supabase e Logto; reset de senha não cobrir casos antigos; usuários confundir login e cadastro se a experiência for alterada demais. |
| Rollback | Reverter os handlers das telas para Supabase, manter URLs e páginas intactas, não remover ainda o callback ou a camada de sessão antiga. |

---

## PR 4 - Middleware e proteção de rotas

| Campo | Detalhe |
|---|---|
| Objetivo | Trocar a leitura/renovação de sessão no edge e manter a política de rotas por host. |
| Arquivos prováveis | `app/src/proxy.ts`, `app/src/lib/supabase/middleware.ts`, `app/src/lib/auth/current-user.ts`, `app/src/lib/auth/providers.ts`, `app/src/app/(painel)/(dashboard)/painel/page.tsx`, `app/src/app/(admin)/admin/layout.tsx` |
| Critérios de aceite | `proxy` usa sessão Logto; rotas protegidas continuam bloqueando anonimos; painel e admin continuam fechados para usuário sem permissão. |
| Testes | Acesso a `/login`, `/cadastro`, `/recuperar-senha`; usuário anônimo bloqueado no painel; admin protegido; subdomínios `app.*` e `painel.*` preservados. |
| Riscos | Quebra de redirecionamento em `painel.*`; perda de cookie entre subdomínios; regra de auth route ficar mais permissiva do que deveria. |
| Rollback | Reverter `proxy` e `middleware` para Supabase, manter rotas e guards originais, deixar o fluxo Logto desativado por flag. |

---

## PR 5 - Perfil e reconciliação

| Campo | Detalhe |
|---|---|
| Objetivo | Vincular a identidade Logto ao perfil da aplicação sem perder compatibilidade com a base legada. |
| Arquivos prováveis | `app/src/lib/auth/profile-linking.ts`, `app/src/lib/auth/current-user.ts`, `app/src/lib/auth/types.ts`, `docs/auth/LOGTO_RUNTIME_PLAN.md`, `docs/auth/AUTH_MIGRATION_LOGTO.md` |
| Critérios de aceite | `logto_sub` é a identidade principal; `supabase_user_id` continua como legado; reconciliação por `auth.users.email` só funciona como fallback controlado. |
| Testes | Usuário legado vinculado por `logto_sub`; usuário legado vinculado por e-mail único; e-mail duplicado bloqueia vínculo automático; perfil novo é criado quando não há match. |
| Riscos | Ambiguidade por e-mail duplicado; perda de vínculo com perfis existentes; preenchimento incorreto de `auth_provider` ou `migrado_logto_em`. |
| Rollback | Voltar a usar `supabase_user_id` como identificador de trabalho, preservar `logto_sub` e não promover a identidade Logto como única fonte até validar tudo. |

### Status Sprint 5B/5C

Status: concluído.

- Login Logto operacional.
- Callback Logto operacional.
- Reconciliação automática por e-mail legado operacional.
- `logto_sub` preenchido automaticamente em `public.perfis`.
- `auth_provider` migrado para `logto`.
- `migrado_logto_em` preenchido no momento do vínculo.
- Supabase Auth não é mais necessário para usuários já migrados.

Critério operacional adicional: se um usuário Logto não resolver um perfil de aplicação, o runtime não deve usar `claims.sub` como `perfilId`, pois `perfilId` precisa representar `public.perfis.id`.

---

## PR 6 - Acompanhamentos

| Campo | Detalhe |
|---|---|
| Objetivo | Migrar o follow/unfollow para a identidade de aplicação já resolvida pelo Logto. |
| Arquivos prováveis | `app/src/app/api/acompanhamentos/route.ts`, `app/src/app/api/acompanhamentos/[politicoId]/route.ts`, `app/src/components/politico/BotaoAcompanhar.tsx`, `app/src/app/(painel)/(dashboard)/painel/page.tsx`, `app/src/lib/auth/current-user.ts` |
| Critérios de aceite | Follow/unfollow funcionam com `CurrentUser`; `meus-politicos` continua encaminhando para o painel; `isSeguindo` usa a identidade nova sem quebrar a UI. |
| Testes | Seguir político autenticado; remover acompanhamento; listar IDs seguidos; redirecionamento para login quando anônimo; auto-follow pós-login preservado. |
| Riscos | `usuario_id` legado ainda ser usado em algum ponto; inconsistência entre painel e API; duplicidade de registro ao migrar identidade. |
| Rollback | Reverter handlers para `user.id` Supabase e manter as políticas antigas enquanto a migração de identidade não estiver fechada. |

---

## PR 7 - Admin

| Campo | Detalhe |
|---|---|
| Objetivo | Mover autorização de admin para a identidade de aplicação e preservar as rotas administrativas. |
| Arquivos prováveis | `app/src/app/(admin)/admin/layout.tsx`, `app/src/app/(admin)/admin/page.tsx`, `app/src/app/(admin)/admin/analytics/page.tsx`, `app/src/app/(admin)/admin/usuarios/page.tsx`, `app/src/app/(admin)/admin/flags/page.tsx`, `app/src/app/(admin)/admin/etl/page.tsx`, `app/src/app/(admin)/admin/dados/page.tsx`, `app/src/app/api/admin/*`, `app/src/lib/auth/current-user.ts` |
| Critérios de aceite | `requireAdmin()` funciona; `perfis.role` continua sendo a fonte de autorização; APIs admin continuam protegidas; listagem de usuários não perde capacidade operacional. |
| Testes | Usuário comum bloqueado; admin aprovado; listagem de usuários válida; rotas de flags, ETL e dados acessíveis só para admin; analytics admin continua funcional. |
| Riscos | Dependência prolongada de `adminClient.auth.admin.listUsers`; confusão entre role legada e role nova; quebra de acesso administrativo em produção. |
| Rollback | Reverter autorização para o modelo antigo baseado em Supabase; preservar as rotas e o adminClient até a validação completa do novo modelo. |

---

## PR 8 - Remoção Supabase Auth legado

| Campo | Detalhe |
|---|---|
| Objetivo | Remover do runtime os resíduos de Supabase Auth depois que o Logto estiver estável. |
| Arquivos prováveis | `app/src/lib/supabase/*`, `app/src/components/auth/*`, `app/src/components/meus-politicos/BotaoSair.tsx`, `app/src/app/(auth)/auth/callback/route.ts`, `app/src/proxy.ts`, `.env.example`, `docs/ENVIRONMENT.md`, `docs/AUTH.md`, `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md`, `docs/AUTH_MIGRATION_LOGTO.md` |
| Critérios de aceite | Nenhum fluxo de auth depende de `@supabase/ssr`, `@supabase/supabase-js`, `SUPABASE_SERVICE_ROLE_KEY` ou callbacks legados; docs e envs deixam de tratar Supabase Auth como runtime. |
| Testes | Busca por `supabase.auth` no runtime retorna zero; login/logout/cadastro/reset usam Logto; painel/admin continuam estáveis; docs não prometem mais Supabase Auth como caminho ativo. |
| Riscos | Remoção prematura quebrar painel, admin ou rotas públicas; algum fluxo antigo ainda depender de `user.id`; logout e recuperação de senha ficarem incompletos. |
| Rollback | Reintroduzir os imports e a configuração legada, manter os helpers de compatibilidade e restaurar o fluxo Supabase como fallback operacional. |
