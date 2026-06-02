---
file: docs/AUTH.md
module: Authentication and Authorization
status: Active
related: [docs/API.md, docs/INVENTORY_API_CONSUMPTION.md, docs/DATABASE.md, docs/SECURITY.md, app/src/proxy.ts, app/src/lib/logto/config.ts, app/src/lib/auth/current-user.ts]
---

# Auth

Data da consolidacao: 2026-06-02.

Este documento descreve o estado atual de autenticacao e autorizacao identificado no codigo: **Logto como provedor de identidade**, `perfis` como perfil interno/RBAC e PostgreSQL direto via `pg` para reconciliacao.

## Veredito

| Eixo | Estado atual |
|---|---|
| Provider ativo em codigo | Logto (`@logto/next`) |
| Runtime de sessao | `getLogtoContext`, `LogtoEdgeClient`, cookies Logto |
| Perfil interno | `public.perfis` |
| Chave externa de identidade | `perfis.logto_sub` |
| Compat legado | `perfis.supabase_user_id` e consulta a `auth.users` |
| RBAC | `perfis.role`, com valor `admin` para backoffice |
| Protecao de host painel | `app/src/proxy.ts` |
| Protecao admin | `getCurrentUser()` + `role !== 'admin'` em layout/paginas/APIs |
| Risco principal | Logto ativo ainda depende de fallback legado `auth.users` para reconciliacao por email |

## Componentes De Auth

| Arquivo | Responsabilidade |
|---|---|
| `app/src/lib/logto/config.ts` | Monta `LogtoNextConfig` e caminhos Logto |
| `app/src/lib/logto/session.ts` | Busca contexto Logto em Server Actions |
| `app/src/lib/logto/user.ts` | Converte claims/userInfo Logto em `CurrentUser` preliminar |
| `app/src/lib/auth/current-user.ts` | Resolve usuario atual e reconcilia com `perfis` |
| `app/src/lib/auth/profile-linking.ts` | Consulta/vincula perfil por `logto_sub` ou email legado |
| `app/src/lib/auth/proxy-session.ts` | Lê sessao Logto no Edge/proxy |
| `app/src/lib/auth/types.ts` | Tipos `CurrentUser`, `AuthProfile`, erros de auth |
| `app/src/proxy.ts` | Barreiras por host/subdominio |
| `app/src/app/api/auth/logto/*` | Sign-in, sign-up, reset, callback e sign-out |

## Variaveis De Ambiente

| Variavel | Obrigatoria | Uso |
|---|---|---|
| `LOGTO_ENDPOINT` | Sim | Tenant/endpoint Logto |
| `LOGTO_APP_ID` | Sim | App ID Logto |
| `LOGTO_APP_SECRET` | Sim | Secret server-side Logto |
| `LOGTO_COOKIE_SECRET` | Sim | Criptografia/sessao do cookie Logto |
| `LOGTO_BASE_URL` | Recomendado | Base URL usada no SDK |
| `NEXT_PUBLIC_APP_URL` | Fallback | Base URL alternativa |
| `NEXT_PUBLIC_SITE_URL` | Fallback | Base URL alternativa |
| `NEXT_PUBLIC_PAINEL_URL` | Sim para prod | Redirecionamentos para painel |
| `POSTGRES_*` | Sim | Reconciliacao em `perfis` |

`getLogtoConfig()` lança erro se `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET` ou `LOGTO_COOKIE_SECRET` estiverem ausentes.

## Configuracao Logto

Arquivo: `app/src/lib/logto/config.ts`.

| Propriedade | Valor |
|---|---|
| `endpoint` | `LOGTO_ENDPOINT` |
| `appId` | `LOGTO_APP_ID` |
| `appSecret` | `LOGTO_APP_SECRET` |
| `baseUrl` | `LOGTO_BASE_URL` ou `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_SITE_URL` ou `http://localhost:3000` |
| `cookieSecret` | `LOGTO_COOKIE_SECRET` |
| `cookieSecure` | `process.env.NODE_ENV === 'production'` |

Caminhos Logto:

| Constante | Valor |
|---|---|
| `logtoCallbackPath` | `/api/auth/logto/callback` |
| `logtoSignInPath` | `/api/auth/logto/sign-in` |
| `logtoSignOutPath` | `/api/auth/logto/sign-out` |

## Modelo De Usuario

Tipo `CurrentUser`:

