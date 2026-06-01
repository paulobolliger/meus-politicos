# Changelog — Meus Políticos

Histórico de versões e marcos do projeto.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [2026-06] - Migração PostgreSQL + Logto + Stripe Removal

### Added / Adicionado
- `docs/migrations/2026-06-postgres-logto-migration.md` como cronologia oficial das últimas sprints
- `docs/PROJECT_STATUS_2026-06.md` como status executivo da plataforma
- Atualização da documentação principal para refletir PostgreSQL VPS ativo, Supabase legado, Logto em preparação e InfinitePay ativo

### Sprint 0R - Auditoria Banco Real
- Confirmação do banco correto `meuspoliticos_db`
- Identificação do usuário auditado `noro_master`
- Registro do volume total auditado em 587.63 MB
- Inventário dos schemas Supabase e das dependências legadas

### Sprint 1B - Compatibilidade Logto
- Criação da migration `20260601000000_logto_identity_compat.sql`
- Inclusão de `logto_sub`, `supabase_user_id`, `auth_provider` e `migrado_logto_em`
- Criação dos índices parciais de compatibilidade

### Sprint 1F - Ajustes de Compatibilidade
- Abandono da estratégia de `email_normalizado`
- Reconciliação temporária via `auth.users.email` e join legado

### Sprint 1G - Aplicação da Migration
- Backup prévio
- Aplicação da migration
- Validação dos índices e da preservação do legado Supabase

### Sprint 1H-A - Migração das Rotas Públicas
- Home, busca e `estado/[sigla]` passaram a ler PostgreSQL direto
- Supabase saiu do caminho runtime do site público

### Sprint 1H-B - Migração de `politicos/[id]`
- Remoção de `auth.getUser` do fluxo público
- Remoção dos acompanhamentos do caminho dessa rota
- A rota passou a consultar PostgreSQL direto

### Sprint 1I-A - Migração Pública Final
- `proposicoes`, `comparar`, `cidades` e `glossario` migrados para PostgreSQL direto
- Consolidação do site público sem dependência runtime do Supabase para leitura

### Stripe Removal
- Stripe removido do runtime
- Dependências Stripe removidas do app
- `STRIPE_*` removidas do template de ambiente
- Fluxo ativo mantido em InfinitePay

---

## [Unreleased / Não lançado] — branch `feat/redesign-2026`

### Added / Adicionado
- Documento `docs/auth/AUTH_MIGRATION_LOGTO.md`
- ADR `docs/adr/ADR-001-logto-as-identity-provider.md`
- Redesign completo de header, footer e home page (site público) com nova identidade 2026
- Refactor do layout hero, seções e mapa interativo do Brasil
- Redesign de `/projetos/[slug]` seguindo wireframe aprovado
- Redesign de `/busca`, `/meu-estado` e `/projetos`
- Documentação técnica completa em `docs/` (Auditoria v2.1):
  - `ARCHITECTURE.md`, `DATABASE.md`, `AUTH.md`, `BUSINESS_DOMAIN.md`
  - `ENVIRONMENT.md`, `DEPLOYMENT.md`, `MONOREPO.md`
  - `SECURITY.md`, `DEPENDENCIES.md`, `MONITORING.md`
  - `API.md`, `INTEGRATIONS.md`, `ADMIN.md`
  - `TESTING.md`, `DESIGN.md`
  - `TODO_PRODUCTION.md`, `MODERNIZATION_ROADMAP.md`
  - `GAP_ANALYSIS.md` com 19 gaps catalogados

### Corrigido
- Layout de `/projetos/[slug]` espelhando wireframe aprovado

---

## [0.7.0] — Redesign 2026 (inicial)

### Adicionado
- Nova identidade visual: header redesenhado com novo logotipo e navegação
- Footer público com links institucionais e botão "Apoie"
- Home page v3: hero navy, pills de cargos, busca e CEP, grid de cargos, feed de votações, destaque da semana

---

## [0.6.0] — Infraestrutura de produção e autenticação

### Adicionado
- Migração para Supabase self-hosted (VPS Vultr via Coolify + Docker)
- OAuth Google e LinkedIn integrados ao Supabase Auth
- OAuth Twitter/X
- Trigger `handle_new_user()` para criar perfil automaticamente no cadastro (extrai nome do OAuth ou email)
- Painel admin: página de usuários, match manual de emendas via `/api/admin/emendas/match`
- Schema v2.12: campos `uf_nascimento`, `sexo`, `data_falecimento`, campos de gabinete em `politicos`
- ETL de auditoria e migrations idempotentes (IF NOT EXISTS + DO blocks)
- MCP Postgres integrado ao painel admin

### Corrigido
- ETL Senado: path do `.env.local` e uso de `POSTGRES_HOST`/`POSTGRES_PORT` com tunnel SSH
- ETL Emendas, municípios, gastos Câmara: melhorias de robustez
- Migrations: tornar todas as 5 migrations de auditoria idempotentes
- `populate_siafi.py`: script criado para cruzar políticos com códigos SIAFI

---

## [0.5.0] — Terminal Cívico (Design System)

