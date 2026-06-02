---
file: docs/ENVIRONMENT.md
module: Environment Variables Reference
status: Active
related: [README.md, docs/AUTH.md, docs/DEPLOYMENT.md, .env.example]
---

# Variáveis de Ambiente — Referência Completa

> ⚠️ **Segurança:** este documento usa apenas placeholders. Os valores reais estão em `app/.env.local` (nunca commitado). Solicitar ao responsável do projeto ou gerenciador de senhas.

> ⚠️ **Gap G-01 (P0):** `.env.example` na raiz do repositório contém apenas o subconjunto mínimo de variáveis documentadas aqui. Atualizar conforme este arquivo.

---

## Como configurar

```bash
# 1. Copiar o template (incompleto — ver seções abaixo para completar)
cp .env.example app/.env.local

# 2. Preencher com os valores reais (ver gerenciador de senhas)
# app/.env.local — nunca commitar este arquivo
```

O arquivo `app/next.config.ts` usa `loadEnvConfig` do `@next/env` para carregar as variáveis do diretório pai (`../`), permitindo que o arquivo `.env.local` fique na raiz `app/` e seja lido pelo Next.js normalmente.

---

## 1. Supabase (núcleo da aplicação)

| Variável | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Sim | URL pública do Supabase — `https://supabase.meuspoliticos.com.br` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Sim | Chave anônima JWT — respeita RLS — segura para expor no cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | ✅ Sim | Chave de service role — bypassa RLS — **nunca expor no cliente** |
| `SUPABASE_URL` | Server | ✅ Sim | URL do Supabase para uso server-side (idêntica à pública, mas sem `NEXT_PUBLIC_`) |

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.meuspoliticos.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT anon — ver gerenciador de senhas>
SUPABASE_SERVICE_ROLE_KEY=<JWT service_role — ver gerenciador de senhas>
SUPABASE_URL=https://supabase.meuspoliticos.com.br
```

---

## 2. Banco de dados (acesso direto — ETL e scripts)

Usado pelos scripts Python ETL e por conexões diretas via `pg` (Node.js). **Nunca usar em código do frontend.**

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SUPABASE_DB_HOST` | ETL only | Host do PostgreSQL — `45.32.169.173` (produção) ou `localhost` (dev via SSH tunnel) |
| `SUPABASE_DB_PORT` | ETL only | Porta do PostgreSQL — `5432` (produção) ou `5433` (SSH tunnel local) |
| `SUPABASE_DB_USER` | ETL only | Usuário do banco — `postgres` |
| `SUPABASE_DB_PASSWORD` | ETL only | Senha do banco — ver gerenciador de senhas |
| `POSTGRES_HOST` | Servidor | Host para conexão Node.js direta — `localhost` em dev (SSH tunnel) |
| `POSTGRES_PORT` | Servidor | Porta Node.js — `5433` em dev local via SSH tunnel |
| `POSTGRES_DB` | Servidor | Nome do banco — `meuspoliticos_db` |
| `POSTGRES_USER` | Servidor | Usuário — `postgres` |
| `POSTGRES_PASSWORD` | Servidor | Senha — ver gerenciador de senhas |

**SSH tunnel para desenvolvimento local:**
```bash
ssh -L 5433:10.0.2.2:5432 root@45.32.169.173 -N -o ServerAliveInterval=30
```

**Em produção (Coolify):** `POSTGRES_HOST=supabase-db-v2ve0851flv0yljb0fy1r9oq` (nome do container Docker interno)

```env
SUPABASE_DB_HOST=45.32.169.173
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<ver gerenciador de senhas>
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=meuspoliticos_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<ver gerenciador de senhas>
```

---

## 3. URLs de subdomínios

Usadas para redirects OAuth, links em e-mails e configuração do middleware.

| Variável | Dev local | Produção |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://meuspoliticos.com.br` |
| `NEXT_PUBLIC_APP_URL` | `http://app.localhost:3000` | `https://app.meuspoliticos.com.br` |
| `NEXT_PUBLIC_PAINEL_URL` | `http://painel.localhost:3000` | `https://painel.meuspoliticos.com.br` |

