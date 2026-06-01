# AI_INSTRUCTIONS — Meus Políticos

Guia de referência rápida para agentes IA trabalhando neste repositório.
Leia antes de editar qualquer arquivo. Este documento complementa `app/CLAUDE.md` e `app/AGENTS.md` (carregados automaticamente).

---

## 1. Contexto do projeto

**Meus Políticos** é uma plataforma brasileira de transparência política.
Empresa: NORO GURU LTDA · CNPJ 63.429.497/0001-88

**Produtos (mesmo deploy Next.js 16, diferenciados por subdomínio):**

| Produto | Host dev | Host produção |
|---|---|---|
| Site público | `localhost:3000` | `meuspoliticos.com.br` |
| App analítico | `app.localhost:3000` | `app.meuspoliticos.com.br` |
| Painel do usuário | `painel.localhost:3000` | `painel.meuspoliticos.com.br` |
| Admin interno | `localhost:3000/admin` | `meuspoliticos.com.br/admin` |

**Stack:** Next.js 16 · React 19 · Supabase self-hosted (PostgreSQL 15) · Tailwind v4 · TypeScript 5

---

## 2. Regras inegociáveis (P0)

### 2.1 Nunca conectar ao banco de produção via código

```
PROIBIDO: qualquer chamada direta a SUPABASE_DB_HOST=45.32.169.173 em runtime de desenvolvimento.
PROIBIDO: executar scripts ETL apontando para o VPS de produção sem instrução explícita do usuário.
PERMITIDO: `createClient()` / `createAdminClient()` via Supabase API (PostgREST) — usa RLS.
PERMITIDO: conexão `pg` via POSTGRES_HOST=localhost com SSH tunnel ativo.
```

### 2.2 Nunca expor segredos

- Nunca incluir valores reais de chaves em código, comentários ou documentação
- `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o cliente (apenas server-side)
- `STRIPE_SECRET_KEY` nunca vai para o cliente
- `OPENAI_API_KEY` nunca vai para o cliente
- `'use client'` + qualquer variável sem `NEXT_PUBLIC_` = bug de segurança

### 2.3 Seleção obrigatória do cliente Supabase correto

```typescript
// Client Component ('use client') ou route do browser
import { createClient } from '@/lib/supabase/client'
// → usa ANON_KEY · respeita RLS · para operações do usuário autenticado

// Server Component, API Route, Server Action
import { createClient } from '@/lib/supabase/server'
// → usa ANON_KEY · respeita RLS · requer cookies() ativo

// Admin: painel /admin, webhooks, operações que precisam bypassar RLS
import { createAdminClient } from '@/lib/supabase/server'
// → usa SERVICE_ROLE_KEY · bypassa RLS · NUNCA em Client Component
```

**Regra crítica:** nunca usar `createAdminClient()` fora de:
- Server Components em `(admin)/`
- API routes que já verificaram `perfis.role = 'admin'`
- Webhook handlers (sem sessão de usuário)

---

## 3. Arquitetura e roteamento

### 3.1 Route groups e subdomínios

O roteamento por subdomínio é feito em `app/src/proxy.ts` (middleware Next.js).

| Route group | Subdomínio | Exige auth? |
|---|---|---|
| `(site)/` | `meuspoliticos.*` | Não (público) |
| `(app)/` | `app.meuspoliticos.*` | Não (público) |
| `(painel)/` | `painel.meuspoliticos.*` | Sim (redirect `/login`) |
| `(admin)/` | qualquer host `/admin` | Sim + `role = 'admin'` |
| `(checkout)/` | qualquer host `/apoio` | Não |
| `(auth)/` | qualquer host `/auth` | Não |

### 3.2 Componentes — onde criar

| Tipo | Diretório |
|---|---|
| Componentes cívicos (domínio político) | `app/src/components/civic/` |
| Componentes do site público | `app/src/components/site/` |
| Componentes UI genéricos (shadcn) | `app/src/components/ui/` |
| Utilitários/helpers | `app/src/lib/` |

**Sempre verificar `app/src/components/civic/` antes de criar novo componente de domínio.**

### 3.3 Variáveis de ambiente

O `app/next.config.ts` usa `loadEnvConfig(path.resolve(__dirname, '..'))` — carrega `.env.local` do diretório pai (`app/`). O arquivo vive em `app/.env.local`, não na raiz do monorepo.

---

## 4. Banco de dados

### 4.1 Schema

**Schema atual: v2.12** — 20 migrations em `supabase/migrations/`.

Tabelas principais:

| Tabela | Descrição |
|---|---|
| `politicos` | 513 dep. federais + 81 senadores + 27 governadores + dep. estaduais |
| `votacoes` | 379k+ votos registrados (2023–2025) |
| `gastos` | 527k gastos CEAP Câmara + 40k Senado |
| `emendas` | 16.6k emendas parlamentares |
| `proposicoes` | 57k proposições da Câmara |
| `candidatos` | Candidatos TSE 2026 |
| `perfis` | Usuários cadastrados (espelha `auth.users`) |
| `feature_flags` | Feature flags gerenciadas via `/admin/flags` |
| `coletas_log` | Log de execuções de ETL |

Para schema completo: `docs/DATABASE.md`.

### 4.2 RLS — todas as tabelas têm RLS ativo

- Dados políticos: leitura pública (`FOR SELECT USING (true)`)
- Dados do usuário: `auth.uid() = usuario_id`
- Tabelas admin: `EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')`

