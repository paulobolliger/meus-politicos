---
file: README.md
module: Project Overview
status: Active
related: [docs/MVP_REAL_IDENTIFICADO.md, docs/PRODUCAO_READINESS.md, docs/ARCHITECTURE.md, docs/API.md, docs/DATABASE.md, docs/AUTH.md]
---

# Meus Politicos

Plataforma brasileira de transparencia politica. O produto centraliza dados publicos sobre politicos, partidos, votacoes, gastos, presenca, proposicoes, estados e candidatos, com linguagem acessivel e compromisso explicito de neutralidade editorial.

Empresa: NORO GURU (NORO Tecnologia e Turismo Ltda - CNPJ 63.429.497/0001-88)

Status de produto em 2026-06-02: **Beta tecnico, ainda nao pronto para producao plena**.

## Veredito Atual

O repositorio ja contem um MVP funcional em codigo para o fluxo:

1. Usuario acessa site publico.
2. Usuario busca politicos por nome, cargo, UF ou partido.
3. Usuario abre o perfil de um politico.
4. Usuario autenticado pelo Logto acompanha o politico.
5. O painel autenticado le os politicos acompanhados e monta um feed civico com votacoes e gastos recentes.

O MVP ainda nao deve ser classificado como producao plena porque ha gaps impeditivos em pagamentos, seguranca documental e validacao operacional do banco/deploy. O detalhe esta em [docs/MVP_REAL_IDENTIFICADO.md](docs/MVP_REAL_IDENTIFICADO.md) e [docs/PRODUCAO_READINESS.md](docs/PRODUCAO_READINESS.md).

## Stack Atual

| Camada | Tecnologia | Evidencia no repositorio |
|---|---|---|
| Frontend | Next.js 16.2.6 + React 19.2.4 + TypeScript | `app/package.json`, `app/src/app` |
| Rotas | Next.js App Router | `app/src/app/(site)`, `app/src/app/(app)`, `app/src/app/(painel)`, `app/src/app/(admin)`, `app/src/app/api` |
| Autenticacao | Logto via `@logto/next` | `app/src/lib/logto/*`, `app/src/app/api/auth/logto/*` |
| Sessao e RBAC | `getCurrentUser`, `requireUser`, `requireAdmin` | `app/src/lib/auth/current-user.ts` |
| Banco | PostgreSQL direto via `pg` | multiplos `new Pool()` e `pool.query()` em paginas e route handlers |
| Schema | SQL/migrations | `db/schema.sql`, `db/migrations/*.sql` |
| UI | Tailwind CSS v4, shadcn/ui, lucide-react, recharts, framer-motion | `app/package.json`, `app/src/components` |
| ETL | Python | `etl/camara`, `etl/senado`, `etl/tse`, `etl/ale`, `etl/ibge`, `etl/portal_transparencia` |
| IA | OpenAI SDK | `app/src/actions/resumo-interpretativo.ts`, `etl/ia/simplificar_proposicoes.py` |
| Pagamentos | Asaas | `app/src/app/api/apoio/criar-link/route.ts`, `app/src/app/api/webhooks/asaas/route.ts` |
| Deploy | Vercel | `vercel.json`, scripts `npm run build/start` |

Nota importante: documentacoes antigas ainda podem mencionar Supabase Auth, Stripe ou InfinitePay. O codigo atual aponta para **Logto como identidade ativa** e **Asaas como pagamento ativo**. Em divergencia, o codigo atual vence.

## Mapa De Documentacao

### Veredito, produto e readiness

| Documento | Finalidade |
|---|---|
| [docs/MVP_REAL_IDENTIFICADO.md](docs/MVP_REAL_IDENTIFICADO.md) | Recorte realista do MVP que funciona em codigo, core loop e bloqueios |
| [docs/PRODUCAO_READINESS.md](docs/PRODUCAO_READINESS.md) | Score de prontidao para producao por area |
| [docs/INVENTORY_ROUTES.md](docs/INVENTORY_ROUTES.md) | Mapa de rotas UI e status funcional |
| [docs/INVENTORY_FEATURES.md](docs/INVENTORY_FEATURES.md) | Raio-X das features do produto |
| [docs/PLACEHOLDER_REPORT.md](docs/PLACEHOLDER_REPORT.md) | TODOs, mocks, placeholders e links inativos |
| [docs/GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md) | Gaps tecnicos urgentes e divergencias |

### Engenharia, dados e contratos

| Documento | Finalidade |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura, subdominios, fluxo de dados e diagramas |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema teorico do banco, tabelas, RLS e relacionamentos |
| [docs/INVENTORY_DATABASE_USAGE.md](docs/INVENTORY_DATABASE_USAGE.md) | Uso real das tabelas pelo codigo |
| [docs/API.md](docs/API.md) | Endpoints e contratos HTTP |
| [docs/INVENTORY_API_CONSUMPTION.md](docs/INVENTORY_API_CONSUMPTION.md) | Cruzamento UI -> APIs e APIs sem consumo |
| [docs/AUTH.md](docs/AUTH.md) | Logto, sessao, perfis, roles e protecao de rotas |
| [docs/BUSINESS_DOMAIN.md](docs/BUSINESS_DOMAIN.md) | Entidades e regras de negocio |

