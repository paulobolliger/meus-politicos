---
file: docs/INTEGRATIONS.md
module: Third-Party Integrations
status: Active
related: [docs/API.md, docs/ENVIRONMENT.md, docs/SECURITY.md, docs/DATABASE.md]
---

# Integrações com Terceiros

> **Nota de legado Auth:** a secao Supabase descreve o estado atual/legado.
> Supabase Auth sera substituido por Logto como provedor de identidade. Ver
> `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

---

## 1. Supabase (self-hosted)

**Papel:** banco de dados, autenticação, storage (MinIO), PostgREST API.

| Aspecto | Detalhe |
|---|---|
| URL | `https://supabase.meuspoliticos.com.br` |
| Tipo | Self-hosted no VPS Vultr via Coolify |
| SDK | `@supabase/supabase-js` ^2.105.4 + `@supabase/ssr` ^0.10.3 |
| Banco | PostgreSQL 15 — `meuspoliticos_db` |
| Auth | Supabase Auth — JWT, OAuth, e-mail+senha |
| Storage | MinIO (S3-compatible) — logos, fotos |

**Três contextos de cliente:**

| Contexto | Arquivo | Chave usada |
|---|---|---|
| Browser / Client Component | `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Server / API Route | `lib/supabase/server.ts` → `createClient()` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Admin (bypassa RLS) | `lib/supabase/server.ts` → `createAdminClient()` | `SUPABASE_SERVICE_ROLE_KEY` |

---

## 2. Stripe

**Papel:** processamento de doações via cartão de crédito e PIX.

| Aspecto | Detalhe |
|---|---|
| SDK | `stripe` ^22.1.1 (server) + `@stripe/stripe-js` ^9.6.0 + `@stripe/react-stripe-js` ^6.4.0 (client) |
| API version | `2026-04-22.dahlia` |
| Modo atual | **Teste** — `sk_test_*` / `pk_test_*` |
| Endpoint webhook | `POST /api/webhooks/stripe` |
| Verificação webhook | `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` |

**Fluxo de pagamento:**

```
1. Cliente POST /api/apoio/criar-intent { nome, email, tipo, valor }
2. Backend cria/recupera Customer pelo e-mail
3. Backend cria PaymentIntent (BRL, automatic_payment_methods)
4. Backend retorna clientSecret
5. Frontend confirma pagamento via Stripe Elements
6. Stripe chama POST /api/webhooks/stripe com payment_intent.succeeded
7. ⚠️ TODO (G-02): persistir em tabela doacoes
```

**Metadata do PaymentIntent:** `{ tipo, nome, email, site }` — usada no webhook para identificar a doação.

**Para ativar produção:** substituir chaves `test_` por `live_` + configurar webhook endpoint no Stripe Dashboard.

---

## 3. InfinitePay

**Papel:** alternativa ao Stripe para doações via link de pagamento (PIX, boleto, cartão).

| Aspecto | Detalhe |
|---|---|
| Tipo de integração | REST API + Webhook (sem SDK oficial) |
| API criar link | `POST https://api.checkout.infinitepay.io/links` |
| API verificar | `POST https://api.checkout.infinitepay.io/payment_check` |
| Handle | `meus-politicos` (var `INFINITEPAY_HANDLE`) |
| Endpoint webhook | `POST /api/webhooks/infinitepay` |
| Verificação webhook | ⚠️ Apenas validação de campos obrigatórios — sem HMAC |

**Fluxo:**

```
1. Cliente POST /api/apoio/criar-link { nome, email, tipo, valor }
2. Backend chama InfinitePay API → obtém checkout URL
3. Backend retorna { url, order_nsu }
4. Frontend redireciona para URL InfinitePay
5. Usuário paga → InfinitePay redireciona para /apoio/confirmacao
6. Frontend chama POST /api/apoio/verificar-pagamento para confirmar
7. InfinitePay chama POST /api/webhooks/infinitepay
8. ⚠️ TODO (G-03): persistir em tabela doacoes
```

**`order_nsu`:** gerado no backend com formato `apoio-{tipo}-{timestamp}-{uuid8}`. Usado para identificar o tipo de doação no webhook (`startsWith('apoio-mensal')` → `'mensal'`).

---

## 4. OpenAI

**Papel:** tradução de juridiquês para linguagem acessível, resumos de propostas de governo e resumos interpretativos de políticos.

| Aspecto | Detalhe |
|---|---|
| SDK | `openai` ^6.37.0 |
| Chave | `OPENAI_API_KEY` (server-side only) |
| Limite diário | `IA_RESUMO_MAX_GERACOES_DIA` (default 3) por político |

**Casos de uso:**

| Caso | Campo preenchido | Controle |
|---|---|---|
| Ementa de votação simplificada | `votacoes.descricao_simples` | `ia_processado`, `ia_gerado_em`, `ia_modelo` |
| Ementa de proposição simplificada | `proposicoes.ementa_simples` | idem |
| Proposta de governo resumida | `candidatos.proposta_resumo` (JSONB) | idem |
| Resumo interpretativo de perfil | `politico_resumos_ia.conteudo_json` | Cache + cota em `politico_resumos_ia_cotas` |

**Cache de resumos:** `politico_resumos_ia` armazena o resumo com `hash_dados`. Quando os dados do político mudam (novo hash), o resumo é regenerado. A cota diária por político é controlada em `politico_resumos_ia_cotas`.

