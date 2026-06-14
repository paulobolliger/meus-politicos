---
file: docs/TESTING.md
module: Testing Strategy
status: Active
related: [docs/DEPENDENCIES.md, docs/GAP_ANALYSIS.md, docs/API.md]
---

# Testes — Estado Atual e Estratégia

> Estado em 2026-06-12: Playwright esta configurado em `app/playwright.config.ts` com testes E2E de navegacao, hidratacao, responsividade, rotas protegidas e validacao da API de pagamentos.

---

## 1. O que existe hoje

### 1.1 TypeScript — verificação de tipos

A verificacao de tipos possui script dedicado:

```bash
# Executar type check sem emitir arquivos
npm run typecheck
```

**Cobertura:** tipos de componentes, props, retornos de funções, schemas Zod → tipos TypeScript. Captura erros de tipo em tempo de compilação, mas não captura lógica incorreta ou comportamento em runtime.

**Status:** executavel isoladamente e tambem validado pelo build.

### 1.2 ESLint — análise estática

Configurado em `app/eslint.config.mjs` com flat config (ESLint 9):

```js
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs  from "eslint-config-next/typescript";
```

**Regras ativas:**
- `eslint-config-next/core-web-vitals` — `next/no-html-link-for-pages`, `@next/next/no-img-element`, `react-hooks/exhaustive-deps`, Core Web Vitals
- `eslint-config-next/typescript` — regras TypeScript via `@typescript-eslint`
- `eslint-plugin-jsx-a11y` — acessibilidade básica (inclusa no preset Next.js)

**Executar:**
```bash
cd app && npm run lint
```

### 1.3 Cobertura automatizada atual

| Tipo de teste | Framework | Status |
|---|---|---|
| Testes unitários | Vitest / Jest | ❌ Não configurado |
| Testes de integração | Vitest + pg-test | ❌ Não configurado |
| Testes E2E | Playwright | Configurado |
| Cobertura de código | c8 / istanbul | ❌ Não configurado |
| Testes de API | Playwright request context | Configurado para validacao de pagamentos |
| Testes de snapshot | Vitest snapshots | ❌ Não configurado |

---

Executar:

```bash
cd app
npm run test:e2e
npm run test:e2e -- --project=desktop
```

Suites atuais:

| Arquivo | Cobertura |
|---|---|
| `hydration.spec.ts` | Erros de hidratacao em rotas publicas |
| `navigation.spec.ts` | Navegacao e redirect legado `/meu-estado` |
| `responsive.spec.ts` | Overflow horizontal em rotas publicas, inclusive 320 px |
| `protected-routes.spec.ts` | Redirect de painel, conta e admin sem sessao |
| `payment-api.spec.ts` | Validacao antes de gateway externo |

## 2. Riscos ainda nao cobertos

### 2.1 Riscos identificados

| Risco | Área | Probabilidade |
|---|---|---|
| Regressão ao atualizar Next.js 16 → 17 | Middleware, RSC | Alta |
| Bug silencioso em cálculo de scores (METRICS.md) | `presenca_pct`, `gasto_total` | Alta |
| Quebra na lógica de cookies cross-subdomain | `middleware.ts` | Média |
| RLS bypassada acidentalmente por `createAdminClient()` usado no lugar errado | API routes | Média |
| Filtro de partido retorna dados errados no fallback `pg.Pool` | `/api/busca` | Média |
| Webhooks com gateway real e banco isolado | `/api/webhooks/asaas`, `/api/webhooks/infinitepay` | Media |

### 2.2 Custo do upgrade sem testes

```
next@16.2.6 → next@17.x:
  sem testes = deploy para staging + teste manual em 30+ páginas
  com testes = CI verde = seguro para deploy
```

---

## 3. Estratégia recomendada

### Fase 1 — Setup (2–4h)

**Framework escolhido:** Vitest (compatível com TypeScript, ESM, mais rápido que Jest, ecossistema Vite).

```bash
cd app
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

**Configuração mínima** (`app/vitest.config.ts`):

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Setup file** (`app/src/test/setup.ts`):

```ts
import '@testing-library/jest-dom'
  createClient: vi.fn(() => ({
    auth: { getSession: vi.fn(), getUser: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), eq: vi.fn() })),
  })),
}))
```

**Script** em `app/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

---

### Fase 2 — Testes unitários prioritários

Ordem por risco × valor:

#### 2.1 Funções de cálculo de métricas

Arquivo: `app/src/lib/metrics/` (a criar conforme `docs/METRICS.md`)

```ts
// Exemplo: presenca_pct_atual
import { calcPresencaPct } from '@/lib/metrics/presenca'

test('presença acima da média → verde', () => {
  expect(calcPresencaPct(92, 85)).toEqual({ valor: 92, cor: 'verde', delta: '+8.2%' })
})

test('presença indisponível → traço', () => {
  expect(calcPresencaPct(null, 85)).toEqual({ valor: null, display: '–' })
})
```

