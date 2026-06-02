---
file: docs/MODERNIZATION_ROADMAP.md
module: Modernization Roadmap
status: Active
related: [docs/TODO_PRODUCTION.md, docs/GAP_ANALYSIS.md, docs/ARCHITECTURE.md, docs/DESIGN.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md]
---

# Roadmap de Retomada — Meus Políticos

**Situação em:** 2026-05-29
**Branch:** `feat/redesign-2026`
**Estado atual:** plataforma funcional com redesign aplicado, aguardando resolução de gaps antes de go-live público.
**Atualização junho/2026:** Stripe foi removido do runtime; InfinitePay é o fluxo ativo de apoio.

---

## Contexto estratégico

O redesign-2026 entregou:
- Nova identidade visual (header, footer, home)
- Módulos de estado (`/estado/[sigla]`) e assembleias estaduais
- Candidatos 2026 (`/candidatos-2026`) com integração TSE
- ETL de proposições (57k) e emendas (16.6k)
- Schema v2.12 com ALE, resumos IA, partidos e estados

O que **falta para o go-live** está detalhado em `docs/TODO_PRODUCTION.md`. Este documento trata do que vem **depois** do lançamento.

> modernizacao aprovada. O plano operacional esta em
> `docs/auth/AUTH_MIGRATION_LOGTO.md`; a decisao arquitetural esta em
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

---

## Fase 0 — Prontidão para Lançamento

**Objetivo:** resolver todos os gaps P0 e P1 bloqueantes antes do go-live público.
**Duração estimada:** 1–2 semanas
**Branch:** `feat/redesign-2026` → merge em `main`

### Sprint 0A — Dados e infraestrutura (3–5 dias)

| Tarefa | Gap | Esforço |
|---|---|---|
| Atualizar `.env.example` com 30+ variáveis | G-01 | 30 min |
| Criar tabela `doacoes` + migration | G-02/G-03 pré-req | 1h |
| Implementar INSERT no webhook InfinitePay | G-03 | 1h |
| Re-rodar ETL senadores (mandato_inicio) | G-08 | 2h |
| Executar populate_siafi.py | G-09 | 1h |
| Gastos Câmara 2026 | G-07 | 1 dia |
| Corrigir `href="#"` no candidatos-2026 | G-05 | 2h |

### Sprint 0B — Automação e observabilidade (2–3 dias)

| Tarefa | Gap | Esforço |
|---|---|---|
| Criar 3 GitHub Actions workflows de ETL | G-04 | 1 dia |
| Criar CI workflow (lint + typecheck) | G-04 | 1h |
| Instalar Sentry no Next.js | G-14 | 30 min |
| Configurar UptimeRobot para 3 domínios | G-14 | 15 min |
| Commitar `app/public/partidos/` | G-15 | 30 min |
| Commitar `etl/ale/` + validar status no banco | G-13 | 1 dia |

### Sprint 0C — Segurança e go-live (1–2 dias)

| Tarefa | Gap | Esforço |
|---|---|---|
| Adicionar HTTP Security Headers no next.config.ts | — | 2h |
| Consolidar fluxo de apoio em InfinitePay | — | 1h |
| Validar webhook InfinitePay em produção | — | 30 min |
| Teste end-to-end: doação real R$5 → registro no banco | — | 1h |
| Setup mínimo Vitest + 3 testes críticos | G-06 | 2h |
| Merge `feat/redesign-2026` → `main` | — | — |
| **Deploy e verificação em produção** | — | 2h |

---

## Fase 1 — Consolidação de Dados (Meses 1–2)

**Objetivo:** garantir que todos os políticos têm dados completos e frescos. Scores saindo de `"–"` para valores reais.

### Sprint 1.1 — Presença parlamentar

| Tarefa | Detalhes |
|---|---|
| Criar `etl/camara/collect_presenca.py` | Coleta de sessões via `GET /deputados/{id}/eventos` (Câmara API) |
| Calcular `presenca_pct_atual` para todos os dep. federais | Popula campo `presenca_pct_atual` em `politicos` |
| Calcular `presenca_pct_historico` por legislatura | JSON por ano em campo JSONB |
| Implementar score de presença em `ScoreRow.tsx` | Conforme metodologia `docs/METRICS.md` |
| Criar ETL de presença do Senado | `senado_sessoes` + `senado_discursos` → cálculo equivalente |

**Resultado esperado:** todos os 513 deputados federais e 81 senadores com `presenca_pct_atual` preenchido. ScoreRow exibindo valores reais, não `"–"`.