### Operacao, seguranca e evolucao

| Documento | Finalidade |
|---|---|
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Variaveis de ambiente e hierarquia de resolucao |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | Asaas, InfinitePay legado, OpenAI, Logto e demais servicos |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Build, deploy, Vercel e procedimentos operacionais |
| [docs/SECURITY.md](docs/SECURITY.md) | Riscos, segredos, RBAC/RLS e varredura historica |
| [docs/DESIGN.md](docs/DESIGN.md) | Guia visual e status de UI/UX |
| [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) | Dependencias, pacotes e riscos |
| [docs/TODO_PRODUCTION.md](docs/TODO_PRODUCTION.md) | Pendencias P0-P3 para lancamento |
| [docs/MODERNIZATION_ROADMAP.md](docs/MODERNIZATION_ROADMAP.md) | Plano tatico pos-readiness |
| [docs/IMPLEMENTATION_ROADMAP_2026-06.md](docs/IMPLEMENTATION_ROADMAP_2026-06.md) | Roteiro executavel de rotas, mobile-first, qualidade, operacao e go-live |

### Documentos historicos e dominio legado

| Documento | Finalidade |
|---|---|
| [docs/meuspoliticos_master.md](docs/meuspoliticos_master.md) | Visao de produto e regras antigas; deve ser tratado como historico |
| [docs/data_source_master.md](docs/data_source_master.md) | Fontes de dados e plano de ETL historico |
| [docs/BACKOFFICE_DATA_CONTRACT.md](docs/BACKOFFICE_DATA_CONTRACT.md) | Contrato de dados do perfil politico |
| [docs/METRICS.md](docs/METRICS.md) | Metodologia de metricas |
| [docs/design/wireframes.md](docs/design/wireframes.md) | Wireframes historicos |
| [docs/design/branding.md](docs/design/branding.md) | Identidade visual |

## Estrutura Do Repositorio

```text
meus-politicos/
  app/
    src/
      app/
        (site)/        Site publico
        (app)/         App analitico
        (painel)/      Area autenticada do usuario
        (admin)/       Backoffice interno
        (checkout)/    Confirmacao de apoio/pagamento
        api/           Route handlers internos e webhooks
      actions/         Server actions, incluindo resumo interpretativo
      components/      UI por dominio
      lib/             Auth, Logto, analytics, utils
      types/           Tipos compartilhados
  docs/                Documentacao de engenharia, produto e historico
  etl/                 Scripts Python de coleta e carga
  db/
    migrations/        Migrations SQL
    seeds/             Seeds SQL
    schema.sql         Schema monolitico de referencia
  package.json         Workspace raiz
  app/package.json     App Next.js
  .env.example         Template limpo de variaveis
  vercel.json          Configuracao Vercel
```

## Rotas Principais

| Area | Rotas | Status pelo inventario |
|---|---|---|
| Site publico | `/`, `/busca`, `/politicos/[id]`, `/projetos`, `/partidos`, `/estado/[sigla]`, `/camara`, `/glossario`, `/candidatos-2026`, `/apoio` | Parcialmente funcional, com dados reais e placeholders localizados |
| App analitico | `app.localhost` / rotas em `(app)` | Parcial, perfil e proposicoes existem; algumas secoes estao "em breve" |
| Painel | `/painel`, `/meus-politicos` | Funcional em codigo para usuario autenticado e acompanhamentos |
| Admin | `/admin`, `/admin/usuarios`, `/admin/flags`, `/admin/dados`, `/admin/etl`, `/admin/analytics` | Operacional parcial, com acoes reais e triggers incompletos |
| API | `/api/busca`, `/api/acompanhamentos`, `/api/admin/*`, `/api/apoio/*`, `/api/auth/logto/*` | Parcialmente conectada ao frontend |

## Variaveis De Ambiente

Use `.env.example` como template e preencha `app/.env.local` com valores reais obtidos no gestor de senhas.

Variaveis minimas de desenvolvimento:

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
LOGTO_APP_SECRET=<logto-app-secret-placeholder>
LOGTO_COOKIE_SECRET=<logto-cookie-secret-placeholder>