```env
NEXT_PUBLIC_SITE_URL=https://meuspoliticos.com.br
NEXT_PUBLIC_APP_URL=https://app.meuspoliticos.com.br
NEXT_PUBLIC_PAINEL_URL=https://painel.meuspoliticos.com.br
```

---

## 4. Auth runtime — Supabase legado / Logto em preparação

### Status atual

Supabase Auth continua sendo o runtime ativo. Logto está em preparação e só deve ser ativado quando `AUTH_PROVIDER=logto` for definido junto com callback, sessão e substituição dos fluxos de autenticação.

| Variável | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `AUTH_PROVIDER` | Server | ✅ Sim | Provedor runtime. Default seguro atual: `supabase` |
| `LOGTO_ENDPOINT` | Server | Logto only | Endpoint do tenant Logto |
| `LOGTO_APP_ID` | Server | Logto only | App ID da aplicação Logto |
| `LOGTO_APP_SECRET` | Secret | Logto only | App secret da aplicação Logto — **nunca expor no cliente** |
| `LOGTO_COOKIE_SECRET` | Secret | Logto only | Secret usado para assinar cookies de sessão Logto — **nunca expor no cliente** |

```env
AUTH_PROVIDER=supabase
LOGTO_ENDPOINT=<endpoint-logto>
LOGTO_APP_ID=<logto-app-id>
LOGTO_APP_SECRET=<logto-app-secret>
LOGTO_COOKIE_SECRET=<logto-cookie-secret>
```

---

## 5. Pagamentos

### Status atual

Stripe foi removido do runtime e da configuração oficial. O fluxo ativo de apoio usa InfinitePay.

### InfinitePay

| Variável | Obrigatória | Descrição |
|---|---|---|
| `INFINITEPAY_HANDLE` | ✅ Sim | Handle do comerciante InfinitePay — `meus-politicos` |

```env
INFINITEPAY_HANDLE=meus-politicos
```

> ⚠️ **Gap G-03:** o webhook InfinitePay ainda não persiste doações no banco.

---

## 6. APIs externas

| Variável | Obrigatória | Descrição |
|---|---|---|
| `OPENAI_API_KEY` | ✅ Sim | Chave OpenAI — tradução de juridiquês, resumos de candidatos |
| `IA_RESUMO_MAX_GERACOES_DIA` | Não (default: 3) | Limite diário de gerações de resumo interpretativo por político |
| `PORTAL_TRANSPARENCIA_API_KEY` | ETL only | Chave da API da CGU — Portal da Transparência — coleta de emendas |

```env
OPENAI_API_KEY=sk-proj-<ver gerenciador de senhas>
IA_RESUMO_MAX_GERACOES_DIA=3
PORTAL_TRANSPARENCIA_API_KEY=<ver gerenciador de senhas>
```

---

## 7. E-mail transacional (Resend)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `RESEND_API_KEY` | ✅ Sim | Chave da API Resend — e-mails de confirmação e recuperação de senha |
| `RESEND_FROM` | ✅ Sim | Endereço remetente — `noreply@meuspoliticos.com.br` |

```env
RESEND_API_KEY=re_<ver gerenciador de senhas>
RESEND_FROM=noreply@meuspoliticos.com.br
```

**Plano atual:** Free Resend — 3.000 e-mails/mês. DNS SPF/DKIM configurado no Cloudflare.

---

## 8. OAuth — provedores

### Google

| Variável | Descrição |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID do app Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret |

**Redirect URI:** `https://supabase.meuspoliticos.com.br/auth/v1/callback`

```env
GOOGLE_CLIENT_ID=<ver gerenciador de senhas>
GOOGLE_CLIENT_SECRET=<ver gerenciador de senhas>
```

### Twitter / X

| Variável | Descrição |
|---|---|
| `TWITTER_CLIENT_ID` | Client ID do app Twitter Developer Portal |
| `TWITTER_CLIENT_SECRET` | Client Secret |

```env
TWITTER_CLIENT_ID=<ver gerenciador de senhas>
TWITTER_CLIENT_SECRET=<ver gerenciador de senhas>
```

### LinkedIn

| Variável | Descrição |
|---|---|
| `LINKEDIN_CLIENT_ID` | Client ID do app LinkedIn Developer |
| `LINKEDIN_CLIENT_SECRET` | Client Secret |

