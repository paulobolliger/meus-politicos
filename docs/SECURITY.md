---
file: docs/SECURITY.md
module: Security Reference
status: Active
related: [docs/AUTH.md, docs/DATABASE.md, docs/ENVIRONMENT.md, docs/GAP_ANALYSIS.md]
---

# Segurança — Meus Políticos

> **Nota de legado Auth:** as referencias a RLS com `auth.uid()`,
> atual/legado. A arquitetura alvo aprovada e Logto + PostgreSQL VPS. Ver
> `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

---

## 1. Superfície de ataque — visão geral

| Camada | Mecanismo de proteção | Status |
|---|---|---|
| Banco de dados | Row Level Security (RLS) em todas as tabelas | ✅ Ativo |
| Rotas Next.js | Middleware `proxy.ts` — auth por subdomínio | ✅ Ativo |
| API Routes admin | Verificação `perfis.role = 'admin'` via admin client | ✅ Ativo |
| Webhooks Stripe | Verificação de assinatura `stripe.webhooks.constructEvent` | ✅ Ativo |
| Webhooks InfinitePay | Validação mínima de payload (NSU obrigatório) | ⚠️ Parcial |
| Segredos no git | `.env.local` não commitado — verificado via `git log` | ✅ Confirmado |
| LGPD | CEP não persistido, CPF apenas no ETL | ✅ Ativo |
| Runtime error tracking | ❌ Sem Sentry ou similar | ⚠️ Gap G-14 |

---

## 2. Row Level Security (RLS)

RLS está habilitado em **todas as tabelas** do banco. Nenhuma tabela tem acesso irrestrito.

### Modelo de políticas

| Política | Tabelas afetadas | Regra SQL |
|---|---|---|
| Leitura pública | `municipios`, `partidos`, `temas`, `politicos`, `votacoes`, `gastos`, `presenca`, `emendas`, `discursos`, `candidatos`, `proposicoes`, `estados_*`, `ale_*`, `glossario`, `feed_eventos`, `feature_flags` (leitura), `senadores`, `senado_*` | `FOR SELECT USING (true)` |
| Perfil próprio | `perfis` | `FOR ALL USING (auth.uid() = id)` |
| Acompanhamentos próprios | `acompanhamentos` | `FOR ALL USING (auth.uid() = usuario_id)` |
| INSERT público (correções) | `correcoes` | `FOR INSERT WITH CHECK (true)` |
| Admin (JWT claim) | `coletas_log`, `raw_senado`, `politico_resumos_ia`, `politico_resumos_ia_cotas` | `FOR ALL USING (auth.jwt() ->> 'role' = 'admin')` |
| Admin (tabela perfis) | `admin_logs`, `feature_flags` (write), `analytics_eventos` | `FOR ALL USING (EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin'))` |
| Admin (raw Bronze layer) | `raw_senado` | `FOR ALL USING (auth.jwt() ->> 'role' = 'admin')` |

### Invariante RLS


- `createAdminClient()` em API Routes admin
- Scripts ETL Python (via conexão PostgreSQL direta)

---

## 3. Proteção de rotas — middleware

`app/src/proxy.ts` executa antes de qualquer rota e aplica as seguintes proteções:

```
painel.* sem sessão → 302 /login       (páginas)
painel.* sem sessão → 401 JSON         (API routes /api/*)
app.*    /login     → 302 painel.*     (evita login duplicado)
meuspoliticos.* /login → 302 painel.*  (produção)
```


---

## 4. Proteção de rotas admin

O layout `app/src/app/(admin)/admin/layout.tsx` implementa proteção dupla:

```typescript
// 1. Verificar se há usuário autenticado
if (!user) redirect('/')

// 2. Verificar role admin via admin client (bypassa tipos TypeScript desatualizados)
const adminClient = createAdminClient()
const { data: perfil } = await adminClient
  .from('perfis')
  .select('role, email')
  .eq('id', user.id)
  .single()

if (!perfil || perfil.role !== 'admin') redirect('/')
```

As API Routes admin replicam a mesma verificação:

```typescript
// Padrão em /api/admin/* route handlers
if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

const { data: perfil } = await adminClient.from('perfis').select('role').eq('id', user.id).single()
if (!perfil || perfil.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
```

---

## 5. Segurança de webhooks

### Stripe (`/api/webhooks/stripe`)

Verificação criptográfica da assinatura via SDK oficial:

```typescript
event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
// Lança erro se assinatura inválida → retorna 400
```

`body` é lido como texto raw (`req.text()`) antes da verificação — imprescindível para que a assinatura bata. Qualquer transformação do body antes desta linha invalida a assinatura.

### InfinitePay (`/api/webhooks/infinitepay`)

Validação apenas de campos obrigatórios (`order_nsu`, `transaction_nsu`). **Não há verificação de assinatura ou IP** — risco de replay attack.

**Recomendação:** implementar verificação de IP de origem ou HMAC quando a InfinitePay liberar documentação de segurança de webhook.

---

## 6. Injeção e validação de input

| Área | Proteção |
|---|---|
| Formulários frontend | `react-hook-form` + `zod` — validação client-side e server-side |
| API Routes | Validação manual de campos obrigatórios antes de qualquer operação DB |

Não há nenhum uso de `sql.raw()` ou concatenação de SQL identificado nos route handlers.

---

## 7. Segredos e credenciais

### Status do git (auditado em 2026-05-29)

Nenhum arquivo `.env` ou `.env.local` foi commitado em nenhuma branch ou tag do repositório. Verificado via:

```bash
git log --all --full-history -- '*.env' '*.env.local' '.env*'
# → nenhum resultado
```

### Classificação de segredos presentes em `app/.env.local`

| Credencial | Risco | Notas |
|---|---|---|
| `STRIPE_SECRET_KEY` | 🔴 Crítico | Modo teste ativo — substituir por live na produção |
| `OPENAI_API_KEY` | 🔴 Alto | Custo direto se vazado |
| `RESEND_API_KEY` | 🟡 Médio | Limite de 3k emails/mês — risco de spam |
| `GOOGLE_CLIENT_SECRET` | 🟡 Médio | OAuth — rotacionar se comprometido |
| `PORTAL_TRANSPARENCIA_API_KEY` | 🟡 Médio | API pública com rate limiting |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🟢 Baixo | Projetada para uso público |

### Rotação de credenciais

Se qualquer credencial crítica for comprometida:

2. `STRIPE_SECRET_KEY`: revogar no Stripe Dashboard → Developers → API Keys
3. `POSTGRES_PASSWORD`: alterar no Coolify + atualizar `.env.local` + todos os ambientes
4. `OPENAI_API_KEY`: revogar no OpenAI Platform → API Keys

---

## 8. LGPD — dados pessoais

| Dado | Localização | Proteção |
|---|---|---|
| CEP do usuário | Nunca persistido | Usado server-side para "quem me representa" e descartado |
| CPF | Apenas em memória no ETL | Usado como âncora de entity resolution — nunca inserido em tabela |
| Nome do usuário | `perfis.nome` | RLS: `auth.uid() = id` |
| Dados de pagamento | ❌ Não armazenados | Tokens Stripe/InfinitePay — nunca número de cartão |

**Nota sobre doações:** os webhooks de pagamento recebem `nome` e `email` nos metadados do `PaymentIntent` Stripe (ver `intent.metadata.nome` e `intent.metadata.email`). Atualmente esses dados são apenas logados em console e descartados — o TODO de persistência (Gap G-02/G-03) deve incluir análise de base legal LGPD para armazenamento.

---

## 9. Headers de segurança

O Next.js 16 aplica automaticamente headers de segurança básicos. Não foi identificada configuração customizada em `next.config.ts`.

**Recomendação para produção:** adicionar Content Security Policy (CSP) e HSTS via `headers()` no `next.config.ts` ou via Cloudflare.

---

## 10. Gaps de segurança identificados

| Gap | Severidade | Descrição |
|---|---|---|
| G-02 / G-03 | P0 | Webhooks de pagamento não persistem doações — dados financeiros perdidos |
| G-14 | P2 | Sem monitoramento de erros de runtime (Sentry / Datadog) — erros em produção invisíveis |
| InfinitePay sem HMAC | P2 | Webhook InfinitePay sem verificação de assinatura — risco de replay attack |
| CSP ausente | P3 | Sem Content Security Policy customizada |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