INFINITEPAY_HANDLE=meus-politicos
OPENAI_API_KEY=
IA_RESUMO_MAX_GERACOES_DIA=3
PORTAL_TRANSPARENCIA_API_KEY=
RESEND_API_KEY=
RESEND_FROM=noreply@meuspoliticos.com.br
```

Regra operacional: nao publique valores reais em README, docs, issues, commits ou logs. A auditoria identificou risco de segredo em documentacao legada; ver `docs/PRODUCAO_READINESS.md` e, no lote de seguranca, `docs/SECURITY.md`.

## Setup Local

1. Instale dependencias:

```bash
npm install
```

2. Configure `app/.env.local`:

```bash
cp .env.example app/.env.local
```

3. Configure hosts locais para subdominios:

```text
127.0.0.1 app.localhost
127.0.0.1 painel.localhost
```

4. Rode o servidor:

```bash
npm run dev
```

5. Acesse:

| URL | Produto |
|---|---|
| `http://localhost:3000` | Site publico |
| `http://app.localhost:3000` | App analitico |
| `http://painel.localhost:3000` | Painel autenticado |

## Scripts

| Script | Comando | Descricao |
|---|---|---|
| `npm run dev` | `npm --prefix app run dev` | Servidor Next.js local |
| `npm run build` | `npm --prefix app run build` | Build de producao |
| `npm run start` | `npm --prefix app run start` | Servidor Next.js em modo producao |
| `npm run lint` | `npm --prefix app run lint` | ESLint |

## Banco De Dados

O app atual consulta PostgreSQL diretamente com `pg`. O schema vive em `db/schema.sql` e `db/migrations/*.sql`.

Tabelas centrais observadas no codigo:

| Tabela | Uso principal |
|---|---|
| `politicos` | Busca, perfil, painel, admin |
| `partidos` | Busca, perfil, partidos, composicoes |
| `votacoes` | Home, perfil, painel, Camara |
| `gastos` | Perfil, painel, Camara, partidos |
| `presenca` | Perfil |
| `emendas` | Perfil, estado, admin match |
| `perfis` | Identidade interna e RBAC |
| `acompanhamentos` | Follow/unfollow e painel |
| `proposicoes` | Projetos, Camara, proposicoes app |
| `proposicao_autores` | Detalhe de projetos |
| `proposicao_tramitacoes` | Timeline de projetos |
| `feature_flags` | Admin flags |
| `admin_logs` | Auditoria admin |
| `analytics_eventos` | Eventos de analytics |
| `glossario` | Glossario e tooltip |
| `candidatos` | Candidatos 2026 |
| `estados_*` | Paginas de estados |
| `ale_*` | Assembleias estaduais |
| `politico_resumos_ia*` | Resumos interpretativos e cotas |

Pre-flight ativo do banco nao foi executado no inventario de 2026-06-02 porque `app/.env.local` indicava host remoto/desconhecido. A regra P0 proibe conexoes ativas contra banco remoto ou producao sem confirmacao segura.

## ETL

Scripts Python em `etl/` coletam e carregam dados oficiais:

| Pasta | Fonte/funcao |
|---|---|
| `etl/camara` | Deputados, votacoes, gastos, proposicoes e tramitacoes da Camara |
| `etl/senado` | Senadores, votacoes e gastos do Senado |
| `etl/tse` | Eleitos 2022 e candidatos 2026 |
| `etl/ale` | Assembleias legislativas estaduais |
| `etl/ibge` | Municipios e estados |
| `etl/portal_transparencia` | Emendas e SIAFI |
| `etl/partidos` | Informacoes e fundos partidarios |
| `etl/ia` | Simplificacao de proposicoes com OpenAI |
| `etl/estados` | Governos e tribunais estaduais |
| `etl/stn` | Pacto federativo |

O admin registra solicitacao de ETL em `admin_logs`, mas o endpoint atual ainda informa que o trigger manual via SSH esta em breve. Isso e gap de readiness.

## Principios De Produto

- Neutralidade politica: o produto nao recomenda, ranqueia moralmente ou endossa politicos.
- Rastreabilidade: informacoes devem vir de fonte oficial ou ser marcadas como pendentes.
- Linguagem simples: IA pode traduzir juridiquês, mas nao deve substituir a fonte.
- LGPD: dados pessoais devem ser minimizados; credenciais nunca devem entrar em docs.
- Codigo vence documentacao: qualquer divergencia deve ser registrada como gap.

## Estado De Lancamento

Resumo executivo:

| Area | Status |
|---|---|
| Produto | MVP identificavel, mas com placeholders e fluxos incompletos |
| Auth | Logto implementado em codigo; runtime precisa validacao completa |
| Banco | Schema amplo e uso real; pre-flight remoto abortado por seguranca |
| Pagamentos | Criacao de link real; webhook sem persistencia |
| Admin | Parcialmente operacional; ETL trigger incompleto |
| Seguranca | Risco P0 por segredo em documento legado |
| Observabilidade | Analytics interno existe, mas sem pipeline robusto confirmado |

Ver detalhes em [docs/PRODUCAO_READINESS.md](docs/PRODUCAO_READINESS.md).

