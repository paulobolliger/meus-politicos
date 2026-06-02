---
file: docs/ENVIRONMENT.md
module: Environment Variables
status: Active
related: [.env.example, docs/AUTH.md, docs/API.md, docs/INTEGRATIONS.md, docs/SECURITY.md, docs/PRODUCAO_READINESS.md]
---

# Variaveis de Ambiente

Este documento consolida as variaveis de ambiente identificadas no codigo, `.env.example`, documentacao e scripts ETL. A leitura nao executou conexao ativa com banco remoto; por regra de pre-flight, o host em `app/.env.local` foi tratado como ambiente remoto/dev desconhecido e nao foi acessado.

## 1. Hierarquia de Resolucao

| Camada | Fonte | Quem consome | Observacao |
|---|---|---|---|
| Local template | `.env.example` | Desenvolvedores | Define nomes e placeholders, nao deve conter segredo real |
| Local efetivo | `app/.env.local` | Next.js app | Nao deve ser versionado; usado por `npm run dev/build` no workspace `app` |
| Ambiente de deploy | Vercel/Coolify/provider | Runtime Next.js | Deve replicar variaveis server-side e `NEXT_PUBLIC_*` por ambiente |
| ETL local/remoto | Shell, `.env`, agendador ou servidor | Scripts Python em `etl/` | Usa `POSTGRES_*` e, em varios scripts, fallback `SUPABASE_DB_*` |
| Logto console | Tenant Logto | Redirect/callback OAuth | Precisa alinhar URLs com `LOGTO_BASE_URL` e rotas `/api/auth/logto/*` |

## 2. Regra Server vs Client

| Prefixo | Visibilidade | Regra operacional |
|---|---|---|
| `NEXT_PUBLIC_*` | Pode ir para bundle client | Usar apenas para URLs publicas sem segredo |
| Sem prefixo | Server-side | Nunca acessar em Client Components, exceto indiretamente via API/Server Component |
| `POSTGRES_*` | Server-side/ETL | Credencial de banco; nao pode aparecer no client |
| `LOGTO_APP_SECRET`, `LOGTO_COOKIE_SECRET` | Server-side | Segredos de autenticacao; nunca client |
| `OPENAI_API_KEY` | Server-side/ETL | Custo financeiro; nunca client |
| `RESEND_API_KEY` | Server-side | Segredo de email; atualmente ha vazamento em doc legado |

## 3. Tabela Comparativa