| Campo | Origem |
|---|---|
| `provider` | Literal `logto` |
| `perfilId` | Depois da reconciliacao: `perfis.id`; antes: `claims.sub` |
| `email` | Logto `userInfo.email`/claims ou legado `auth.users.email` |
| `name` | `perfis.nome`, Logto `name` ou claim |
| `role` | `perfis.role`; default preliminar `user` |
| `logtoSub` | `perfis.logto_sub` ou `claims.sub` |
| `legacyAuthUserId` | `perfis.supabase_user_id` |
| `profile` | Objeto `AuthProfile` |

## Reconciliacao `Logto -> perfis`

Arquivo: `app/src/lib/auth/current-user.ts`.

Fluxo:

1. `getAuthenticatedLogtoSession()` retorna contexto Logto autenticado.
2. `buildCurrentUserFromLogto(session)` extrai `sub`, `email`, `name`.
3. `getProfileByLogtoSubPostgres(logtoSub)` procura `perfis.logto_sub`.
4. Se nao encontrar perfil, `getProfileByLegacyEmailPostgres(email)` procura usuario legado em `auth.users`.
5. Se perfil legado existir, `linkLogtoProfileByLegacyEmailPostgres(email, logtoSub)` atualiza:
   - `perfis.logto_sub = logtoSub`
   - `perfis.auth_provider = 'logto'`
   - `perfis.migrado_logto_em = now()`
6. Se nenhum perfil existir, `getCurrentUser()` retorna `null`.

SQL relevante:

| Operacao | Tabela | Uso |
|---|---|---|
| SELECT por `logto_sub` | `perfis` | Usuario ja migrado |
| SELECT email legado | `auth.users` | Fallback por email |
| SELECT perfil legado | `perfis` | Match por `supabase_user_id` ou `id` |
| UPDATE perfil | `perfis` | Vincula `logto_sub` |

Risco: nao foi identificada criacao automatica de novo `perfis` para usuario Logto sem perfil legado. Isso deve ser validado antes de producao.

## RBAC

Fonte de role: `perfis.role`.

| Role | Acesso |
|---|---|
| `user` | Painel autenticado, acompanhar politicos |
| `admin` | `/admin/*` e `/api/admin/*` |
| Outro valor string | Tipo permite, mas regras atuais so distinguem `admin` |

Helpers:

| Helper | Comportamento |
|---|---|
| `getCurrentUser()` | Retorna `CurrentUser` ou `null` |
| `requireUser()` | Lança `AuthRequiredError` sem usuario |
| `requireAdmin()` | Lança `AdminRequiredError` se `role !== 'admin'` |

Observacao: varias rotas fazem checagem manual com `getCurrentUser()` em vez de `requireAdmin()`.

## Barreiras De Rota Por Proxy

Arquivo: `app/src/proxy.ts`.

### Host `painel.*`

| Condicao | Resultado |
|---|---|
| Rota auth (`/login`, `/cadastro`, `/recuperar-senha`, `/auth/*`, `/api/auth/logto/*`) | Permitida sem sessao |
| Pagina nao-auth sem usuario | Redirect para `/login`, preservando `redirectTo` |
| API `/api/*` sem usuario | `401 { "error": "Não autenticado" }` |
| `/` | Redirect para `/painel` |
| Usuario autenticado | Continua |

### Host `app.*`

| Condicao | Resultado |
|---|---|
| `/login` | Redirect para `painel.* /login`, preservando query params |
| `/` | Redirect para `/home` |
| `/busca` | Rewrite para `/app-busca` |
| Demais rotas | Continua |

### Host principal

| Condicao | Resultado |
|---|---|
| `/login` em producao | Redirect para `NEXT_PUBLIC_PAINEL_URL/login` |
| `/login` em localhost | Servido localmente |
| Demais rotas | Publicas |

## Barreiras Admin

### Layout admin

Arquivo: `app/src/app/(admin)/admin/layout.tsx`.

Regra:

1. `getCurrentUser()`.
2. Sem usuario: `redirect('/login')`.
3. `role !== 'admin'`: `redirect('/painel')`.
4. Admin: renderiza layout.

### Paginas admin

As paginas `admin/page`, `admin/usuarios`, `admin/flags`, `admin/dados`, `admin/etl`, `admin/analytics` repetem checagem server-side:

| Sem usuario | `redirect('/login')` |
| Sem role admin | `redirect('/painel')` |

### APIs admin

Rotas:

- `PATCH /api/admin/flags`
- `PATCH /api/admin/politicos/[id]`
- `PATCH /api/admin/emendas/match`
- `POST /api/admin/etl/run`

