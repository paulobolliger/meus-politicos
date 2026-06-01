---
file: docs/API.md
module: Internal API Reference
status: Active
related: [docs/ARCHITECTURE.md, docs/AUTH.md, docs/INTEGRATIONS.md, docs/SECURITY.md]
---

# API Routes — Referência Interna

Todos os endpoints são implementados como Next.js Route Handlers em `app/src/app/api/`.

---

## Convenções

| Aspecto | Padrão |
|---|---|
| Autenticação | `supabase.auth.getUser()` — verificado antes de qualquer operação |
| Admin | Verificação de `perfis.role = 'admin'` via `createAdminClient()` |
| Erros | `NextResponse.json({ error: '...' }, { status: N })` |
| Sucesso | `NextResponse.json({ ok: true })` ou payload específico |
| Analytics | Não bloqueia — `POST /api/analytics` retorna 202 sempre |

---

## 1. Busca de políticos

### `GET /api/busca`

Busca paginada de políticos com filtros. Pública.

**Query params:**

| Param | Tipo | Default | Descrição |
|---|---|---|---|
| `q` | string | — | Busca por `nome_eleitoral` ou `nome` (ILIKE) |
| `cargo` | string | — | Filtro por cargo — deve ser um `cargo_tipo` válido |
| `uf` | string | — | Filtro por UF — sigla 2 letras |
| `partido` | string | — | Filtro por sigla do partido |
| `ordem` | `'relevancia' \| 'presenca' \| 'gastos' \| 'votacoes'` | `'relevancia'` | Ordenação |
| `pagina` | integer | 1 | Página — 20 itens por página |

**Resposta 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "nikolas-ferreira-dep-federal-mg",
      "nome": "NIKOLAS FERREIRA",
      "nome_eleitoral": "NIKOLAS",
      "foto_url": "https://...",
      "cargo": "deputado_federal",
      "uf": "MG",
      "presenca_pct_atual": 92.3,
      "gasto_total_ano": 145000.50,
      "total_votacoes": 312,
      "mandato_inicio": "2023-02-01",
      "partidos": { "sigla": "PL" }
    }
  ],
  "total": 1680,
  "totalPaginas": 84,
  "pagina": 1,
  "porPagina": 20,
  "elapsedMs": 45,
  "totalIndexados": 1680,
  "chips": {
    "cargos": [{ "id": "", "label": "Todos" }, ...],
    "ufs": ["AC", "AL", ...],
    "partidos": ["PL", "PT", ...]
  }
}
```

**Implementação:** usa Supabase client por padrão. Quando filtro de partido está ativo **ou** quando o Supabase retorna `42501` (RLS bloqueou), faz fallback para query direta via `pg.Pool` usando `POSTGRES_*` vars. O pool é singleton (max 3 conexões, idle 30s).

---

## 2. Acompanhamentos

### `GET /api/acompanhamentos`

Lista os IDs de políticos seguidos pelo usuário autenticado.

**Auth:** obrigatória. Retorna `{ ids: [] }` (sem erro) se não autenticado.

**Resposta 200:**
```json
{ "ids": ["uuid1", "uuid2"] }
```

---

### `POST /api/acompanhamentos`

Seguir um político.

**Auth:** obrigatória. Retorna 401 se não autenticado.

**Body:**
```json
{ "politico_id": "uuid" }
```

**Resposta 200:** `{ "ok": true }`

**Nota:** conflito de unique key (já seguia) é silenciado — retorna `{ ok: true }` sem erro.

---

### `DELETE /api/acompanhamentos/[politicoId]`

Deixar de seguir um político.

**Auth:** obrigatória.

**Resposta 200:** `{ "ok": true }`

---

## 3. Glossário

### `GET /api/glossario/[slug]`

Retorna um termo do glossário pelo slug.

**Auth:** pública.

**Resposta 200:** objeto com campos do glossário (`slug`, `termo`, `definicao_simples`, `definicao_tecnica`, `categoria`, `exemplo`, `termos_relacionados`).

---

## 4. Analytics

### `POST /api/analytics`

Registra evento de uso. Sem PII — sem e-mail, sem IP armazenado. Retorna 202 sempre (best-effort, nunca bloqueia o cliente).

**Auth:** pública. Associa ao `usuario_id` se autenticado.

**Body:**
```json
{
  "tipo": "perfil_view",
  "payload": { "slug": "nikolas-ferreira-dep-federal-mg", "cargo": "deputado_federal", "uf": "MG" }
}
```

**Tipos documentados:**

| Tipo | Payload |
|---|---|
| `busca` | `{ q, cargo, uf, partido }` |
| `perfil_view` | `{ slug, cargo, uf }` |
| `emenda_view` | `{ slug }` |
| `glossario_view` | `{ slug }` |
| `comparar` | `{ slugs: string[] }` |

**Resposta 202:** `{ "ok": true }`

---

## 5. Pagamentos — Apoio (doações)

### `POST /api/apoio/criar-intent`

Rota histórica do Stripe. Foi removida do runtime e mantida apenas para auditoria documental.

**Auth:** pública.

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "tipo": "mensal",
  "valor": 15.00
}
```