### Sprint 1.2 — Atividade Legislativa Simplificada (LES)

| Tarefa | Detalhes |
|---|---|
| Calcular LES para dep. federais | Fórmula em `docs/METRICS.md` — usa votações + presença + discursos |
| Criar job de recálculo periódico | Executa após cada ETL de votações |
| Implementar benchmark por UF/partido | LES do político vs. média do peer group |

### Sprint 1.3 — Gastos e emendas completos

| Tarefa | Detalhes |
|---|---|
| Validar gastos Câmara 2022–2026 completos | `SELECT EXTRACT(YEAR FROM data), COUNT(*) FROM gastos WHERE source_id = 'camara_ceap' GROUP BY 1` |
| Gastos Senado 2023–2026 | `select_id = 'senado_ceaps'` — verificar lacunas |
| Emendas — validar cruzamento SIAFI ≥ 90% | `SELECT COUNT(*) FROM emendas WHERE politico_id IS NULL` |

---

## Fase 2 — Novos Módulos (Meses 2–4)

**Objetivo:** expandir cobertura temática — partidos, alinhamento de bancada, módulo de municípios.

### Sprint 2.1 — Módulo de Partidos

Wireframes aprovados: `app_partidos_page.tsx` (índice geral) + `app_partidos_sigla_page.tsx` (perfil do partido).

| Tarefa | Rota |
|---|---|
| Criar `/partidos` — listagem com filtros (ideologia, tamanho, bancada) | `(site)/partidos/page.tsx` |
| Criar `/partidos/[sigla]` — perfil com votações por tema, composição da bancada | `(site)/partidos/[sigla]/page.tsx` |
| Criar `/partidos/[sigla]/parlamentares` — lista de membros | `(site)/partidos/[sigla]/parlamentares/page.tsx` |
| ETL de atualizações de filiação | `etl/tse/collect_filiados.py` |
| Calcular score de alinhamento de bancada | Conforme `docs/METRICS.md` |

> **Nota:** a ARCHITECTURE.md lista rotas `/partidos` e `/partidos/[sigla]` como "✅ Ativo (novo)" — verificar o estado real antes de criar páginas.

### Sprint 2.2 — Módulo de Municípios

| Tarefa | Rota |
|---|---|
| Página de detalhe de município | `/municipio/[ibge]` |
| Emendas direcionadas ao município | Integração com `v_emendas_municipio` |
| Ranking de emendas por município | Integração com `v_ranking_emendas` |
| Prefeito e câmara municipal (quando disponível) | Fase 2b |

### Sprint 2.3 — Transparência por UF — ALEs

| Tarefa | Detalhes |
|---|---|
| Validar dados de ALESP, ALEP, ALMG, ALMT, CLDF no banco | Verificar `ale_sessoes` e `ale_presencas` |
| Ativar exibição de presença para dep. estaduais | `v_presenca_deputado_estadual` já existe |
| ETL das demais 22 assembleias | Pesquisar suporte SAPL ou APIs próprias |
| Página `/estado/[sigla]/assembleia` completa | Dados de votos, gastos, presença do dep. estadual |

---

## Fase 3 — Plataforma de IA (Meses 3–6)

**Objetivo:** automação de resumos, pipeline IA robusto, cache inteligente.

### Sprint 3.1 — Juridiquês → Linguagem cidadã

| Tarefa | Detalhes |
|---|---|
| Processar `votacoes.descricao_simples` pendentes | `SELECT COUNT(*) FROM votacoes WHERE descricao_simples IS NULL AND ia_processado IS FALSE` |
| Processar `proposicoes.ementa_simples` pendentes | ~57k proposições — processamento em batch |
| Implementar fila de processamento | Usar `fila_ia_pendente` view + job diário |
| Calcular custo mensal de IA | Estimativa: 57k × 300 tokens ≈ 17M tokens |

### Sprint 3.2 — Resumos de candidatos 2026

| Tarefa | Detalhes |
|---|---|
| Processar `candidatos.proposta_resumo` | Extrair 5 tópicos do PDF da proposta TSE |
| Pipeline de coleta do PDF + extração de texto | `etl/tse/collect_propostas.py` |
| Cache via `politico_resumos_ia` | Hash dos dados → regenera só quando muda |
| Exibir no perfil do candidato com badge "IA" obrigatório | `docs/DESIGN.md §6.4` |

### Sprint 3.3 — Resumos interpretativos de perfis

