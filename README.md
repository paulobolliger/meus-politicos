---
file: README.md
module: Project Overview
status: Active
related: [docs/ARCHITECTURE.md, docs/GAP_ANALYSIS.md, docs/DATABASE.md, docs/ENVIRONMENT.md]
---

# Meus Políticos

> **"Transparência para decidir melhor."**
> O sistema operacional da cidadania política brasileira.

> **Nota de arquitetura de identidade:** a stack atual ainda documenta
> Supabase Auth em alguns pontos, mas a decisão aprovada é migrar para Logto
> como provedor de identidade. Ver `docs/auth/AUTH_MIGRATION_LOGTO.md`,
> `docs/adr/ADR-001-logto-as-identity-provider.md` e
> `docs/PROJECT_STATUS_2026-06.md`.

## Status Atual da Plataforma

Banco:

- PostgreSQL VPS ativo

Auth:

- Supabase legado
- Logto em preparação

Público:

- Migrado para PostgreSQL direto

Painel/Admin:

- Aguardando Logto

Pagamentos:

- Stripe removido
- InfinitePay ativo

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)](https://meuspoliticos.com.br)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%2B%20PostgreSQL%20VPS%20%2B%20Logto-blue)](https://meuspoliticos.com.br)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](LICENSE)

Plataforma brasileira de transparência política. Centralizamos dados públicos sobre políticos brasileiros — do presidente ao vereador — em um só lugar, com linguagem acessível, sem editoriais, sem opinião.

**Empresa:** NORO GURU (NORO Tecnologia e Turismo Ltda · CNPJ 63.429.497/0001-88)

---

## Documentação técnica

| Documento | Conteúdo |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura, subdomínios, roteamento, fluxo de dados |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema v2.12, tabelas, relacionamentos, RLS |
| [docs/AUTH.md](docs/AUTH.md) | Autenticação, OAuth, proteção de rotas |
| [docs/PROJECT_STATUS_2026-06.md](docs/PROJECT_STATUS_2026-06.md) | Status executivo atual da plataforma |
| [docs/migrations/2026-06-postgres-logto-migration.md](docs/migrations/2026-06-postgres-logto-migration.md) | Cronologia oficial da migração PostgreSQL + Logto |
| [docs/API.md](docs/API.md) | Endpoints internos e contratos de integração |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Todas as variáveis de ambiente (30+) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy Vercel, CI/CD, scripts operacionais |
| [docs/SECURITY.md](docs/SECURITY.md) | Segurança, RLS, auditoria de segredos |
| [docs/GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md) | Backlog técnico, gaps e pendências |
| [docs/MODERNIZATION_ROADMAP.md](docs/MODERNIZATION_ROADMAP.md) | Roadmap de retomada e sprints |

**Documentos de domínio de negócio (fonte oficial):**

| Documento | Conteúdo |
|---|---|
| [docs/meuspoliticos_master.md](docs/meuspoliticos_master.md) | Visão de produto, roadmap, regras de negócio (v2.0) |
| [docs/data_source_master.md](docs/data_source_master.md) | Arquitetura de dados, APIs, ETL (v2.0) |
| [docs/METRICS.md](docs/METRICS.md) | Metodologia de scores e exibição de métricas |
| [docs/BACKOFFICE_DATA_CONTRACT.md](docs/BACKOFFICE_DATA_CONTRACT.md) | Contrato de dados do perfil do político |
| [docs/design/wireframes.md](docs/design/wireframes.md) | Wireframes de todas as telas |
| [docs/design/branding.md](docs/design/branding.md) | Identidade visual e manifesto de marca |

---

## Stack

| Camada | Tecnologia | Versão/Detalhe |
|---|---|---|
| Frontend | Next.js + TypeScript | 16.2.6 |
| UI | Tailwind CSS v4 + shadcn/ui | v4 |
| Banco de dados | PostgreSQL VPS | Schema v2.12 + compat Logto |
| Autenticação | Supabase Auth legado + Logto em preparação | — |
| Coleta de dados | Python + scripts ETL | 3.10+ |
| Deploy frontend | Vercel | `vercel.json` na raiz |
| Infra banco | VPS Vultr via Coolify + Docker | `45.32.169.173` |
| E-mail transacional | Resend | Free — 3k e-mails/mês |
| Pagamentos | InfinitePay | Stripe removido |
| IA | OpenAI API | Tradução de juridiquês |

---

## Pré-requisitos

- **Node.js 20+** (LTS recomendado — `@types/node ^20`)
- **Python 3.10+** (para scripts ETL)
- SSH tunnel ativo para acesso local ao banco de produção (ver seção ETL)
- Acesso às credenciais em `.env.local` (solicitar ao responsável do projeto)

---

## Setup local — Frontend

### 1. Clone o repositório

```bash
git clone https://github.com/paulobolliger/meuspoliticos.git
cd meuspoliticos
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example app/.env.local
```

Preencha `app/.env.local` com os valores reais. Variáveis mínimas para rodar em dev:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.meuspoliticos.com.br
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ver gerenciador de senhas>
SUPABASE_SERVICE_ROLE_KEY=<ver gerenciador de senhas>
SUPABASE_URL=https://supabase.meuspoliticos.com.br

# URLs dos subdomínios (dev local)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://painel.localhost:3000
```

Para a lista completa das 30+ variáveis, ver [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

### 4. Configure roteamento por subdomínio

Adicione ao arquivo de hosts do sistema:

| OS | Arquivo |
|---|---|
| Windows | `C:\Windows\System32\drivers\etc\hosts` |
| Linux / macOS | `/etc/hosts` |

```
127.0.0.1 app.localhost
127.0.0.1 painel.localhost
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

| URL | Produto |
|---|---|
| `http://localhost:3000` | Site público |
| `http://app.localhost:3000` | App analítico |
| `http://painel.localhost:3000` | Painel do usuário |

---

## Scripts disponíveis

| Script | Comando real | Descrição |
|---|---|---|
| `npm run dev` | `next dev` (em `app/`) | Servidor de desenvolvimento |
| `npm run build` | `next build` (em `app/`) | Build de produção |
| `npm run start` | `next start` (em `app/`) | Servidor de produção |
| `npm run lint` | `eslint` (em `app/`) | Verificação de lint |

---

## Estrutura do projeto

```
meuspoliticos/
├── app/                          # Next.js 16 — frontend principal
│   └── src/
│       ├── app/
│       │   ├── (site)/           # Site público — meuspoliticos.com.br
│       │   ├── (app)/            # App analítico — app.meuspoliticos.com.br
│       │   ├── (painel)/         # Painel autenticado — painel.meuspoliticos.com.br
│       │   │   ├── (auth)/       # Login, cadastro, recuperar senha
│       │   │   └── (dashboard)/  # /painel, /meus-politicos
│       │   ├── (admin)/          # Painel interno — /admin (role: admin)
│       │   ├── (checkout)/       # Fluxo de doação/pagamento
│       │   ├── (auth)/           # Callback OAuth Supabase
│       │   └── api/              # Route Handlers (webhooks, busca, etc.)
│       ├── components/
│       │   ├── civic/            # Biblioteca cívica reutilizável
│       │   ├── site/             # Componentes do site público
│       │   ├── politico-v2/      # Perfil do político (app analítico)
│       │   └── ui/               # shadcn/ui base
│       ├── lib/supabase/         # client.ts · server.ts · middleware.ts · types.ts
│       └── proxy.ts              # Middleware de roteamento por host
├── etl/                          # Scripts Python de coleta de dados
│   ├── camara/                   # Câmara dos Deputados (deputados, votações, gastos, proposições)
│   ├── senado/                   # Senado Federal (senadores, votações, gastos)
│   ├── tse/                      # TSE — eleitos 2022 e candidatos 2026
│   ├── ale/                      # Assembleias Legislativas Estaduais
│   ├── ibge/                     # Municípios e estados
│   ├── portal_transparencia/     # CGU — emendas parlamentares
│   ├── partidos/                 # Dados de partidos e fundos
│   ├── ia/                       # Processamento com OpenAI
│   ├── estados/                  # Governos e tribunais estaduais
│   └── stn/                      # Secretaria do Tesouro Nacional
├── supabase/
│   ├── migrations/               # 20+ migrations — schema atual v2.12
│   ├── seeds/                    # Seeds de glossário e dados fixos
│   └── 001_schema.sql            # Schema monolítico legado (referência histórica)
├── docs/                         # Documentação técnica e de negócio
│   ├── design/                   # Wireframes e identidade visual
│   └── archive/                  # Documentos obsoletos e artefatos históricos
├── .env.example                  # Template de variáveis de ambiente
├── vercel.json                   # Configuração de deploy na Vercel
└── requirements.txt              # Dependências Python para ETL
```

---

## ETL — Coleta de dados

Scripts Python em `etl/` se conectam ao PostgreSQL via SSH tunnel ou rede interna do VPS.

### Tunnel SSH (desenvolvimento local)

```bash
ssh -L 5433:10.0.2.2:5432 root@45.32.169.173 -N -o ServerAliveInterval=30
```

Mapeia o banco remoto para `localhost:5433`.

### Rodar um script

```bash
cd etl/camara
# Ativar .venv da raiz ou instalar dependências
pip install -r ../../requirements.txt
python collect_deputados.py
```

**Status dos dados coletados** (atualizar após cada ETL): ver [app/CLAUDE.md](app/CLAUDE.md).

**Documentação completa de fontes e APIs**: ver [docs/data_source_master.md](docs/data_source_master.md).

---

## Schema do banco

20+ migrations em `supabase/migrations/` — versão atual: **v2.12** (maio/2026).

Documentação completa em [docs/DATABASE.md](docs/DATABASE.md).

**Enums principais:** `cargo_tipo`, `voto_tipo`, `dado_estado`, `impacto_nivel`, `situacao_candidato`

**Tabelas centrais:**

| Tabela | Descrição |
|---|---|
| `politicos` | Hub central — 513 dep. federais + 81 senadores + 27 gov. + 1.059 dep. estaduais |
| `partidos` | Partidos políticos com histórico |
| `politico_partidos` | Histórico de migrações partidárias |
| `votacoes` | Votações nominais com voto individual |
| `gastos` | Cota parlamentar (CEAP/CEAPS) |
| `proposicoes` | Projetos de lei, PECs, MPs (~57k) |
| `emendas` | Emendas parlamentares (Portal da Transparência) |
| `candidatos` | Candidatos 2026 (TSE) |
| `senadores` + 7 tabelas `senado_*` | Dados do Senado Federal (Fase 2) |
| `estados` | Assembleias e governos estaduais |
| `glossario` | Glossário cívico com seeds |
| `perfis` | Usuários autenticados |
| `acompanhamentos` | Políticos acompanhados por usuário |
| `feed_eventos` | Feed de atividades dos políticos |
| `coletas_log` | Log de execução dos ETLs |
| `feature_flags` | Flags de features do sistema |

---

## Princípios

- **Sem opinião, sem ranking moral** — dados oficiais com rastreabilidade completa
- **Neutralidade política absoluta** — nenhum partido, candidato ou ideologia é favorecido
- **IA como facilitador, não árbitro** — resumos IA sempre rotulados; fonte original sempre acessível
- **LGPD** — CEP nunca persistido; CPF apenas no ETL, nunca no banco público
- **Filtro de decisão:** "Isso aumenta transparência ou só aumenta ruído?" — se não aumenta claramente, não entra

---

## Contato

- Site: [meuspoliticos.com.br](https://meuspoliticos.com.br)
- E-mail: contato@meuspoliticos.com.br

---

*meuspoliticos.com.br · NORO GURU · Campinas, SP · 2026*
