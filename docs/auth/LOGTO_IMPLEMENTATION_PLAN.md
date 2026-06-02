---
file: docs/auth/LOGTO_IMPLEMENTATION_PLAN.md
module: Sprint 2A - Auth Inventory for Logto Migration
status: Active
related: [docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md, docs/ARCHITECTURE.md, docs/AUTH.md, docs/PROJECT_STATUS_2026-06.md, app/src/lib/auth/current-user.ts, app/src/lib/auth/profile-linking.ts, app/src/lib/auth/providers.ts]
---

# Sprint 2A - Inventário Completo de Auth

Objetivo: mapear exatamente como o Supabase Auth é usado hoje, sem implementar nada.

## Escopo deste inventário

- Não altera código.
- Não altera banco.
- Não cria migration.
- Não propõe reescrita de fluxos ainda.
- Apenas documenta o runtime atual e os pontos de dependência para a migração Logto.

## Leitura executiva

Hoje o runtime ainda depende de Supabase Auth diretamente em login, cadastro, recuperação de senha, logout, middleware, painel, admin, acompanhamentos e analytics. Existe scaffolding preparado para a migração (`app/src/lib/auth/*`), mas os consumidores de produção ainda chamam `supabase.auth.*` e `createClient()`/`createAdminClient()` diretamente.

Observação importante: o fluxo de recuperação de senha monta `redirectTo=/auth/callback?next=/conta/nova-senha`, mas o callback atual lê `redirectTo`, não `next`. Isso é o comportamento real hoje e deve ser tratado como ponto de risco/documentação, não como comportamento assumido.

---

## 1. Fluxo de login

### Entrada

- Página: `/login`
- Implementação: `app/src/app/(painel)/(auth)/login/page.tsx`
- Componente: `app/src/components/auth/LoginForm.tsx`

### Caminho atual

1. O usuário entra em `/login`.
2. A página renderiza `AuthShell` + `LoginForm`.
3. O formulário oferece:
   - Google OAuth
   - X/Twitter OAuth
   - LinkedIn OAuth
   - e-mail + senha
4. OAuth chama `supabase.auth.signInWithOAuth(...)`.
5. O redirect aponta para `/auth/callback?redirectTo=...`.
6. E-mail + senha chama `supabase.auth.signInWithPassword({ email, password })`.
7. Em sucesso, o browser redireciona para `redirectTo` ou `/painel`.

### Observações

- O `redirectTo` vem da query string e defaulta para `/painel`.
- O callback depende de `supabase.auth.exchangeCodeForSession(code)`.
- O login ainda é Supabase Auth puro, sem Logto no runtime.

### Dependências diretas

- `app/src/components/auth/LoginForm.tsx`
- `app/src/app/(auth)/auth/callback/route.ts`
- `app/src/lib/supabase/client.ts`
- `app/src/lib/supabase/server.ts`
- `app/src/lib/supabase/middleware.ts`

---

## 2. Fluxo de cadastro

### Entrada

- Página: `/cadastro`
- Implementação: `app/src/app/(painel)/(auth)/cadastro/page.tsx`
- Componente: `app/src/components/auth/CadastroForm.tsx`

### Caminho atual

1. O usuário entra em `/cadastro`.
2. A página renderiza `AuthShell` + `CadastroForm`.
3. O formulário oferece:
   - Google OAuth
   - X/Twitter OAuth
   - e-mail + senha
4. OAuth chama `supabase.auth.signInWithOAuth(...)`.
5. O fluxo de e-mail + senha chama `supabase.auth.signUp({ email, password, options: { data: { nome } } })`.
6. Em sucesso, o frontend navega para `/meus-politicos`.
7. A rota `/meus-politicos` redireciona para `/painel` se houver sessão válida.

### Observações

- O nome informado no cadastro vai em `user_metadata.nome`.
- Não há integração Logto nesta etapa.
- A lógica atual pressupõe que a sessão já esteja disponível ao final do signup.

### Dependências diretas

- `app/src/components/auth/CadastroForm.tsx`
- `app/src/app/(painel)/(dashboard)/meus-politicos/page.tsx`
- `app/src/app/(auth)/auth/callback/route.ts`
- `app/src/lib/supabase/client.ts`

---