**Nunca desativar RLS.** Se a query não retornar dados esperados, usar `createAdminClient()` com a justificativa correta — não desabilitar a política.

### 4.3 Queries SQL

- Sempre usar queries parametrizadas (nunca interpolação de string com input do usuário)
- Supabase client: `.eq()`, `.ilike()`, `.filter()` — safe por padrão
- `pg` direto: usar `$1, $2` com array de params — nunca `${variavel}` em SQL string

---

## 5. Métricas e scores

**LEITURA OBRIGATÓRIA antes de criar qualquer componente que exiba métricas:**

→ `docs/METRICS.md` — fórmulas, cores, benchmarks, disclaimers obrigatórios

Regras resumidas:
- Dados indisponíveis → exibir `"–"` com tooltip `"Dados sendo coletados"`
- Nunca exibir score sem comparativo com peers (mesma UF/partido)
- Disclaimer obrigatório em páginas com scores
- Cores: `verde ≥ +10%` da média · `âmbar ±10%` · `vermelho ≤ -10%` · `cinza` sem dados

Para fallback e exibição de dados cadastrais: `docs/BACKOFFICE_DATA_CONTRACT.md`

---

## 6. Exibição de conteúdo — regras de design

### 6.1 Obrigatório em todo conteúdo IA

Todo resumo, ementa simplificada ou descrição gerada por OpenAI **deve**:
1. Exibir badge "Gerado por IA" visível
2. Incluir link para a fonte original (Câmara, TSE, Senado)

Nunca omitir o badge mesmo que o conteúdo pareça factual.

### 6.2 Nota de neutralidade em candidatos 2026

A aba Proposta do candidato **deve** exibir banner âmbar:

> "O resumo foi gerado por IA a partir da proposta oficial do TSE. A plataforma não avalia, ranqueia ou recomenda candidatos. Todos os dados são de fontes oficiais."

Candidatos em listagens: **sempre em ordem alfabética** — nunca por relevância ou score.

### 6.3 "Em breve" — nunca 404 silencioso

Features não implementadas: exibir card/badge "Em breve" desabilitado.
Não remover o card — comunica o roadmap sem frustrar o usuário.

### 6.4 Badges de cargo — cores fixas

| Cargo | Fundo | Texto |
|---|---|---|
| Dep. Federal | `#e8eefb` | `#1a2b5e` |
| Senador | `#e8f5ee` | `#085041` |
| Governador | `#fff0e8` | `#7a3000` |
| Prefeito | `#f0e8ff` | `#3c1489` |
| Dep. Estadual | `#fef9e8` | `#7a6000` |
| Vereador | `#fce8f0` | `#7a0040` |

### 6.5 Cores de presença

`≥ 80%` → verde · `60–79%` → âmbar · `< 60%` → vermelho · sem dado → cinza + `"–"`

---

## 7. ETL — regras de operação

Os scripts Python em `etl/` são o único mecanismo de coleta de dados. O Next.js **nunca** chama APIs externas de dados políticos em runtime.

### 7.1 Status dos dados (mai/2026)

| Tabela | Fonte | Registros | Status |
|---|---|---|---|
| `gastos` | `camara_ceap` | ~527k | 2022–2025 ok · 2026 pendente (G-07) |
| `gastos` | `senado_ceaps` | ~40k | 2023–2026 ok |
| `votacoes` | `camara_votos_bulk` | ~379k | 2023–2025 ok |
| `emendas` | `portal_transparencia` | ~16.6k | 2024–2025 ok |
| `proposicoes` | `camara_dadosabertos` | ~57k | ok |
| `politicos` | `camara_deputados` | 513 | ok |
| `politicos` | `senado_legis` | 81 | mandato_inicio pendente (G-08) |

### 7.2 Antes de sugerir rodar ETL

Consultar banco para verificar o estado atual:
```sql
SELECT source_id, COUNT(*) as registros, MIN(data) as inicio, MAX(data) as fim
FROM gastos GROUP BY source_id;

SELECT fonte, MAX(iniciado_em) as ultima_coleta, status
FROM coletas_log GROUP BY fonte, status;
```

### 7.3 ETLs pendentes de execução

- `collect_camara_gastos.py --ano 2026` → gastos Câmara 2026 faltando
- `collect_senadores.py` → re-rodar para preencher `mandato_inicio`
- `populate_siafi.py` → após re-rodar senadores

