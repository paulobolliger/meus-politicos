---
file: docs/DEPENDENCIES.md
module: Dependencies Reference
status: Active
related: [docs/MONOREPO.md, docs/DEPLOYMENT.md, app/package.json]
---

# Dependências — Referência Técnica

---

## 1. Stack de produção (`app/package.json` — `dependencies`)

### Framework e runtime

| Pacote | Versão | Papel |
|---|---|---|
| `next` | 16.2.6 | Framework principal — App Router, SSR, ISR, Middleware |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | DOM renderer |

> **Next.js 16:** versão major pós-15 com breaking changes relevantes. Antes de editar qualquer código Next.js, ler `node_modules/next/dist/docs/` — APIs podem diferir do conhecimento treinado em versões anteriores.

---

### Banco de dados e autenticação

| Pacote | Versão | Papel |
|---|---|---|
| `@supabase/supabase-js` | ^2.105.4 | Supabase client principal |
| `@supabase/ssr` | ^0.10.3 | Supabase com suporte a SSR — `createServerClient`, `createBrowserClient` |
| `pg` | ^8.20.0 | Driver PostgreSQL direto para Node.js — usado em route handlers admin e ETL |

**Padrão de uso:** `@supabase/ssr` para Server Components e API Routes, `@supabase/supabase-js` para operações que precisam do client direto. O `pg` é usado apenas quando a query precisar de acesso direto ao banco (sem RLS ou sem passar pelo PostgREST).

---

### Pagamentos

| Pacote | Versão | Papel |
|---|---|---|
| `stripe` | ^22.1.1 | SDK Stripe server-side — criação de PaymentIntents, verificação de webhooks |
| `@stripe/stripe-js` | ^9.6.0 | SDK Stripe client-side — carregamento do Stripe.js |
| `@stripe/react-stripe-js` | ^6.4.0 | Componentes React para Stripe Elements |

**Status:** modo **teste** (`sk_test_*`). Para go-live, substituir pelas chaves live e configurar webhook em produção.

---

### IA

| Pacote | Versão | Papel |
|---|---|---|
| `openai` | ^6.37.0 | SDK oficial OpenAI — tradução de juridiquês, resumos de candidatos, resumos interpretativos |

---

### UI e estilo

| Pacote | Versão | Papel |
|---|---|---|
| `tailwindcss` _(devDep)_ | ^4 | Utility-first CSS — v4 com binários nativos |
| `shadcn` | ^4.7.0 | CLI para adicionar componentes shadcn/ui |
| `@base-ui/react` | ^1.4.1 | Primitivos de UI sem estilo (Radix alternativo do MUI team) |
| `class-variance-authority` | ^0.7.1 | CVA — variantes tipadas de componentes |
| `tailwind-merge` | ^3.6.0 | Merge de classes Tailwind sem conflito |
| `tw-animate-css` | ^1.4.0 | Animações CSS via Tailwind |
| `lucide-react` | ^1.14.0 | Ícones SVG — biblioteca padrão do projeto |
| `framer-motion` | ^12.38.0 | Animações complexas — carrosséis, transições de página |

---

### Formulários e validação

| Pacote | Versão | Papel |
|---|---|---|
| `react-hook-form` | ^7.75.0 | Gerenciamento de formulários performático |
| `@hookform/resolvers` | ^5.2.2 | Bridge entre react-hook-form e validadores externos |
| `zod` | ^4.4.3 | Schema validation — tipos TypeScript inferidos automaticamente |

**Padrão:** `useForm` + `zodResolver` + schema Zod em todos os formulários. Validação acontece client-side para UX e é replicada server-side nas API Routes.

---

### Visualização de dados

| Pacote | Versão | Papel |
|---|---|---|
| `recharts` | ^3.8.1 | Gráficos (gastos, presença, votações) — baseado em D3 |
| `react-simple-maps` | ^3.0.0 | Mapa SVG do Brasil para seleção de estado |

---

### Utilitários