| Tarefa | Detalhes |
|---|---|
| Implementar geração de `politico_resumos_ia.conteudo_json` | Sumariza votações, gastos e presença em linguagem cidadã |
| Respeitar `politico_resumos_ia_cotas` | Max `IA_RESUMO_MAX_GERACOES_DIA` (default 3) por político/dia |
| Cache com invalidação por `hash_dados` | Regenera automaticamente quando dados mudam |

---

## Fase 4 — Suite de Inteligência (Meses 4–8)

**Objetivo:** app analítico (`app.meuspoliticos.com.br`) com features avançadas para imprensa e pesquisadores.

26 wireframes em `gap` apontam para este produto. Todos vivem no route group `(app)/`.

### Módulos planejados

| Módulo | Wireframes | Rota |
|---|---|---|
| Busca avançada com filtros semânticos | 3 wireframes | `(app)/app-busca` (expandir) |
| Dossier do parlamentar | 1 wireframe | `(app)/politicos/[id]/dossier` |
| Explorador de legislação | 1 wireframe | `(app)/legislacao` |
| Home analítica com intelligence feed | 2 wireframes | `(app)/home` (expandir) |
| Matriz de confronto (comparar posições) | 1 wireframe | `(app)/confronto` |
| Monitoramento de alertas | 1 wireframe | `(app)/alertas` |
| Perfil de analista (acesso premium) | 2 wireframes | `(app)/(auth)/cadastro-analista` |

### Modelo de acesso

| Nível | Features | Acesso |
|---|---|---|
| Cidadão | Site público completo | Gratuito |
| Apoiador | App analítico básico | Doação (qualquer valor) |
| Analista | Suite completa + exportações | Mensalidade |

---

## Fase 5 — Escalabilidade e Observabilidade (Contínuo)

### Infraestrutura

| Item | Quando |
|---|---|
| Avaliar Turborepo para orquestração de build (G-11) | Quando houver >2 packages no monorepo |
| CDN para assets estáticos do MinIO | Quando storage crescer |
| Read replica para queries analíticas pesadas | Quando latência de DB > 200ms |

### Testes e CI (Gap G-06)

| Sprint | Meta |
|---|---|
| Fase 0 (go-live) | Vitest setup + 3 testes críticos |
| Fase 1 | Cobertura das funções de cálculo de métricas ≥ 80% |
| Fase 2 | Testes E2E com Playwright — 5 golden paths |
| Fase 3 | Cobertura de API routes ≥ 70% |
| Fase 4 | CI verde obrigatório para merge em `main` |

### Monitoramento (Gap G-14)

| Item | Quando |
|---|---|
| Sentry — erros runtime | Sprint 0B (imediato) |
| UptimeRobot | Sprint 0B (imediato) |
| Alerta de ETL atrasado (query em `coletas_log`) | Fase 1 |
| Performance de queries (pg_stat_statements) | Fase 2 |
| Dashboard operacional público (`/status`) | Fase 2 |

---

## Métricas de sucesso por fase

| Fase | Métrica | Meta |
|---|---|---|
| Fase 0 | Doações registradas no banco | 100% dos pagamentos |
| Fase 0 | Uptime | ≥ 99% medido pelo UptimeRobot |
| Fase 1 | Políticos com presença calculada | 100% (dep. federais + senadores) |
| Fase 1 | Scores exibindo valor real (não "–") | ≥ 90% dos perfis |
| Fase 2 | UFs com dados de dep. estaduais | ≥ 5 UFs (ALESP, ALEP, ALMG, ALMT, CLDF) |
| Fase 3 | Votações com `descricao_simples` preenchida | ≥ 80% |
| Fase 3 | Candidatos com `proposta_resumo` gerada | 100% dos com proposta no TSE |
| Fase 4 | MAU no app analítico | — (definir ao lançar) |

---

## Decisões arquiteturais pendentes

Estas decisões precisam ser tomadas **antes** de implementar as features relacionadas:

| Decisão | Opções | Impacto |
|---|---|---|
| **Pagamentos ativos** | Stripe ou InfinitePay? | InfinitePay permanece ativo; Stripe foi removido |
| **Modelo de acesso ao app analítico** | Free / donate-to-access / subscription | Define todo o fluxo de autenticação e payment do (app)/ |
| **ETL automático: GitHub Actions vs. Coolify cron** | GH Actions (mais simples) vs. job no próprio Coolify | GitHub Actions preferível — CI/CD já na plataforma |
| **Turborepo** | Adotar agora ou depois | Só faz sentido com ≥2 packages no workspace — adiar |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