**Invariante de interface:** todo conteúdo gerado por IA deve ser explicitamente rotulado "Gerado por IA" com link para a fonte original.

---

## 5. Resend

**Papel:** e-mail transacional — confirmação de cadastro, recuperação de senha, links OAuth.

| Aspecto | Detalhe |
|---|---|
| Plano | Free — 3.000 e-mails/mês |
| Remetente | `noreply@meuspoliticos.com.br` |
| Chave | `RESEND_API_KEY` |
| Região AWS | `sa-east-1` |
| DNS | SPF/DKIM configurado no Cloudflare |

**Uso:** os e-mails são disparados diretamente pelo Supabase Auth (configurado com Resend como SMTP). O Next.js não chama a API Resend diretamente — é transparente para o código da aplicação.

---

## 6. OAuth — Provedores

Os três provedores são configurados no Supabase Dashboard → Authentication → Providers.

O Supabase gerencia o fluxo OAuth inteiro. O Next.js só precisa implementar o callback:

```
/auth/callback → supabase.auth.exchangeCodeForSession(code) → redirect /painel
```

### Google

| Aspecto | Detalhe |
|---|---|
| Client ID var | `GOOGLE_CLIENT_ID` |
| Client Secret var | `GOOGLE_CLIENT_SECRET` |
| Redirect URI | `https://supabase.meuspoliticos.com.br/auth/v1/callback` |
| Dados recebidos | `full_name`, `email`, `picture` (avatar) |

### Twitter / X

| Aspecto | Detalhe |
|---|---|
| Client ID var | `TWITTER_CLIENT_ID` |
| Client Secret var | `TWITTER_CLIENT_SECRET` |
| OAuth | OAuth 2.0 (PKCE) |

### LinkedIn

| Aspecto | Detalhe |
|---|---|
| Client ID var | `LINKEDIN_CLIENT_ID` |
| Client Secret var | `LINKEDIN_CLIENT_SECRET` |

---

## 7. APIs de dados públicos (fontes do ETL)

Consumidas pelos scripts Python em `etl/`. Não são chamadas pelo Next.js em runtime.

### Câmara dos Deputados

| Recurso | URL |
|---|---|
| Base URL | `https://dadosabertos.camara.leg.br/api/v2` |
| Documentação | `https://dadosabertos.camara.leg.br/swagger/api.html` |
| Dados coletados | Deputados, votações, gastos CEAP, proposições, presença (eventos) |
| Rate limit | Não documentado — implementar sleep entre requisições |

**Endpoints principais:**
- `GET /deputados` — lista de deputados
- `GET /deputados/{id}/votacoes` — votações do deputado
- `GET /deputados/{id}/despesas` — gastos CEAP
- `GET /deputados/{id}/eventos` — presença em sessões
- `GET /proposicoes` — proposições legislativas

### Senado Federal

| Recurso | URL |
|---|---|
| Base URL | `https://legis.senado.leg.br/direitosadaptados/api` |
| Dados coletados | Senadores, votações, matérias, comissões, discursos, sessões |
| Formato resposta | XML (Bronze layer → `raw_senado`) |

### TSE

| Recurso | URL |
|---|---|
| Base URL | `https://dadosabertos.tse.jus.br` |
| Dados coletados | Candidatos 2026 (CSV), eleitos 2022, histórico eleitoral |
| Formato | CSV bulk download |

### Portal da Transparência (CGU)

| Recurso | URL |
|---|---|
| Base URL | `https://api.portaldatransparencia.gov.br/api-de-dados` |
| Autenticação | `PORTAL_TRANSPARENCIA_API_KEY` no header `chave-api` |
| Dados coletados | Emendas parlamentares individuais, Emendas Pix |

**Endpoints:**
- `GET /emendas` — emendas individuais por parlamentar
- `GET /transferencias-especiais` — Emendas Pix

### IBGE

| Recurso | URL |
|---|---|
| Base URL | `https://servicodados.ibge.gov.br/api/v1/localidades` |
| Dados coletados | Municípios com código IBGE, nome, UF, população |

### Assembleias Legislativas Estaduais

| Assembleia | Sistema | URL |
|---|---|---|
| ALESP (SP) | API própria | `https://www.al.sp.gov.br/api/...` |
| ALEP (PR) | SAPL | `https://sapl.al.pr.leg.br/api/...` |
| ALMG (MG) | API própria | `https://dadosabertos.almg.gov.br/api/...` |
| ALMT (MT) | SAPL | `https://sapl.mt.leg.br/api/...` |
| CLDF (DF) | SAPL | `https://sapl.cl.df.leg.br/api/...` |

Scripts em `etl/ale/`. Status de integração ao banco: **pendente de validação** (Gap G-13 — diretório não commitado).

### ViaCEP

| Recurso | URL |
|---|---|
| Base URL | `https://viacep.com.br/ws/{cep}/json/` |
| Uso | Endpoint `/meu-estado` — busca representantes por CEP |
| Dados retornados | Apenas `uf` — nunca persistido (LGPD) |

---

## 8. Cloudflare

**Papel:** DNS, CDN, proteção DDoS básica, redirect `.com` → `.com.br`.

Não há integração de código — tudo configurado no painel Cloudflare. O Next.js recebe as requisições já roteadas pelo Cloudflare.

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