| Variavel | Obrigatoria | Ambiente | Consumidores reais | Default/fallback no codigo | Risco se ausente | Risco se exposta |
|---|---|---|---|---|---|---|
| `POSTGRES_HOST` | Sim para runtime com dados | Server/ETL | Paginas server-side, APIs, auth profile linking, ETL | Muitos arquivos usam `localhost` | Paginas/APIs falham ou apontam para banco local inexistente | Alto: revela infraestrutura |
| `POSTGRES_PORT` | Sim | Server/ETL | Mesmo grupo acima | `5432` ou `5433` dependendo do arquivo | Conexao no host errado | Medio |
| `POSTGRES_DB` | Sim | Server/ETL | Mesmo grupo acima | `meuspoliticos_db` ou `postgres` em ETL fallback | Banco errado ou inexistente | Medio |
| `POSTGRES_USER` | Sim | Server/ETL | Mesmo grupo acima | `postgres` | Uso de usuario privilegiado por default | Alto |
| `POSTGRES_PASSWORD` | Sim em ambiente real | Server/ETL | Mesmo grupo acima | Vazio em alguns scripts/templates | Falha de conexao | Critico |
| `SUPABASE_DB_HOST` | Condicional | ETL | Varios scripts Python | Fallback para `POSTGRES_HOST` inverso nos scripts | ETL pode falhar se `POSTGRES_*` ausente | Alto |
| `SUPABASE_DB_PORT` | Condicional | ETL | Varios scripts Python | `5432` | ETL aponta porta errada | Medio |
| `SUPABASE_DB_USER` | Condicional | ETL | Varios scripts Python | `postgres` | ETL sem credencial | Alto |
| `SUPABASE_DB_PASSWORD` | Condicional | ETL | Varios scripts Python | Sem valor seguro | ETL falha | Critico |
| `SUPABASE_DB_NAME` | Condicional | ETL | Varios scripts Python | `postgres` | ETL escreve/le banco errado | Medio |
| `NEXT_PUBLIC_SITE_URL` | Sim para producao | Client-safe/server | Site principal, InfinitePay `redirect_url`/`webhook_url`, Logto fallback | `https://meuspoliticos.com.br` em pagamento | Links e callbacks errados | Baixo se URL publica |
| `NEXT_PUBLIC_APP_URL` | Sim para multi-host | Client-safe/server | Logto baseUrl fallback | Fallback para `NEXT_PUBLIC_SITE_URL` ou localhost | Auth base incorreta | Baixo |
| `NEXT_PUBLIC_PAINEL_URL` | Sim para auth/painel | Client-safe/server | `proxy.ts`, callback Logto, `BotaoAcompanhar` | `https://painel.meuspoliticos.com.br` | Redirects quebrados | Baixo |
| `LOGTO_BASE_URL` | Recomendado | Server | `getLogtoConfig()` | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, localhost | Callback/base URL inconsistentes | Baixo/medio |
| `LOGTO_ENDPOINT` | Sim | Server | `app/src/lib/logto/config.ts` | Nenhum; erro obrigatorio | Auth indisponivel | Medio |
| `LOGTO_APP_ID` | Sim | Server | `app/src/lib/logto/config.ts` | Nenhum; erro obrigatorio | Auth indisponivel | Medio |
| `LOGTO_APP_SECRET` | Sim | Server | `app/src/lib/logto/config.ts` | Nenhum; erro obrigatorio | Auth indisponivel | Critico |
| `LOGTO_COOKIE_SECRET` | Sim | Server | `app/src/lib/logto/config.ts` | Nenhum; erro obrigatorio | Sessao indisponivel | Critico |
| `INFINITEPAY_HANDLE` | Sim para apoio | Server | `/api/apoio/criar-link`, `/api/apoio/verificar-pagamento` | Vazio; `criar-link` retorna 500 | Checkout indisponivel | Baixo/medio |
| `OPENAI_API_KEY` | Sim para IA | Server/ETL | `resumo-interpretativo.ts`, `etl/ia/simplificar_proposicoes.py` | Se ausente, retorna erro/nao gera | IA indisponivel | Critico |
| `IA_RESUMO_MAX_GERACOES_DIA` | Opcional | Server | `resumo-interpretativo.ts` | Limite interno padrao no codigo | Limite de custo inadequado | Baixo |
| `PORTAL_TRANSPARENCIA_API_KEY` | Condicional | ETL | `etl/portal_transparencia/collect_emendas.py` | String vazia | Coleta CGU pode falhar/limitar | Alto se chave real |
| `RESEND_API_KEY` | Nao consumida no runtime mapeado, mas documentada | Server | `.env.example`, docs legados | Vazio | Email transacional indisponivel se feature voltar | Critico |
| `RESEND_FROM` | Condicional | Server | `.env.example`, docs legados | `noreply@meuspoliticos.com.br` em docs | Remetente ausente | Baixo |
| `NODE_ENV` | Sim pelo runtime | Server/client build | `LOGTO_COOKIE_SECURE`, `error.tsx` | Definido pelo runtime | Cookies inseguros se ambiente errado | Baixo |

## 4. Variaveis por Servico

### 4.1 PostgreSQL / Supabase

