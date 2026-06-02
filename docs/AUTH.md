---
file: docs/AUTH.md
module: Authentication & Authorization
status: Active
---

# Autenticação & Autorização — Meus Políticos

---

> **Nota de transição de identidade:** este documento descreve o estado legado
> Logto (`https://auth.norotec.cloud`) mantendo PostgreSQL VPS como banco
> principal. Ver `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

## Status Atual da Plataforma

| Eixo | Status |
|---|---|
| Banco | PostgreSQL VPS ativo |
| Público | Migrado para PostgreSQL direto |
| Painel/Admin | Aguardando Logto |
| Pagamentos | Stripe removido; InfinitePay ativo |

## 1. Visão geral

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Middleware | `app/src/proxy.ts` | Proteção de rotas por subdomínio |
| DB | `auth.users` → `perfis` | 1:1 — trigger cria perfil automático |
| Admin role | `perfis.role = 'admin'` | Acesso ao painel `/admin` |

---

## Identity Roadmap

| Estado | Provider | Banco | Observacao |
|---|---|---|---|

Documentos de governanca:

- `docs/auth/AUTH_MIGRATION_LOGTO.md`
- `docs/adr/ADR-001-logto-as-identity-provider.md`

---


O projeto usa três instâncias distintas dependendo do contexto de execução:

```typescript
  cookies: { getAll, setAll }   // lê/escreve document.cookie
})
```
- Usado em Client Components (`'use client'`)
- Cookie com `Domain=.meuspoliticos.com.br` (produção) ou `localhost` (dev)
- Compartilhado entre todos os subdomínios da sessão

```typescript
  cookies: { getAll, setAll }   // lê/escreve Next.js cookies() store
})
```
- Usado em Server Components e API Route Handlers
- `setAll` falha silenciosamente em Server Components sem middleware ativo (por design)

```typescript
  auth: { autoRefreshToken: false, persistSession: false }
})
```
- `createAdminClient()` — bypassa RLS completamente
- Usado apenas em API Routes admin-only e ETL

```typescript
// updateSession(request) — chamado em proxy.ts a cada requisição
createServerClient(URL, ANON_KEY, {
  cookies: { getAll, setAll }   // lê da request, escreve na response
})
```
- Renova o cookie JWT a cada request (desliza a expiração)

---

## 3. Cookie de sessão

| Ambiente | Domínio do cookie | Cobre |
|---|---|---|
| Produção | `.meuspoliticos.com.br` | `meuspoliticos.com.br`, `app.*`, `painel.*` |
| Desenvolvimento | `localhost` | `localhost:3000`, `app.localhost:3000`, `painel.localhost:3000` |

O cookie persiste a sessão entre todos os subdomínios sem re-login.

---

## 4. Proteção de rotas — proxy.ts

O arquivo `app/src/proxy.ts` é o middleware Next.js que executa em cada requisição.

### Fluxo de proteção

```mermaid
flowchart TD
    A[Requisição] --> B[updateSession — renova cookie]
    B --> C{host?}

    C -->|painel.*| D{user autenticado?}
    D -->|não — página| E[redirect /login]
    D -->|não — /api/*| F[return 401 JSON]
    D -->|sim| G[proxy — continua]

    C -->|app.*| H[rewrite / → /home]
    H --> I[rewrite /busca → /app-busca]
    I --> J[/login → redirect painel.*]

    C -->|meuspoliticos.* ou localhost| K{produção?}
    K -->|sim| L[/login → redirect painel.*]
    K -->|não| M[proxy — continua]
```

### Regras por subdomínio

| Subdomínio | Rota | Comportamento |
|---|---|---|
| `painel.*` | qualquer página sem sessão | `302 → /login` |
| `painel.*` | `/api/*` sem sessão | `401 { error: 'Não autenticado' }` |
| `app.*` | `/` | rewrite interno → `/home` |
| `app.*` | `/busca` | rewrite interno → `/app-busca` |
| `app.*` | `/login` | `302 → painel.*` |
| `meuspoliticos.*` (produção) | `/login` | `302 → painel.*` |

---

## 5. Fluxo OAuth (Google, Twitter/X, LinkedIn)

```
1. Usuário clica "Entrar com Google" em /login
3. Google retorna code para /auth/callback?code=xxx
4. app/src/app/(auth)/auth/callback/route.ts:
   b. Dev: redirect para redirectTo (padrão /painel) em localhost
   c. Prod: redirect para NEXT_PUBLIC_PAINEL_URL + /painel
5. Trigger on_auth_user_created cria perfil em public.perfis
   com nome extraído de raw_user_meta_data (full_name → name → email prefix)
```

**Provedores configurados:** Google, Twitter/X, LinkedIn
**Credenciais:** `GOOGLE_CLIENT_ID/SECRET`, `TWITTER_CLIENT_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET` — ver `app/.env.local`

---

## 6. Fluxo e-mail + senha

| Rota | Arquivo | Função |
|---|---|---|
| `/login` | `(painel)/(auth)/login/page.tsx` | Formulário e-mail + senha |
| `/cadastro` | `(painel)/(auth)/cadastro/page.tsx` | Criar conta + confirmação por e-mail |
| `/recuperar-senha` | `(painel)/(auth)/recuperar-senha/page.tsx` | Solicitar link de recuperação |
| `/recuperar-senha/confirmar` | `(painel)/(auth)/recuperar-senha/confirmar/page.tsx` | Definir nova senha via token |

E-mail transacional: **Resend** — template de confirmação e recuperação enviado de `noreply@meuspoliticos.com.br`.

---

## 7. Autorização — Roles

O sistema tem dois roles de usuário:

| Role | Valor em `perfis.role` | Acesso |
|---|---|---|
| Usuário comum | `'user'` (default) | Acompanhamentos, perfil próprio |
| Admin | `'admin'` | Painel `/admin`, todos os dados, RLS bypassado via policy |

### Como o role 'admin' é verificado

Duas estratégias coexistem no schema:

**1. Via JWT claim** (tabelas mais antigas):
```sql
auth.jwt() ->> 'role' = 'admin'
```

**2. Via tabela `perfis`** (tabelas mais novas):
```sql
EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
```
Não requer custom claim — verifica diretamente a tabela.


---

## 8. Proteção no layout admin

`app/src/app/(admin)/admin/layout.tsx` verifica role `admin` via Server Component:

```typescript
// Padrão esperado — verificação server-side antes de renderizar
// verifica perfis.role = 'admin' e redireciona se não autorizado
```

---

## 9. Configuração de subdomínios para desenvolvimento

Para que a autenticação funcione corretamente em dev local, adicione ao arquivo `hosts`:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Linux/macOS:** `/etc/hosts`

```
127.0.0.1 app.localhost
127.0.0.1 painel.localhost
```

Sem isso, o cookie de domínio `localhost` não é compartilhado e o login no painel não persiste em outros subdomínios.

---

## 10. Variáveis de ambiente relacionadas

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_PAINEL_URL` | URL de redirect pós-login OAuth (`https://painel.meuspoliticos.com.br`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | OAuth Twitter/X |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | OAuth LinkedIn |
| `RESEND_API_KEY` | E-mails transacionais |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