---

## 8. Pagamentos

### 8.1 Estado atual

- Stripe: modo **teste** (`sk_test_*`) — não processa pagamentos reais
- Ambos os webhooks têm TODO de persistência no banco (G-02, G-03)
- Tabela `doacoes` precisa ser criada antes de implementar a persistência

### 8.2 Webhook Stripe — ler raw body antes de qualquer parse

```typescript
const body = await req.text()  // ← OBRIGATÓRIO — não usar req.json()
const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
```

Usar `req.json()` quebra a verificação de assinatura.

### 8.3 InfinitePay — sem HMAC (gap de segurança P2)

O webhook InfinitePay não tem verificação de assinatura. Não implementar lógica financeira irreversível baseada somente no payload recebido até que HMAC seja adicionado.

---

## 9. Padrões de código

### 9.1 Formulários

Padrão obrigatório: `useForm` + `zodResolver` + schema Zod.

```typescript
const schema = z.object({ email: z.email(), valor: z.number().min(5) })
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) })
```

Validação client-side + server-side nas API routes.

### 9.2 Tratamento de erros nas API routes

```typescript
// Padrão de resposta
return NextResponse.json({ error: 'Mensagem clara' }, { status: 400 })
return NextResponse.json({ ok: true })

// Nunca expor stack trace ou mensagem interna no response
```

### 9.3 Analytics — best-effort

```typescript
// Chamar sem await e sem capturar o retorno
fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ tipo, payload }) })
// Nunca bloquear o fluxo principal esperando o analytics
```

### 9.4 Comentários

Por padrão: zero comentários. Apenas quando o WHY é não óbvio (restrição oculta, invariante sutil, workaround de bug específico). Nunca comentar o WHAT — o código já diz.

---

## 10. Testes

**Estado atual:** zero cobertura de testes (Gap G-06). Não há jest, vitest, playwright ou cypress configurados.

Para estratégia completa de implementação: `docs/TESTING.md`

Ao adicionar código novo de alto risco (funções de cálculo de métricas, validações financeiras), mencionar que testes devem ser escritos conforme `docs/TESTING.md §3`.

---

## 11. Segurança — checklist antes de fazer PR

- [ ] Nenhuma variável de ambiente sem `NEXT_PUBLIC_` em Client Component
- [ ] Nenhum SQL com interpolação de string a partir de input do usuário
- [ ] Nenhum `createAdminClient()` em Client Component ou route sem verificação de admin
- [ ] Nenhum `href="#"` em produção (Gap G-05)
- [ ] Conteúdo IA sempre com badge "Gerado por IA"
- [ ] Candidatos 2026 com nota de neutralidade obrigatória
- [ ] `req.text()` (não `req.json()`) em handlers de webhook Stripe

Para referência completa: `docs/SECURITY.md`

---

## 12. Documentação do projeto

| Documento | Quando consultar |
|---|---|
| `docs/ARCHITECTURE.md` | Estrutura geral, route groups, diagrama de fluxo |
| `docs/DATABASE.md` | Schema, tabelas, migrations, RLS, views |
| `docs/AUTH.md` | Fluxo de autenticação, cookies, OAuth |
| `docs/API.md` | Todos os route handlers com request/response |
| `docs/INTEGRATIONS.md` | Stripe, InfinitePay, OpenAI, APIs externas |
| `docs/ENVIRONMENT.md` | Todas as variáveis de ambiente |
| `docs/DEPLOYMENT.md` | Vercel, VPS, SSH, migrations |
| `docs/SECURITY.md` | RLS, webhooks, checklist de segurança |
| `docs/METRICS.md` | Fórmulas de score — LEITURA OBRIGATÓRIA |
| `docs/BACKOFFICE_DATA_CONTRACT.md` | Fallback de dados cadastrais |
| `docs/BUSINESS_DOMAIN.md` | Entidades, temas, glossário, fluxos de negócio |
| `docs/DESIGN.md` | Design system, wireframes, logos |
| `docs/TESTING.md` | Estratégia de testes e setup |
| `docs/GAP_ANALYSIS.md` | 19 gaps catalogados — estado atual |
| `docs/TODO_PRODUCTION.md` | Checklist de go-live |
| `docs/MODERNIZATION_ROADMAP.md` | Roadmap por fase |

---

## 13. Feature flags

Features controladas sem deploy via `/admin/flags`:

| Slug | Default | Controla |
|---|---|---|
| `candidatos_2026` | `true` | Módulo de candidatos |
| `resumo_ia` | `true` | Resumos OpenAI |
| `comparador` | `false` | Ferramenta de comparação |
| `mapa_interativo` | `true` | Mapa SVG do Brasil |
| `modo_manutencao` | `false` | Exibe banner de manutenção |

Para lista completa e rollout_pct: `docs/BUSINESS_DOMAIN.md §10`

---

*Versão: 2026-05-29 · Auditoria v2.1*
