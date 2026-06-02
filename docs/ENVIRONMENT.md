---
file: docs/ENVIRONMENT.md
module: Environment Variables Reference
status: Active
related: [README.md, docs/AUTH.md, docs/DEPLOYMENT.md, .env.example]
---

# Variáveis de Ambiente

> Use apenas placeholders neste documento. Os valores reais ficam em `app/.env.local`.

## 1. Banco de Dados

Conexão direta via `pg` para o runtime e scripts Node.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `POSTGRES_HOST` | Sim | Host do banco PostgreSQL |
| `POSTGRES_PORT` | Sim | Porta do PostgreSQL |
| `POSTGRES_DB` | Sim | Nome do banco |
| `POSTGRES_USER` | Sim | Usuário do banco |
| `POSTGRES_PASSWORD` | Sim | Senha do banco |

## 2. URLs da aplicação

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sim | URL pública do site |
| `NEXT_PUBLIC_APP_URL` | Sim | URL do app público |
| `NEXT_PUBLIC_PAINEL_URL` | Sim | URL do painel/admin |

## 3. Logto

| Variável | Obrigatória | Descrição |
|---|---|---|
| `LOGTO_BASE_URL` | Sim | Base URL da aplicação usada pelo SDK |
| `LOGTO_ENDPOINT` | Sim | Endpoint do tenant Logto |
| `LOGTO_APP_ID` | Sim | App ID da aplicação Logto |
| `LOGTO_APP_SECRET` | Sim | Secret da aplicação Logto |
| `LOGTO_COOKIE_SECRET` | Sim | Secret de cookies do Logto. Use no mínimo 32 caracteres |

Redirect URI no console do Logto:

```txt
https://app.meuspoliticos.com.br/api/auth/logto/callback
```

Post sign-out redirect URI:

```txt
https://app.meuspoliticos.com.br
```

## 4. Pagamentos

| Variável | Obrigatória | Descrição |
|---|---|---|
| `INFINITEPAY_HANDLE` | Sim | Handle do comerciante InfinitePay |

## 5. APIs externas

| Variável | Obrigatória | Descrição |
|---|---|---|
| `OPENAI_API_KEY` | Sim | Chave da OpenAI |
| `IA_RESUMO_MAX_GERACOES_DIA` | Não | Limite diário de resumos por político |
| `PORTAL_TRANSPARENCIA_API_KEY` | Não | Chave da API do Portal da Transparência |

## 6. E-mail transacional

| Variável | Obrigatória | Descrição |
|---|---|---|
| `RESEND_API_KEY` | Sim | Chave da Resend |
| `RESEND_FROM` | Sim | Endereço remetente |

## 7. Template mínimo para desenvolvimento

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=meuspoliticos_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://painel.localhost:3000

LOGTO_BASE_URL=http://app.localhost:3000
LOGTO_ENDPOINT=
LOGTO_APP_ID=
LOGTO_APP_SECRET=
LOGTO_COOKIE_SECRET=<32-chars-min>

INFINITEPAY_HANDLE=meus-politicos
OPENAI_API_KEY=
IA_RESUMO_MAX_GERACOES_DIA=3
PORTAL_TRANSPARENCIA_API_KEY=
RESEND_API_KEY=
RESEND_FROM=noreply@meuspoliticos.com.br
```

Atualizado em: 2026-06-02
