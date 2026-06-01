---
file: docs/MONOREPO.md
module: Monorepo Structure
status: Active
related: [README.md, docs/DEPLOYMENT.md, docs/ARCHITECTURE.md, package.json, app/package.json]
---

# Monorepo — Estrutura e Convenções

---

## 1. Tipo de monorepo

**npm Workspaces** — estrutura mínima com um único workspace (`app/`).

| Aspecto | Status |
|---|---|
| Package manager | npm |
| Workspaces | `["app"]` (definido em `package.json` raiz) |
| Build orchestrator | ❌ Nenhum (Gap G-11 — ver seção 6) |
| Turbopack | ✅ Configurado no Next.js dev (não é o Turborepo) |

---

## 2. Estrutura de diretórios

```
meuspoliticos/                   ← raiz do monorepo
├── package.json                 ← workspace root — scripts proxy para app/
├── package-lock.json
├── requirements.txt             ← dependências Python (ETL)
├── vercel.json                  ← configuração do deploy Vercel
├── .env.example                 ← template de variáveis (incompleto — Gap G-01)
│
├── app/                         ← ÚNICO WORKSPACE — Next.js 16
│   ├── package.json             ← dependências do frontend
│   ├── next.config.ts           ← config Next.js (loadEnv do pai, Turbopack)
│   ├── .env.local               ← variáveis de ambiente (não commitado)
│   ├── public/                  ← assets estáticos
│   │   └── partidos/            ← logos de partidos (não commitado — Gap G-15)
│   └── src/
│       ├── app/                 ← Next.js App Router
│       │   ├── (site)/          ← meuspoliticos.com.br
│       │   ├── (app)/           ← app.meuspoliticos.com.br
│       │   ├── (painel)/        ← painel.meuspoliticos.com.br
│       │   │   ├── (auth)/      ← login, cadastro, recuperar-senha
│       │   │   └── (dashboard)/ ← /painel, /meus-politicos
│       │   ├── (admin)/         ← /admin (role: admin)
│       │   ├── (checkout)/      ← fluxo de doação
│       │   ├── (auth)/          ← callback OAuth
│       │   └── api/             ← route handlers
│       ├── components/
│       │   ├── civic/           ← biblioteca cívica reutilizável ← verificar AQUI primeiro
│       │   ├── site/            ← componentes do site público
│       │   ├── politico-v2/     ← perfil do político (app analítico)
│       │   ├── admin/           ← componentes do painel admin
│       │   ├── auth/            ← formulários de login/cadastro
│       │   └── ui/              ← shadcn/ui base
│       ├── lib/
│       │   └── supabase/        ← client.ts · server.ts · middleware.ts · types.ts
│       ├── types/               ← tipos TypeScript globais
│       └── proxy.ts             ← middleware de roteamento por host
│
├── etl/                         ← scripts Python de coleta (fora do workspace npm)
│   ├── camara/
│   ├── senado/
│   ├── tse/
│   ├── ale/
│   ├── ibge/
│   ├── portal_transparencia/
│   ├── partidos/
│   ├── ia/
│   ├── estados/
│   └── stn/
│
├── supabase/
│   ├── migrations/              ← schema atual — 20+ arquivos
│   ├── seeds/                   ← seeds de desenvolvimento
│   └── 001_schema.sql           ← schema monolítico legado (referência histórica)
│
└── docs/                        ← documentação técnica e de negócio
    ├── design/
    │   ├── wireframes.md
    │   └── branding.md
    └── archive/
```

---

## 3. Package.json raiz — scripts

Os scripts da raiz são simples proxies para `app/`:

```json
{
  "scripts": {
    "dev":   "npm --prefix app run dev",
    "build": "npm --prefix app run build",
    "start": "npm --prefix app run start",
    "lint":  "npm --prefix app run lint"
  }
}
```

