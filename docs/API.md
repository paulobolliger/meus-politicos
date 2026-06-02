---
file: docs/API.md
module: Internal API Reference
status: Active
related: [docs/AUTH.md, docs/INVENTORY_API_CONSUMPTION.md, docs/DATABASE.md, docs/INTEGRATIONS.md, docs/SECURITY.md]
---

# API

Data da consolidacao: 2026-06-02.

Todos os endpoints abaixo sao Next.js Route Handlers em `app/src/app/api`. Foram identificados **18 handlers HTTP** ativos no codigo.

## Convencoes

| Item | Padrao real |
|---|---|
| Runtime | Next.js App Router route handlers |
| Banco | PostgreSQL via `pg` em handlers que consultam dados |
| Auth usuario | `getCurrentUser()` |
| Auth admin | `getCurrentUser()` + `currentUser.role === 'admin'` |
| Erro comum admin | `401`, `403`, `400`, `500 { error, code? }` |
| Risco | Alguns handlers retornam `pgError.message` e `pgError.code` |

## Indice Dos 18 Endpoints

| # | Endpoint | Metodo | Auth | Status |
|---:|---|---|---|---|
| 1 | `/api/busca` | GET | Publica | Funcional em codigo |
| 2 | `/api/glossario/[slug]` | GET | Publica | Funcional em codigo |
| 3 | `/api/analytics` | POST | Publica/best effort | Funcional parcial |
| 4 | `/api/acompanhamentos` | GET | Opcional | Funcional em codigo |
| 5 | `/api/acompanhamentos` | POST | Usuario | Funcional em codigo |
| 6 | `/api/acompanhamentos/[politicoId]` | DELETE | Usuario | Funcional em codigo |
| 7 | `/api/apoio/criar-link` | POST | Publica | Funcional parcial |
| 8 | `/api/apoio/verificar-pagamento` | POST | Publica | API fantasma/nao consumida |
| 9 | `/api/webhooks/infinitepay` | POST | Webhook externo | Incompleto |
| 10 | `/api/auth/logto/sign-in` | GET | Publica | Redireciona Logto |
| 11 | `/api/auth/logto/sign-up` | GET | Publica | Redireciona Logto |
| 12 | `/api/auth/logto/reset-password` | GET | Publica | Redireciona Logto |
| 13 | `/api/auth/logto/callback` | GET | Logto callback | Funcional em codigo |
| 14 | `/api/auth/logto/sign-out` | GET | Sessao | Funcional em codigo |
| 15 | `/api/admin/flags` | PATCH | Admin | Funcional em codigo |
| 16 | `/api/admin/politicos/[id]` | PATCH | Admin | Funcional em codigo |
| 17 | `/api/admin/emendas/match` | PATCH | Admin | Funcional parcial |
| 18 | `/api/admin/etl/run` | POST | Admin | Incompleto como trigger |

## 1. `GET /api/busca`

Arquivo: `app/src/app/api/busca/route.ts`.

Objetivo: busca paginada de politicos.

Auth: publica.

Query params:

| Param | Tipo | Default | Regra |
|---|---|---|---|
| `q` | string | `''` | `ILIKE` em `nome_eleitoral` ou `nome` |
| `cargo` | string | `''` | Deve estar em `CARGOS_VALIDOS` |
| `uf` | string | `''` | Uppercase |
| `partido` | string | `''` | Uppercase |
| `ordem` | string | `relevancia` | `presenca`, `gastos`, `votacoes` alteram order |
| `pagina` | int | `1` | Minimo 1 |

Resposta 200:

```json
{
  "items": [],
  "total": 0,
  "totalPaginas": 1,
  "pagina": 1,
  "porPagina": 20,
  "elapsedMs": 12,
  "totalIndexados": 0,
  "chips": {
    "cargos": [{ "id": "", "label": "Todos", "total": null }],
    "ufs": ["AC", "AL"],
    "partidos": ["PL", "PT"]
  }
}
```

Banco: `politicos`, `partidos`.

Erros: nao ha `try/catch` externo; erro de banco deve virar erro runtime/500 do Next.

## 2. `GET /api/glossario/[slug]`

Arquivo: `app/src/app/api/glossario/[slug]/route.ts`.

Auth: publica.

Path param:

| Param | Tipo |
|---|---|
| `slug` | string |

Resposta 200:

```json
{
  "slug": "pec",
  "termo": "PEC",
  "definicao_simples": "...",
  "categoria": "legislativo"
}
```

Resposta 404:

```json
{ "error": "not_found" }
```

Cache header: `public, s-maxage=3600, stale-while-revalidate=86400`.

Banco: `glossario`.

## 3. `POST /api/analytics`

Arquivo: `app/src/app/api/analytics/route.ts`.

Auth: publica; associa `usuario_id` se `getCurrentUser()` funcionar.

Body:

```json
{
  "tipo": "perfil_view",
  "payload": { "slug": "exemplo" }
}
```

Validacao:

| Condicao | Resposta |
|---|---|
| `tipo` ausente, nao-string ou >64 chars | `400 { "ok": false }` |
| Erro de auth/banco | Absorvido silenciosamente |
| Sucesso ou erro absorvido | `202 { "ok": true }` |

Banco: `analytics_eventos`.

## 4. `GET /api/acompanhamentos`

Arquivo: `app/src/app/api/acompanhamentos/route.ts`.

Auth: opcional.

Comportamento:

| Condicao | Resposta |
|---|---|
| Sem usuario | `200 { "ids": [] }` |
| Usuario autenticado | `200 { "ids": ["uuid"] }` |
| Erro Postgres | `500 { "error": "...", "code": "...", "ids": [] }` |

Banco: `acompanhamentos`.

## 5. `POST /api/acompanhamentos`

Arquivo: `app/src/app/api/acompanhamentos/route.ts`.

Auth: usuario Logto reconciliado.

Body:

```json
{ "politico_id": "uuid" }
```

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Sem usuario | 401 | `{ "error": "Não autenticado" }` |
| JSON invalido | 400 | `{ "error": "Body inválido" }` |
| `politico_id` ausente | 400 | `{ "error": "politico_id é obrigatório" }` |
| Duplicado `23505` | 200 | `{ "ok": true }` |
| FK invalida `23503` | 400 | `{ "error": "politico_id inválido." }` |
| Erro Postgres | 500 | `{ "error": "...", "code": "..." }` |
| Sucesso | 200 | `{ "ok": true }` |

Banco: `acompanhamentos`.

## 6. `DELETE /api/acompanhamentos/[politicoId]`

Arquivo: `app/src/app/api/acompanhamentos/[politicoId]/route.ts`.

Auth: usuario.

Path param:

| Param | Tipo |
|---|---|
| `politicoId` | string |

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Sem usuario | 401 | `{ "error": "Não autenticado" }` |
| Erro Postgres | 500 | `{ "error": "...", "code": "..." }` |
| Sucesso | 200 | `{ "ok": true }` |

Banco: `acompanhamentos`.

## 7. `POST /api/apoio/criar-link`

Arquivo: `app/src/app/api/apoio/criar-link/route.ts`.

Auth: publica.

Body:

```json
{
  "nome": "Joao Silva",
  "email": "joao@example.com",
  "tipo": "unica",
  "valor": 50
}
```

Regras:

| Campo | Regra |
|---|---|
| `nome` | Obrigatorio |
| `email` | Obrigatorio |
| `valor` | Obrigatorio; valor em reais |
| `tipo` | Usado para descricao e parse de `order_nsu`; esperado `mensal` ou `unica` |
| `INFINITEPAY_HANDLE` | Obrigatorio |

Payload enviado a InfinitePay:

```json
{
  "handle": "meus-politicos",
  "order_nsu": "apoio-unica-...",
  "items": [{ "description": "Apoio Cívico", "quantity": 1, "price": 5000 }],
  "redirect_url": "https://.../apoio/confirmacao",
  "webhook_url": "https://.../api/webhooks/infinitepay",
  "customer": { "name": "...", "email": "..." }
}
```

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Campos ausentes | 400 | `{ "error": "Campos obrigatórios ausentes." }` |
| Handle ausente | 500 | `{ "error": "Configuração de pagamento indisponível." }` |
| InfinitePay erro | 502 | `{ "error": "Falha ao gerar link de pagamento." }` |
| Resposta sem URL | 502 | `{ "error": "URL de pagamento não retornada." }` |
| Erro interno | 500 | `{ "error": "Erro interno do servidor." }` |
| Sucesso | 200 | `{ "url": "...", "order_nsu": "..." }` |

Banco: nenhum. Risco: pedido de pagamento nao e pre-persistido.

## 8. `POST /api/apoio/verificar-pagamento`

Arquivo: `app/src/app/api/apoio/verificar-pagamento/route.ts`.

Auth: publica.

Body:

```json
{
  "order_nsu": "...",
  "transaction_nsu": "...",
  "slug": "..."
}
```

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Parametros ausentes | 400 | `{ "error": "Parâmetros insuficientes." }` |
| InfinitePay erro | 502 | `{ "paid": false, "error": "Não foi possível verificar o pagamento." }` |
| Erro interno | 500 | `{ "paid": false, "error": "Erro interno." }` |
| Sucesso | 200 | Payload direto da InfinitePay |

Consumo UI: nao identificado. Classificacao: API fantasma no frontend atual.

## 9. `POST /api/webhooks/infinitepay`

Arquivo: `app/src/app/api/webhooks/infinitepay/route.ts`.

Auth: externa; nao ha assinatura/HMAC implementada.

Payload esperado:

```json
{
  "invoice_slug": "...",
  "amount": 5000,
  "paid_amount": 5000,
  "capture_method": "pix",
  "transaction_nsu": "...",
  "order_nsu": "apoio-unica-...",
  "receipt_url": "...",
  "items": []
}
```

Validacao real:

| Condicao | Resposta |
|---|---|
| Sem `order_nsu` ou sem `transaction_nsu` | `400 { "ok": false }` |
| Erro no handler | `400 { "ok": false }` |
| Demais casos | `200 { "ok": true }` |