```env
LINKEDIN_CLIENT_ID=<ver gerenciador de senhas>
LINKEDIN_CLIENT_SECRET=<ver gerenciador de senhas>
```

> Os três provedores OAuth são configurados no Supabase Dashboard → Authentication → Providers.

---

## 9. Supabase Dashboard / Studio

Credenciais de acesso à interface web do Supabase self-hosted em `https://supabase.meuspoliticos.com.br`.

| Variável | Descrição |
|---|---|
| `SUPABASE_DASHBOARD_USER` | Usuário do Supabase Studio — `noro_meuspoliticos` |
| `SUPABASE_DASHBOARD_PASSWORD` | Senha do Supabase Studio |
| `DASHBOARD_USER` | Alias (duplicata) |
| `DASHBOARD_PASSWORD` | Alias (duplicata) |

```env
SUPABASE_DASHBOARD_USER=noro_meuspoliticos
SUPABASE_DASHBOARD_PASSWORD=<ver gerenciador de senhas>
DASHBOARD_USER=noro_meuspoliticos
DASHBOARD_PASSWORD=<ver gerenciador de senhas>
```

---

## 10. MinIO (storage de arquivos)

MinIO é o S3-compatible storage do Supabase self-hosted (rodando no mesmo VPS Vultr).

| Variável | Descrição |
|---|---|
| `MINIO_USER` | Usuário admin do MinIO — `noro_meuspoliticos` |
| `MINIO_PASSWORD` | Senha admin do MinIO |

```env
MINIO_USER=noro_meuspoliticos
MINIO_PASSWORD=<ver gerenciador de senhas>
```

---

## 11. Template completo `.env.example`

O arquivo `.env.example` na raiz deve ser atualizado para incluir todas as variáveis abaixo (**Gap G-01**):

```env
# ============================================================
# Supabase
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://supabase.meuspoliticos.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=https://supabase.meuspoliticos.com.br

# ============================================================
# Banco de dados direto (ETL Python e route handlers admin)
# Dev: SSH tunnel → ssh -L 5433:10.0.2.2:5432 root@45.32.169.173
# Produção (Coolify): POSTGRES_HOST=supabase-db-v2ve0851flv0yljb0fy1r9oq
# ============================================================
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=5433
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=meuspoliticos_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=

# ============================================================
# URLs dos subdomínios
# Dev: adicionar ao /etc/hosts: 127.0.0.1 app.localhost painel.localhost
# ============================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://painel.localhost:3000

# ============================================================
# Auth runtime — Supabase legado / Logto em preparação
# PR 1 Logto Bootstrap: manter supabase como default.
# ============================================================
AUTH_PROVIDER=supabase
LOGTO_ENDPOINT=
LOGTO_APP_ID=
LOGTO_APP_SECRET=<logto-app-secret-placeholder>
LOGTO_COOKIE_SECRET=<logto-cookie-secret-placeholder>

# ============================================================
# Pagamentos
# ============================================================
INFINITEPAY_HANDLE=meus-politicos

# ============================================================
# APIs externas
# ============================================================
OPENAI_API_KEY=
IA_RESUMO_MAX_GERACOES_DIA=3
PORTAL_TRANSPARENCIA_API_KEY=

# ============================================================
# E-mail (Resend)
# ============================================================
RESEND_API_KEY=
RESEND_FROM=noreply@meuspoliticos.com.br

# ============================================================
# OAuth
# ============================================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# ============================================================
# Supabase Studio (self-hosted)
# ============================================================
SUPABASE_DASHBOARD_USER=noro_meuspoliticos
SUPABASE_DASHBOARD_PASSWORD=
DASHBOARD_USER=noro_meuspoliticos
DASHBOARD_PASSWORD=

# ============================================================
# MinIO (storage S3-compatible via Supabase)
# ============================================================
MINIO_USER=noro_meuspoliticos
MINIO_PASSWORD=
```

---

## 12. Variáveis mínimas para rodar em dev

Para desenvolvimento local com funcionalidades básicas (sem pagamentos, sem OAuth):

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.meuspoliticos.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_URL=https://supabase.meuspoliticos.com.br
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://painel.localhost:3000
```

---

*Atualizado em: 2026-06-01 · Logto Bootstrap · 35 variáveis documentadas*