| Pacote | Versão | Papel |
|---|---|---|
| `date-fns` | ^4.1.0 | Formatação e manipulação de datas — localização pt-BR |
| `clsx` | ^2.1.1 | Utilitário de composição de classes CSS condicionais |

---

## 2. Dependências de desenvolvimento (`devDependencies`)

| Pacote | Versão | Papel |
|---|---|---|
| `typescript` | ^5 | TypeScript 5 — tipos no projeto inteiro |
| `@types/node` | ^20 | Tipos do Node.js 20+ |
| `@types/react` | ^19 | Tipos React 19 |
| `@types/react-dom` | ^19 | Tipos React DOM 19 |
| `@types/pg` | ^8.20.0 | Tipos do driver `pg` |
| `eslint` | ^9 | Linter — flat config |
| `eslint-config-next` | 16.2.6 | Regras ESLint específicas do Next.js |
| `@tailwindcss/postcss` | ^4 | Plugin PostCSS para Tailwind v4 |

---

## 3. Dependências opcionais (`optionalDependencies`)

Binários nativos do Tailwind CSS v4 para Linux (necessários na Vercel):

| Pacote | Plataforma |
|---|---|
| `@tailwindcss/oxide-linux-x64-gnu` | Linux x64 (glibc — Debian/Ubuntu) |
| `@tailwindcss/oxide-linux-x64-musl` | Linux x64 (musl — Alpine) |
| `lightningcss-linux-x64-gnu` | Linux x64 (glibc) |
| `lightningcss-linux-x64-musl` | Linux x64 (musl) |

Em Windows/macOS os binários corretos são baixados automaticamente pelo npm. Na Vercel esses pacotes são instalados explicitamente via `installCommand` no `vercel.json`.

---

## 4. Dependências Python (ETL)

`requirements.txt` na raiz:

| Pacote | Versão | Papel |
|---|---|---|
| `requests` | 2.31.0 | HTTP client — coletas das APIs externas |
| `psycopg[binary]` | latest | Driver PostgreSQL para Python — UPSERT dos dados coletados |
| `python-dotenv` | 1.0.0 | Carregamento de `app/.env.local` pelos scripts |
| `python-dateutil` | 2.8.2 | Parsing de datas em múltiplos formatos das APIs |
| `unidecode` | 1.3.8 | Normalização de strings com acentos (para geração de slugs) |

---

## 5. Dependências da raiz do monorepo (`package.json` raiz)

| Pacote | Versão | Notas |
|---|---|---|
| `next` | 16.2.6 | devDependency — provável para resolução de imports por IDEs a partir da raiz |
| `prop-types` | ^15.8.1 | dependency — herança legada; pode ser removido se não usado diretamente |

---

## 6. Análise de riscos

### Versões em atenção

| Situação | Pacote | Detalhe |
|---|---|---|
| Breaking changes recentes | `next@16` | Versão major nova — verificar `node_modules/next/dist/docs/` antes de editar |
| Major version alta | `stripe@22` | SDK atualizado frequentemente — checar changelog ao atualizar |
| API instável | `zod@4` | v4 recém lançada — pode ter breaking changes em relação a v3 |
| Sem testes | Global | Gap G-06 — zero cobertura de testes para validar upgrades |

### Dependências sem uso identificado

| Pacote | Suspeita |
|---|---|
| `prop-types` (raiz) | Herança de bootstrap inicial — verificar se tem importações reais |
| `@base-ui/react` | Verificar se é usado ou substituído pelo shadcn/ui |

---

## 7. Atualização de dependências

**Antes de atualizar qualquer dependência de produção:**

1. Não há testes automatizados (Gap G-06) — risco de regressão sem detecção
2. Para `next`, `@supabase/ssr`, `stripe` — verificar changelogs por breaking changes
3. Para Tailwind v4 — qualquer upgrade pode exigir recompilação dos binários opcionais
4. Testar em dev local com build de produção (`npm run build`) antes de mergedar

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