| Variavel | Fonte esperada | Arquivos consumidores |
|---|---|---|
| `POSTGRES_HOST` | `.env.local`, deploy, shell ETL | Rotas e paginas com `new Pool()`, `profile-linking.ts`, `resumo-interpretativo.ts`, scripts `etl/**` |
| `POSTGRES_PORT` | `.env.local`, deploy, shell ETL | Mesmo grupo |
| `POSTGRES_DB` | `.env.local`, deploy, shell ETL | Mesmo grupo |
| `POSTGRES_USER` | `.env.local`, deploy, shell ETL | Mesmo grupo |
| `POSTGRES_PASSWORD` | Secret manager | Mesmo grupo |
| `SUPABASE_DB_*` | Legacy/fallback ETL | `etl/camara`, `etl/senado`, `etl/tse`, `etl/ibge`, `etl/ale`, `etl/portal_transparencia` |

Observacao: o runtime web nao usa `DATABASE_URL`, Prisma nem Drizzle no mapeamento atual. A conexao e feita por objeto `Pool` com campos separados.

### 4.2 Logto

| Variavel | Consumidor | Comportamento |
|---|---|---|
| `LOGTO_ENDPOINT` | `app/src/lib/logto/config.ts` | Obrigatoria; erro se ausente |
| `LOGTO_APP_ID` | `app/src/lib/logto/config.ts` | Obrigatoria; erro se ausente |
| `LOGTO_APP_SECRET` | `app/src/lib/logto/config.ts` | Obrigatoria; segredo server-side |
| `LOGTO_COOKIE_SECRET` | `app/src/lib/logto/config.ts` | Obrigatoria; segredo de cookie |
| `LOGTO_BASE_URL` | `app/src/lib/logto/config.ts` | Preferida para `baseUrl` |
| `NEXT_PUBLIC_APP_URL` | `app/src/lib/logto/config.ts` | Fallback de `baseUrl` |
| `NEXT_PUBLIC_SITE_URL` | `app/src/lib/logto/config.ts` | Segundo fallback de `baseUrl` |

Hierarquia real do `baseUrl`:

```text
LOGTO_BASE_URL
-> NEXT_PUBLIC_APP_URL
-> NEXT_PUBLIC_SITE_URL
-> http://localhost:3000
```

### 4.3 InfinitePay

| Variavel | Consumidor | Comportamento |
|---|---|---|
| `INFINITEPAY_HANDLE` | `/api/apoio/criar-link` | Obrigatoria para criar link; se ausente retorna 500 |
| `INFINITEPAY_HANDLE` | `/api/apoio/verificar-pagamento` | Enviada para endpoint de verificacao |
| `NEXT_PUBLIC_SITE_URL` | `/api/apoio/criar-link` | Monta `redirect_url` e `webhook_url` |

Nao foi identificada variavel de assinatura/HMAC para validar webhook InfinitePay. Isso e gap de seguranca e integridade.

### 4.4 OpenAI

| Variavel | Consumidor | Comportamento |
|---|---|---|
| `OPENAI_API_KEY` | `app/src/actions/resumo-interpretativo.ts` | Instancia `new OpenAI({ apiKey })` para resumo interpretativo |
| `OPENAI_API_KEY` | `etl/ia/simplificar_proposicoes.py` | Instancia client Python para simplificacao de proposicoes |
| `IA_RESUMO_MAX_GERACOES_DIA` | `app/src/actions/resumo-interpretativo.ts` | Controla limite diario de geracoes |

## 5. Auditoria de Vazamento para Client

### 5.1 Variaveis `NEXT_PUBLIC_*` Encontradas

| Variavel | Arquivos | Exposicao esperada? | Avaliacao |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `app/src/lib/logto/config.ts`, `/api/apoio/criar-link` | Sim | URL publica; aceitavel |
| `NEXT_PUBLIC_APP_URL` | `app/src/lib/logto/config.ts` | Sim | URL publica; aceitavel |
| `NEXT_PUBLIC_PAINEL_URL` | `app/src/proxy.ts`, callback Logto, `BotaoAcompanhar.tsx` | Sim | URL publica; aceitavel |

Nao foi identificado uso de `NEXT_PUBLIC_POSTGRES_*`, `NEXT_PUBLIC_LOGTO_APP_SECRET`, `NEXT_PUBLIC_OPENAI_API_KEY`, `NEXT_PUBLIC_RESEND_API_KEY` ou equivalente no codigo mapeado.