**Validação:** `valor` mínimo de R$5. `tipo`: `'mensal'` | `'unica'`.

**Resposta 200:**
```json
{ "clientSecret": "pi_xxx_secret_yyy" }
```

**Implementação histórica:** criava ou recuperava o customer Stripe pelo e-mail antes de criar o PaymentIntent. Essa integração não está mais ativa.

---

### `POST /api/apoio/criar-link`

Cria um link de pagamento InfinitePay (fluxo ativo).

**Auth:** pública.

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "tipo": "unica",
  "valor": 10.00
}
```

**Resposta 200:**
```json
{ "url": "https://checkout.infinitepay.io/...", "order_nsu": "apoio-unica-1716987654321-a1b2c3d4" }
```

**Implementação:** chama `https://api.checkout.infinitepay.io/links`. Gera `order_nsu` com formato `apoio-{tipo}-{timestamp}-{uuid8}` para identificar o tipo de doação no webhook.

---

### `POST /api/apoio/verificar-pagamento`

Verifica o status de um pagamento InfinitePay após redirect da confirmação.

**Auth:** pública.

**Body:**
```json
{ "order_nsu": "...", "transaction_nsu": "...", "slug": "..." }
```

**Resposta 200:** payload direto da InfinitePay — inclui `paid`, `amount`, `paid_amount`, `capture_method`.

---

## 6. Webhooks

### `POST /api/webhooks/stripe`

Rota histórica do Stripe. Removida do runtime.

**Auth:** assinatura Stripe (histórico) — sem auth de usuário.

**Eventos tratados:**
- `payment_intent.succeeded` → loga confirmação (**⚠️ TODO G-02:** persistir em `doacoes`)
- `payment_intent.payment_failed` → loga falha

**Resposta 200:** `{ "received": true }`
**Resposta 400:** assinatura inválida.

---

### `POST /api/webhooks/infinitepay`

Recebe eventos InfinitePay. **Sem verificação de assinatura** (Gap de segurança P2).

**Auth:** validação mínima de `order_nsu` e `transaction_nsu` no payload.

**Resposta 200:** `{ "ok": true }` — InfinitePay não retenta se receber 200.
**Resposta 400:** payload inválido — InfinitePay **retenta** a entrega.

**⚠️ TODO G-03:** persistir doação em `doacoes`.

---

## 7. Admin — endpoints protegidos

Todos exigem `perfis.role = 'admin'`. Retornam 401 sem auth, 403 sem role admin.

### `POST /api/admin/etl/run`

Registra solicitação de disparo de ETL em `admin_logs`. **Não dispara ETL real** — instrui execução manual via SSH.

**Body:** `{ "fonte": "camara_deputados" }`

**Resposta 200:**
```json
{ "message": "Ação registrada para ETL \"camara_deputados\". Trigger manual via SSH em breve." }
```

---

### `PATCH /api/admin/flags`

Atualiza uma feature flag.

**Body:**
```json
{ "slug": "candidatos_2026", "ativo": true, "rollout_pct": 100 }
```

Aceita `id` ou `slug` como identificador. Campos atualizáveis: `ativo`, `rollout_pct`.

**Resposta 200:** `{ "ok": true }` + INSERT em `admin_logs`.

---

### `PATCH /api/admin/politicos/[id]`

Edita campos específicos de um político.

**Campos permitidos:** `foto_url`, `nome_eleitoral`, `codigo_siafi`, `email`.

**Body:** qualquer subconjunto dos campos permitidos.

**Resposta 200:** `{ "ok": true }` + INSERT em `admin_logs`.

---

### `POST /api/admin/emendas/match`

Match manual de emendas com políticos (via `codigo_siafi`). Detalhes de implementação a verificar em `app/src/app/api/admin/emendas/match/route.ts`.

---

## 8. Auth

### `GET /auth/callback`

Callback OAuth do Supabase. Troca `code` por sessão e redireciona para `/painel`.

**Implementado em:** `app/src/app/(auth)/auth/callback/route.ts`

Ver `docs/AUTH.md §5` para fluxo completo.

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