## 3. Fluxo de recuperação de senha

### Entrada

- Página: `/recuperar-senha`
- Implementação: `app/src/app/(painel)/(auth)/recuperar-senha/page.tsx`
- Componente: `app/src/components/auth/RecuperarSenhaForm.tsx`

### Caminho atual

1. O usuário entra em `/recuperar-senha`.
2. O formulário chama `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
3. O `redirectTo` atual é:
   - `${window.location.origin}/auth/callback?next=/conta/nova-senha`
4. O Supabase envia o link de recuperação por e-mail.
5. O usuário clica no link e volta para `/auth/callback`.

### Observações

- O formulário prepara `next=/conta/nova-senha`.
- O callback atual lê `redirectTo`, não lê `next`.
- Portanto, o comportamento de destino final hoje depende do callback Supabase existente, não de uma rota própria de reset no app.

### Dependências diretas

- `app/src/components/auth/RecuperarSenhaForm.tsx`
- `app/src/app/(auth)/auth/callback/route.ts`
- `app/src/lib/supabase/client.ts`

---

## 4. Fluxo de logout

### Entrada

- Componente: `app/src/components/meus-politicos/BotaoSair.tsx`

### Caminho atual

1. O usuário clica em `Sair`.
2. O componente chama `supabase.auth.signOut()`.
3. Depois redireciona para `/`.
4. Em seguida chama `router.refresh()`.

### Observações

- O logout é totalmente Supabase Auth.
- Não há camada intermediária própria para encerrar sessão.

### Dependências diretas

- `app/src/components/meus-politicos/BotaoSair.tsx`
- `app/src/lib/supabase/client.ts`

---

## 5. Middleware

### Arquivos

- `app/src/lib/supabase/middleware.ts`
- `app/src/proxy.ts`

### Caminho atual

1. Toda request passa por `proxy(request)`.
2. O proxy chama `updateSession(request)`.
3. `updateSession` cria um `createServerClient(...)` via `@supabase/ssr`.
4. O middleware lê e renova cookies da sessão Supabase.
5. O `proxy` usa o `user` retornado por `supabase.auth.getUser()`.

### Observações

- O comentário do middleware diz explicitamente para não inserir código entre `createServerClient` e `supabase.auth.getUser()`.
- O cookie é compartilhado entre subdomínios.
- Em produção, o domínio de cookie é `.meuspoliticos.com.br`.

### Dependências diretas

- `app/src/lib/supabase/middleware.ts`
- `app/src/proxy.ts`
- `app/src/lib/supabase/server.ts`

---

## 6. Proteção de rotas

### Site público e painel

- `painel.*` exige sessão para qualquer rota fora de auth.
- `app.*` redireciona `/login` para o painel.
- `meuspoliticos.com.br` redireciona `/login` para o painel em produção.

### Regras atuais no proxy

- `painel.*` sem usuário:
  - páginas: `302 -> /login`
  - `/api/*`: `401`
- `painel.*` com usuário:
  - `/` -> `/painel`
- `app.*`:
  - `/login` -> painel
  - `/` -> `/home`
  - `/busca` -> rewrite para `/app-busca`
- site público:
  - `/login` -> painel em produção

### Observações

- A proteção de rotas ainda é feita por Supabase Auth no middleware/proxy.
- O redirecionamento para login é parte central do fluxo de acesso ao painel.

---

## 7. Painel

### Página principal

- Rota: `/painel`
- Implementação: `app/src/app/(painel)/(dashboard)/painel/page.tsx`

### Caminho atual

1. A página cria `createClient()`.
2. Lê `supabase.auth.getUser()`.
3. Se não houver usuário, redireciona para `/login`.
4. Busca o perfil em `perfis` usando `user.id`.
5. Busca `acompanhamentos` por `usuario_id = user.id`.
6. Usa os IDs seguidos para montar feed, métricas e listas laterais.

### Observações

- O painel ainda depende do `user.id` do Supabase como identidade operacional.
- A camada de acompanhamento ainda usa `usuario_id` ligado à identidade Supabase.

### Dependências diretas

- `app/src/app/(painel)/(dashboard)/painel/page.tsx`
- `app/src/lib/supabase/server.ts`
- `app/src/components/painel/*`

---

## 8. Admin

### Layout e páginas

- `app/src/app/(admin)/admin/layout.tsx`
- `app/src/app/(admin)/admin/page.tsx`
- `app/src/app/(admin)/admin/analytics/page.tsx`
- `app/src/app/(admin)/admin/usuarios/page.tsx`
- `app/src/app/(admin)/admin/flags/page.tsx`
- `app/src/app/(admin)/admin/etl/page.tsx`
- `app/src/app/(admin)/admin/dados/page.tsx`
- `app/src/app/api/admin/*`

### Caminho atual

1. O layout de admin lê `supabase.auth.getUser()`.
2. Sem usuário, redireciona para `/`.
3. Com `user.id`, busca `perfis.role` via `createAdminClient()`.
4. Se `role !== 'admin'`, redireciona para `/`.
5. As páginas internas usam `createAdminClient()` para leitura e escrita administrativa.

### Admin de usuários

- A tela de usuários usa `adminClient.auth.admin.listUsers()`.
- Isso é dependência direta da API administrativa do Supabase Auth.

### Observações

- Admin é o maior consumidor direto de Supabase Auth fora do painel.
- Há leitura simultânea de:
  - sessão via `supabase.auth.getUser()`
  - dados administrativos via `createAdminClient()`
  - metadata de usuários via `adminClient.auth.admin.listUsers()`

---

## 9. Acompanhamentos

### API

- `app/src/app/api/acompanhamentos/route.ts`
- `app/src/app/api/acompanhamentos/[politicoId]/route.ts`

### Caminho atual

1. A request cria `createClient()`.
2. Lê `supabase.auth.getUser()`.
3. Se não houver usuário:
   - `POST` retorna `401`
   - `GET` retorna lista vazia
   - `DELETE` retorna `401`
4. Se houver usuário:
   - `POST` insere `acompanhamentos { usuario_id: user.id, politico_id }`
   - `GET` lista `politico_id` filtrando por `usuario_id = user.id`
   - `DELETE` remove por `usuario_id = user.id` e `politico_id`

### Interface pública

- `app/src/components/politico/BotaoAcompanhar.tsx`

### Caminho do botão

1. O botão tenta acompanhar/desacompanhar.
2. Se não houver sessão, monta URL para `/login?redirectTo=...`.
3. Em ambiente local, usa `painel.localhost`.
4. Em produção, usa `NEXT_PUBLIC_PAINEL_URL`.

### Observações

- A funcionalidade de acompanhamento é diretamente dependente do `user.id` Supabase.
- As policies e FKs de `acompanhamentos` ainda fazem parte do modelo legível pelo app.

---

## 10. Analytics dependentes de usuário

### Coleta

- `app/src/app/api/analytics/route.ts`
- `app/src/lib/analytics.ts`

### Caminho atual

1. O cliente chama `track(tipo, payload)` no browser.
2. O helper faz `POST /api/analytics`.
3. A API cria `createClient()`.
4. Lê `supabase.auth.getUser()`.
5. Insere em `analytics_eventos` com:
   - `tipo`
   - `payload`
   - `usuario_id = user.id` se autenticado
   - `usuario_id = null` se anônimo

### Observações

- O tracking em si é best-effort e não bloqueia a UI.
- O dado de usuário é opcional, mas quando existe é Supabase `user.id`.
- O admin de analytics lê esses eventos com `createAdminClient()`.

### Dependências diretas

- `app/src/lib/analytics.ts`
- `app/src/app/api/analytics/route.ts`
- `app/src/app/(admin)/admin/analytics/page.tsx`

---

## Mapa de dependências para a migração Logto

### Hoje ainda dependem de Supabase Auth diretamente

- login
- cadastro
- recuperação de senha
- logout
- middleware
- proteção de rotas
- painel
- admin
- acompanhamentos
- analytics com `usuario_id`

### Scaffolding já preparado para migração

- `app/src/lib/auth/providers.ts`
- `app/src/lib/auth/profile-linking.ts`
- `app/src/lib/auth/current-user.ts`

### Inference explícita

Com base no `rg` atual, esses helpers existem como preparação para a migração, mas os consumidores de runtime ainda chamam Supabase diretamente. Isso significa que o inventário acima representa o estado vivo hoje, não o estado alvo.