#### 2.2 Utilitários de formato

```ts
// date-fns + formatação de moeda
import { formatarMoeda, formatarData } from '@/lib/format'

test('formatarMoeda', () => {
  expect(formatarMoeda(145000.5)).toBe('R$ 145.000,50')
})
```

#### 2.3 Schemas Zod (validação de API)

```ts
// Garantir que o schema de /api/apoio/criar-intent não aceita valores inválidos
import { createIntentSchema } from '@/app/api/apoio/criar-intent/schema'

test('valor abaixo do mínimo é rejeitado', () => {
  const result = createIntentSchema.safeParse({ nome: 'João', email: 'j@j.com', tipo: 'mensal', valor: 2 })
  expect(result.success).toBe(false)
})
```

---

### Fase 3 — Testes de integração de API routes


Prioridade por criticidade:

| Route | Por que testar | Tipo de mock necessário |
|---|---|---|
| `POST /api/webhooks/stripe` | Verifica assinatura — bug aqui = doação perdida | `stripe.webhooks.constructEvent` mock |

**Padrão de teste para API route:**

```ts
// app/src/app/api/webhooks/stripe/__tests__/route.test.ts
import { POST } from '../route'
import { NextRequest } from 'next/server'

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({ type: 'payment_intent.succeeded', data: { object: {} } }),
    },
  })),
}))

test('assinatura válida retorna 200', async () => {
  const req = new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: '{}',
    headers: { 'stripe-signature': 'valid_sig' },
  })
  const res = await POST(req)
  expect(res.status).toBe(200)
})

test('assinatura inválida retorna 400', async () => {
  vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => { throw new Error('Invalid') })
  // ...
  expect(res.status).toBe(400)
})
```

---

### Fase 4 — Testes E2E (Playwright)

**Instalação:**

```bash
cd app
npm install -D @playwright/test
npx playwright install chromium
```

**Configuração** (`app/playwright.config.ts`):

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/e2e',
  webServer: { command: 'npm run dev', port: 3000 },
  use: { baseURL: 'http://localhost:3000' },
})
```

**Testes E2E prioritários (golden paths):**

| Fluxo | Complexidade | Valor |
|---|---|---|
| Busca por nome → clique no resultado → perfil carrega | Baixa | Alta — caminho mais comum |
| `/meu-estado` legado → redirect permanente para `/estado` | Alta | Baixa |
| Login Google OAuth → redirect /painel | Alta | Alta — sessão cross-subdomain |
| Admin acessa /admin → KPIs carregam | Média | Alta — proteção dupla |
| Pagamento Stripe (modo test) → webhook → confirmação | Alta | Alta — fluxo financeiro |

**Exemplo mínimo:**

```ts
// src/test/e2e/busca.spec.ts
import { test, expect } from '@playwright/test'

test('busca por nome retorna resultados', async ({ page }) => {
  await page.goto('/busca?q=nikolas')
  await expect(page.locator('[data-testid="resultado-politico"]').first()).toBeVisible()
})

test('resultado vazio exibe mensagem', async ({ page }) => {
  await page.goto('/busca?q=xyzabc123')
  await expect(page.locator('text=Nenhum resultado')).toBeVisible()
})
```

---

## 4. Cobertura mínima aceitável para go-live

| Área | Cobertura mínima | Justificativa |
|---|---|---|
| Funções de cálculo de métricas | 90% | Alto risco de regressão visual |
| API routes de pagamento | 80% | Financeiro |
| API route de busca (incluindo fallback) | 75% | Path mais trafegado |
| Schemas Zod | 70% | Validação de entrada |
| E2E golden paths | 5 fluxos | Smoke test de release |
| Componentes UI | 0% aceitável | Storybook > testes unitários aqui |

**Não testar:**
- Componentes puramente visuais — testar visualmente (dev server + screenshot manual)
- Conteúdo de páginas estáticas (sobre, manifesto, termos) — não tem lógica
- ETL Python — testar em ambiente de staging com dados reais

---

## 5. CI — integração com GitHub Actions

Quando os testes existirem, adicionar ao pipeline (resolve Gap G-04 parcialmente):

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd app && npm ci
      - run: cd app && npm run typecheck
      - run: cd app && npm run lint
      - run: cd app && npm run test
```

---

## 6. Priorização de implementação

| Etapa | Esforço estimado | Prioridade |
|---|---|---|
| Setup Vitest + configuração base | 2h | 1ª — próximo sprint |
| Testes de métricas (METRICS.md) | 4h | 1ª — alto risco |
| Testes de schemas Zod | 2h | 2ª |
| Testes de webhooks (Stripe) | 3h | 2ª — financeiro |
| Testes de `/api/busca` fallback | 3h | 2ª |
| Setup Playwright + E2E golden paths | 1 dia | 3ª |
| CI GitHub Actions | 1h (depois dos testes) | 3ª |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