### 5.2 Segredos Server-side Encontrados no Codigo

| Segredo | Client exposure no codigo atual | Observacao |
|---|---|---|
| `POSTGRES_PASSWORD` | Nao identificado | Consumido em Server Components, APIs e ETL |
| `LOGTO_APP_SECRET` | Nao identificado | Consumido em config server-side |
| `LOGTO_COOKIE_SECRET` | Nao identificado | Consumido em config server-side |
| `OPENAI_API_KEY` | Nao identificado | Consumido em Server Action e ETL |
| `RESEND_API_KEY` | Nao identificado no runtime | Exposto em doc legado; ver abaixo |

### 5.3 Vazamento Documental Critico

Foi detectado valor aparente de `RESEND_API_KEY` em `docs/meuspoliticos_master.md:229` e `docs/meuspoliticos_master.md:264`. O valor nao deve ser reproduzido em novos documentos, logs ou respostas. Acao recomendada:

1. Revogar a chave no provedor.
2. Substituir o conteudo do documento por placeholder.
3. Auditar historico Git se o repositorio ja foi publicado.
4. Revisar outros canais de distribuicao do arquivo.

## 6. Inconsistencias de Ambiente

| Inconsistencia | Onde aparece | Impacto |
|---|---|---|
| Portas default divergentes `5432` e `5433` | Runtime web e ETL | Ambientes locais podem apontar para bancos diferentes |
| ETL aceita `SUPABASE_DB_*`, runtime web usa `POSTGRES_*` | `etl/**` vs `app/src/**` | Configuracao duplicada e risco de drift |
| `RESEND_*` documentado, mas sem consumidor runtime mapeado | `.env.example`, docs | Feature de email nao confirmada |
| Stripe ainda aparece em docs legados | `docs/SECURITY.md`, docs historicos | Confusao operacional; runtime atual usa InfinitePay |
| `INFINITEPAY_HANDLE` sem secret de webhook | APIs InfinitePay | Webhook sem verificacao criptografica |

## 7. Template Seguro para Desenvolvimento

```dotenv
# PostgreSQL local/dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=meuspoliticos_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=

# URLs publicas
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://painel.localhost:3000

# Logto
LOGTO_BASE_URL=http://app.localhost:3000
LOGTO_ENDPOINT=
LOGTO_APP_ID=
LOGTO_APP_SECRET=<logto-app-secret-placeholder>
LOGTO_COOKIE_SECRET=<min-32-chars-placeholder>

# Pagamentos
INFINITEPAY_HANDLE=meus-politicos

# IA
OPENAI_API_KEY=
IA_RESUMO_MAX_GERACOES_DIA=5

# ETL opcional/legado
SUPABASE_DB_HOST=
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=
SUPABASE_DB_PASSWORD=
SUPABASE_DB_NAME=
PORTAL_TRANSPARENCIA_API_KEY=

# Email, se a feature for reativada
RESEND_API_KEY=
RESEND_FROM=noreply@meuspoliticos.com.br
```

## 8. Checklist de Producao

| Item | Status esperado antes de producao |
|---|---|
| `POSTGRES_*` configurado com usuario de menor privilegio | Obrigatorio |
| `LOGTO_*` configurado com redirect URIs corretas | Obrigatorio |
| `NEXT_PUBLIC_*` alinhado aos dominios reais | Obrigatorio |
| `OPENAI_API_KEY` em secret manager | Obrigatorio para IA |
| `INFINITEPAY_HANDLE` configurado | Obrigatorio para apoio |
| Assinatura/validacao de webhook InfinitePay definida | Pendente |
| Chave Resend vazada revogada e removida do doc legado | Pendente critico |
| Defaults `5432`/`5433` normalizados | Pendente |
| `SUPABASE_DB_*` vs `POSTGRES_*` unificado para ETL | Pendente |