**`next` como devDependency na raiz:** o `package.json` raiz declara `"next": "16.2.6"` como `devDependency`. Isso é incomum — o Next.js real é declarado em `app/package.json`. A devDependency na raiz provavelmente existe para que ferramentas de IDE e análise resolvam imports corretamente a partir da raiz do monorepo.

---

## 4. Carregamento de variáveis de ambiente

`app/next.config.ts` usa `loadEnvConfig` do `@next/env` para carregar o `.env.local` do diretório pai:

```typescript
import { loadEnvConfig } from "@next/env"
import path from "path"

loadEnvConfig(path.resolve(__dirname, ".."))
// __dirname = app/ → resolve(..) = raiz do monorepo
```

**Consequência:** o arquivo `.env.local` pode ficar em `app/.env.local` (padrão Next.js) e ainda assim ser lido corretamente. O carregamento explícito via `loadEnvConfig` garante que os scripts ETL Python — que também usam `python-dotenv` — possam ler o mesmo arquivo.

---

## 5. Turbopack

`app/next.config.ts` configura o Turbopack com `root` apontando para a raiz do monorepo:

```typescript
turbopack: {
  root: path.resolve(__dirname, ".."),
}
```

Isso **não é o Turborepo** (ferramenta de orquestração de build). É o bundler Turbopack do Next.js, ativo apenas em `next dev`. Em produção (`next build`), o build usa o bundler padrão do Next.js 16.

---

## 6. Gap G-11 — Sem orquestrador de build

**Status atual:** sem Turborepo, Nx ou similar.

**Impacto:**
- Sem cache de build compartilhado entre ambientes
- Sem pipeline declarativo (dependências entre tasks)
- Scripts da raiz são apenas proxies simples — nenhuma lógica de orquestração

**Por que não é urgente agora:** com um único workspace (`app/`), o overhead de adicionar Turborepo seria maior que o benefício. A situação mudaria se `etl/` ou `supabase/` fossem convertidos em workspaces npm com seus próprios scripts.

**Avaliação recomendada:** revisar quando o número de workspaces crescer ou quando o tempo de build na CI for um problema.

---

## 7. ETL Python — integração com o monorepo

O diretório `etl/` não é um workspace npm. É um conjunto de scripts Python independentes que:
- Compartilham variáveis de ambiente via `app/.env.local` (lido por `python-dotenv`)
- Conectam ao banco diretamente via `psycopg` (usando variáveis `POSTGRES_*`)
- São executados manualmente ou (futuramente) via GitHub Actions

**`requirements.txt`** na raiz do monorepo instala as dependências Python para todos os scripts:

```
requests==2.31.0
psycopg[binary]
python-dotenv==1.0.0
python-dateutil==2.8.2
unidecode==1.3.8
```

---

## 8. O que NÃO está no repositório (untracked)

| Item | Motivo | Gap |
|---|---|---|
| `app/.env.local` | Credenciais reais — nunca commitar | G-01 |
| `app/public/partidos/` | Logos de partidos — deveria estar commitado | G-15 |
| `etl/ale/` | Scripts ALE em desenvolvimento — não commitados | G-13 |
| `app/node_modules/` | Instalado localmente — ignorado pelo git |
| `app/.next/` | Build output — ignorado pelo git |

---

## 9. Convenções de desenvolvimento

| Convenção | Regra |
|---|---|
| Componentes novos | Verificar `src/components/civic/` primeiro antes de criar um novo |
| Métricas e scores | Ler `docs/METRICS.md` obrigatoriamente antes de implementar |
| Campos de perfil | Ler `docs/BACKOFFICE_DATA_CONTRACT.md` para fallbacks |
| Dados indisponíveis | Exibir `"–"` com tooltip `"Dados sendo coletados"` |
| Tokens CSS | Definidos em `src/app/globals.css` seção `:root` |
| ETL | Consultar `app/CLAUDE.md` para status atual antes de rodar qualquer script |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