Comportamento real:

- extrai `tipo` de `order_nsu.startsWith('apoio-mensal')`;
- nao grava em banco;
- loga `Pagamento confirmado` no console;
- possui TODO para `doacoes`.

Status: incompleto/P0-P1.

## 10. `GET /api/auth/logto/sign-in`

Auth: publica.

Query:

| Param | Uso |
|---|---|
| `redirectTo` | Caminho relativo pos-login; fallback `/painel` |

Redireciona para Logto com:

| Campo | Valor |
|---|---|
| scopes | `openid`, `profile`, `email` |
| interactionMode | `signIn` |
| redirectUri | `/api/auth/logto/callback` |

Nao retorna JSON.

## 11. `GET /api/auth/logto/sign-up`

Igual a sign-in, mas:

| Campo | Valor |
|---|---|
| `interactionMode` | `signUp` |
| fallback `redirectTo` | `/meus-politicos` |

## 12. `GET /api/auth/logto/reset-password`

Query:

| Param | Uso |
|---|---|
| `email` | `loginHint` opcional |

Config:

| Campo | Valor |
|---|---|
| `firstScreen` | `reset_password` |
| `identifiers` | `['email']` |
| `postRedirectUri` | `/login` |

## 13. `GET /api/auth/logto/callback`

Executa `handleSignIn(config, callbackUrl)` e redireciona.

Redirecionamento:

| Host | Base |
|---|---|
| `localhost:3000`, `127.0.0.1:3000`, `painel.localhost*`, `app.localhost*` | `request.url` |
| Producao/outros | `NEXT_PUBLIC_PAINEL_URL` |

## 14. `GET /api/auth/logto/sign-out`

Chama `signOut(getLogtoConfig(), '/')`.

Nao retorna JSON.

## 15. `PATCH /api/admin/flags`

Auth: admin.

Body:

```json
{
  "id": "uuid",
  "slug": "candidatos_2026",
  "ativo": true,
  "rollout_pct": 100
}
```

Regras:

| Campo | Regra |
|---|---|
| `id` ou `slug` | Um dos dois obrigatorio |
| `ativo` | Atualiza se boolean |
| `rollout_pct` | Atualiza se number |

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Sem usuario | 401 | `{ "error": "Não autorizado" }` |
| Nao admin | 403 | `{ "error": "Acesso negado" }` |
| Sem id/slug | 400 | `{ "error": "id ou slug obrigatório" }` |
| Erro Postgres | 500 | `{ "error": "...", "code": "..." }` |
| Sucesso | 200 | `{ "ok": true }` |

Banco: `feature_flags`, `admin_logs`.

## 16. `PATCH /api/admin/politicos/[id]`

Auth: admin.

Campos permitidos:

| Campo |
|---|
| `foto_url` |
| `nome_eleitoral` |
| `codigo_siafi` |
| `email` |

Body: qualquer subconjunto dos campos permitidos.

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Sem usuario | 401 | `{ "error": "Não autorizado" }` |
| Nao admin | 403 | `{ "error": "Acesso negado" }` |
| Nenhum campo valido | 400 | `{ "error": "Nenhum campo válido" }` |
| Erro Postgres | 500 | `{ "error": "...", "code": "..." }` |
| Sucesso | 200 | `{ "ok": true }` |

Banco: `politicos`, `admin_logs`.

## 17. `PATCH /api/admin/emendas/match`

Auth: admin.

Body:

```json
{
  "nome_parlamentar": "NOME",
  "politico_id": "uuid"
}
```

Comportamento:

1. Busca `politicos.id/codigo_siafi` por `politico_id`.
2. Atualiza `emendas` onde `politico_id IS NULL` e `nome_parlamentar ILIKE $nome`.
3. Insere log em `admin_logs`.

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Sem usuario | 401 | `{ "error": "Não autorizado" }` |
| Nao admin | 403 | `{ "error": "Acesso negado" }` |
| Body incompleto | 400 | `{ "error": "nome_parlamentar e politico_id são obrigatórios" }` |
| Erro Postgres | 500 | `{ "error": "...", "code": "..." }` |
| Sucesso | 200 | `{ "ok": true, "emendas_atualizadas": 0 }` |

Banco: `politicos`, `emendas`, `admin_logs`.

## 18. `POST /api/admin/etl/run`

Auth: admin.

Body:

```json
{ "fonte": "camara_deputados" }
```

Comportamento real:

- insere log em `admin_logs`;
- nao executa script Python;
- retorna mensagem de trigger manual via SSH.

Respostas:

| Condicao | Status | Payload |
|---|---:|---|
| Sem usuario | 401 | `{ "error": "Não autorizado" }` |
| Nao admin | 403 | `{ "error": "Acesso negado" }` |
| `fonte` ausente | 400 | `{ "error": "Parâmetro fonte obrigatório" }` |
| Sucesso | 200 | `{ "message": "Ação registrada para ETL \"...\". Trigger manual via SSH em breve." }` |

Banco: `admin_logs`.

Status: incompleto como acionador operacional.