### Adicionado
- Design system "Terminal Cívico": tokens CSS, tipografia, componentes atômicos em `globals.css`
- `SiteHeader`, `AppHeader`, `SiteFooter`, `AppFooter` com novo visual
- Home Cidadão: hero, 3 perguntas, mapa interativo, como funciona, CTA
- Home App: hero analítico, acesso ao terminal de dados
- `/busca`: tabela densa com visual terminal cívico
- `/meu-estado`: visual terminal cívico com geolocalização automática por CEP
- Painel `/painel`: visual terminal cívico com sidebar desktop
- Páginas de autenticação: visual terminal cívico (login, cadastro, recuperar senha)
- Páginas institucionais: tokens terminal cívico em sobre, fontes, manifesto, metodologia
- Páginas legais redesenhadas: privacidade, termos de uso
- Páginas de sistema: 404, error

### Corrigido
- Unificação de rotas `/politico` → `/politicos` em todo o projeto
- Acentos na home cidadão

---

## [0.4.0] — IA e Resumos Interpretativos

### Adicionado
- Resumo interpretativo de perfil do político via OpenAI (juridiquês → linguagem cidadã)
- Cache de resumos em `politico_resumos_ia` com `hash_dados` (regenera apenas quando dados mudam)
- Cota diária por político (`politico_resumos_ia_cotas`) — default: 3 gerações/dia
- Toggle Cidadão/Analista no perfil do político — alterna entre linguagem simples e técnica
- Schema: tabelas `politico_resumos_ia` e `politico_resumos_ia_cotas` com RLS admin-only

---

## [0.3.0] — Dashboard V2 e ETL

### Adicionado
- Dashboard V2 com dados reais: presença, gastos, gabinete, redes sociais
- Bento grid V2: remove labels ETL, expande seção de gabinete, substitui abas por seções inline
- Scores com placeholders ETL documentados (presença_pct, LES, alinhamento de bancada)
- ScoreRow: componente de exibição de métricas com benchmark visual
- ETL deputados completo: gabinete, sexo, naturalidade, mandato
- ETL votações bulk: 378.695 votos (2023–2025)
- ETL gastos CEAP Câmara: ~527k registros (2022–2025)
- ETL gastos CEAP Senado: ~40k registros (2023–2026)
- ETL emendas parlamentares: ~16.6k registros via Portal da Transparência/SIAFI
- ETL proposições: ~57k proposições da Câmara
- ETL senadores: 81 senadores com dados completos
- ETL municípios via IBGE: municípios com código IBGE e UF
- ETL STN/SICONFI: dados fiscais (FPE) via RREO Anexo 3
- Tabelas de estados econômicos (IBGE 2022/2023) e governos em migrations
- Suporte a Vercel: binários Tailwind oxide linux instalados via `installCommand`

### Corrigido
- ScoreRow: converter `value` para Number antes de `toFixed`
- Vercel: output directory, turbopack root, instalação de binários linux
- Fonts: migrar para Inter em tudo — remover Fraunces serif
- ETL STN: migrar coleta FPE para SICONFI RREO Anexo 3 (URL STN migrada)

---

## [0.2.0] — MVP do site público

### Adicionado
- Página de perfil do político (`/politicos/[id]`): votações com filtros de tema, gastos por categoria, presença com gráfico mensal
- Página de busca (`/busca`): filtros por cargo, UF, partido; paginação; ordenação por relevância/presença/gastos
- Quem me representa (`/meu-estado`): busca por CEP via ViaCEP; lista de representantes por nível (Federal, Estadual, Municipal)
- Geolocalização automática no Quem me representa
- Login e cadastro com Supabase Auth (e-mail + senha)
- Páginas de sistema e autenticação padronizadas: `/acesso-negado`, `/indisponivel`, `/manutencao`, `/confirmacao`
- Página de recuperação de senha
- Identidade visual institucional inicial (logotipo, cores, tipografia)
- Páginas legais: privacidade, termos de uso (conteúdo jurídico redigido)
- Login com X (Twitter) OAuth

### Corrigido
- Contagem de governadores
- Links internos entre páginas institucionais
- Rotas de termos e privacidade em português + email de contato correto

---

## [0.1.0] — Setup inicial

### Adicionado
- Estrutura inicial do monorepo (`npm workspaces: ["app"]`)
- Next.js 16 App Router com route groups: `(site)/`, `(app)/`, `(painel)/`, `(admin)/`, `(auth)/`
- Middleware de subdomínio (`proxy.ts`): roteamento por header `Host` para site, app e painel
- Clientes Supabase configurados: browser (`createBrowserClient`), server (`createServerClient`), admin (`createAdminClient`)
- Cookie cross-subdomain: `Domain=.meuspoliticos.com.br` em produção / `localhost` em dev
- Componentes shadcn/ui integrados
- Layout base: SiteHeader, SiteFooter
- Home page v1: hero, busca por nome, grid de cargos, stats da plataforma
- `vercel.json` configurado com `installCommand` e `buildCommand` para monorepo
- Turbopack configurado com root apontando para raiz do monorepo
- `loadEnvConfig` carregando `.env.local` do diretório pai no `next.config.ts`

---

*Mantido por: NORO GURU LTDA · CNPJ 63.429.497/0001-88*
*Formato: Keep a Changelog · Versionamento: Semântico (semver)*