Padrao:

| Condicao | Resposta |
|---|---|
| Sem usuario | `401 { "error": "Não autorizado" }` |
| Usuario nao-admin | `403 { "error": "Acesso negado" }` |
| Body invalido | `400 ...` |
| Erro Postgres | `500 { "error": pgError.message, "code": pgError.code }` |
| Sucesso | `{ "ok": true }` ou payload especifico |

## Rotas Auth Logto

| Endpoint | Metodo | Arquivo | Funcao |
|---|---|---|---|
| `/api/auth/logto/sign-in` | GET | `sign-in/route.ts` | Inicia login com scopes `openid`, `profile`, `email` |
| `/api/auth/logto/sign-up` | GET | `sign-up/route.ts` | Inicia cadastro com `interactionMode: signUp` |
| `/api/auth/logto/reset-password` | GET | `reset-password/route.ts` | Inicia tela `reset_password` com email opcional |
| `/api/auth/logto/callback` | GET | `callback/route.ts` | Executa `handleSignIn` e redireciona |
| `/api/auth/logto/sign-out` | GET | `sign-out/route.ts` | Executa `signOut` e volta para `/` |

### Sanitizacao de redirect

`sign-in` e `sign-up` usam `getSafeRedirectPath()`:

| Entrada | Resultado |
|---|---|
| Caminho relativo iniciado com `/` | Aceito |
| URL externa | Rejeitada, usa fallback |
| `//evil.com` | Rejeitada, usa fallback |

## Fluxo Login

1. UI chama/navega para `/api/auth/logto/sign-in?redirectTo=/painel`.
2. Handler monta `redirectUri = new URL('/api/auth/logto/callback', config.baseUrl)`.
3. Handler chama `signIn(config, { redirectUri, postRedirectUri, interactionMode: 'signIn' })`.
4. Logto autentica.
5. Callback chama `handleSignIn(config, callbackUrl)`.
6. Callback redireciona para `redirectTo` local ou para `NEXT_PUBLIC_PAINEL_URL`.
7. `getCurrentUser()` resolve perfil interno na renderizacao/API seguinte.

## Fluxo Cadastro

Identico ao login, mas com:

| Campo | Valor |
|---|---|
| `interactionMode` | `signUp` |
| fallback redirect | `/meus-politicos` |

Risco: usuario Logto novo sem `perfis` preexistente pode nao conseguir virar `CurrentUser` se nao houver criacao automatica de perfil.

## Fluxo Reset De Senha

Endpoint: `/api/auth/logto/reset-password?email=...`.

| Campo | Valor |
|---|---|
| `firstScreen` | `reset_password` |
| `identifiers` | `['email']` |
| `loginHint` | email opcional |
| `postRedirectUri` | `/login` |

## Fluxo Logout

Endpoint: `/api/auth/logto/sign-out`.

Chama `signOut(getLogtoConfig(), postSignOutRedirectUri.toString())`, com retorno para `/`.

## Acompanhamentos E Auth

| Endpoint | Regra |
|---|---|
| `POST /api/acompanhamentos` | Exige `getCurrentUser()`, usa `currentUser.perfilId` |
| `GET /api/acompanhamentos` | Sem usuario retorna `{ ids: [] }`, nao `401` |
| `DELETE /api/acompanhamentos/[politicoId]` | Exige `getCurrentUser()` |

## RLS E Realidade Do Runtime

O schema SQL ainda contem politicas com `auth.uid()`/`auth.jwt()` do Supabase. O app atual usa `pg` direto e Logto. Portanto:

| Ponto | Risco |
|---|---|
| RLS baseado em Supabase Auth | Pode nao refletir usuario Logto |
| Conexao Postgres direta | Permissao efetiva depende do role usado em `POSTGRES_USER` |
| Admin em app | Protegido por checagem server-side, nao apenas RLS |
| Acompanhamentos | Protegidos por API/server code; RLS real precisa validacao |

## Gaps De Auth

| Gap | Severidade | Acao |
|---|---|---|
| Criacao de `perfis` para usuario Logto novo nao confirmada | P1 | Implementar/revisar provisioning |
| Dependencia residual de `auth.users` | P1/P2 | Definir plano de desligamento |
| RLS legado vs Logto | P1 | Validar grants e role Postgres |
| Checagens admin duplicadas manualmente | P2 | Centralizar helper/pattern |
| Erro Postgres exposto em APIs admin/auth-dependentes | P2 | Normalizar respostas |

