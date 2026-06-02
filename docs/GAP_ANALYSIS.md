---
file: docs/GAP_ANALYSIS.md
module: Gap Analysis & Technical Backlog
status: Active
related: [docs/MODERNIZATION_ROADMAP.md, docs/TODO_PRODUCTION.md, docs/SECURITY.md, docs/ARCHITECTURE.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md]
---

# GAP_ANALYSIS — Raio-X de Retomada

**Auditoria realizada em:** 2026-05-29
**Branch auditada:** `feat/redesign-2026`
**Análise baseada em:** arquivos estáticos locais — banco de produção NÃO consultado (Regra P0)
**Schema identificado:** v2.12 (migration mais recente: `20260523b_ale_setup.sql`)

> arquitetural conhecido. A decisao aprovada e migrar para Logto. Ver
> `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.
>
> Atualização junho/2026: Stripe foi removido do runtime. O gap G-02 passou a
> ser histórico; o fluxo ativo de apoio usa InfinitePay.

---

## Tabela Oficial de Backlog

| ID | Gap / Problema | Severidade | Arquivo(s) e Linhas | Impacto Técnico | Esforço Est. |
|---|---|---|---|---|---|
| G-01 | `.env.example` expõe apenas 6 de 30+ variáveis reais | **P0** | `.env.example` (raiz) | Bloqueio para novos devs e CI — ambiente impossível de configurar sem acesso ao `.env.local` real | 30 min |
| G-02 | Webhook Stripe removido do runtime | **Arquivado** | histórico | Fluxo Stripe não faz mais parte da aplicação ativa | — |
| G-03 | Webhook InfinitePay não persiste doação no banco | **P0** | `app/src/app/api/webhooks/infinitepay/route.ts:34` | Idem G-02 — fluxo de doação estruturalmente incompleto | 1h |
| G-04 | Nenhum GitHub Actions workflow existe | **P0** | `.github/` (diretório inexistente) | ETL documentado como "cron automatizado" mas depende 100% de execução manual — dados param sem intervenção humana | 1 dia |
| G-05 | `href="#"` em produção — links inativos no perfil de candidato 2026 | **P1** | `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx:168,329` | UX quebrada — usuário clica e nada acontece; sinaliza feature incompleta | 2h |
| G-06 | Zero cobertura de testes em todo o repositório | **P1** | Global | Sem garantia de regressão em qualquer alteração de código ou ETL | 3–5 sprints |
| G-07 | ETL gastos Câmara 2026 não executado | **P1** | `etl/camara/collect_camara_gastos.py` | Dados de CEAP 2026 ausentes — usuários veem gastos apenas até 2025 | 1 dia |
| G-08 | ETL senadores pendente (re-run para `mandato_inicio`) | **P1** | `etl/senado/collect_senadores.py` | 81 senadores sem campo `mandato_inicio` — informação errada no perfil | 2h |
| G-09 | `populate_siafi.py` pendente após novos senadores | **P1** | `etl/portal_transparencia/populate_siafi.py` | Emendas de senadores sem `politico_id` — cruzamento incompleto no banco | 1h |
| G-10 | Todos os scores de `METRICS.md` marcados "ETL pendente" | **P1** | `docs/METRICS.md` · `app/src/components/politico-v2/ScoreRow.tsx` | Presença, LES e alinhamento de bancada exibem `"–"` para todos os políticos | 1–2 sprints |
| G-11 | Monorepo sem orquestrador de build (sem Turbo) | **P2** | `package.json` (raiz) | Sem cache de build, sem pipeline estruturado — builds lentos; ausência documentada como Gap P2 (Regra 13 do MONOREPO) | 1 dia |
| G-12 | README raiz desatualizado | **P2** | `README.md` (raiz) | Referenciava `001_schema.sql` monolítico, .env com 6 vars, estrutura errada | ✅ Resolvido — Lote 1 |
| G-13 | `etl/ale/` não integrado formalmente ao pipeline | **P2** | `etl/ale/` (diretório não commitado) | ALESP, ALEP, ALMG, ALMT, CLDF coletadas sem documentação de status, sem validação de dados no banco | 1 dia |
| G-14 | Sem monitoramento de erros de runtime | **P2** | Global — sem Sentry, Datadog ou similar | Erros em produção não alertam a equipe — invisibilidade operacional total | 1 dia |
| G-15 | `app/public/partidos/` não rastreado pelo git | **P2** | `app/public/partidos/` (untracked) | Logos de partidos ausentes do repositório — risco de inconsistência entre ambientes | 30 min |
| G-16 | Artefato HTML de análise de banco na raiz | **P3** | `compare-NORO_*.html` (raiz) | Poluição da raiz do repositório | ✅ Arquivado — Lote 1 |
| G-17 | Sem `CHANGELOG.md` | **P3** | raiz | Sem histórico estruturado de versões | 30 min — Lote 8 |
| G-18 | `app/README.md` era boilerplate `create-next-app` | **P3** | `app/README.md` | Confundia novos colaboradores sem descrever o projeto real | ✅ Resolvido — Lote 1 |
| G-19 | Zero cobertura de File Banners nos arquivos core | **P3** | `app/src/app/` · `app/src/components/` · `app/src/lib/` | Sem cabeçalho de contexto para guiar agentes IA em edições futuras (Regra 11) | Incremental |

---

## Detalhamento por Severidade

### P0 — Críticos

#### G-01 · .env.example incompleto


**Consequência:** novo desenvolvedor ou pipeline de CI que use `.env.example` como base não consegue rodar o projeto — erros crípticos de autenticação e conexão.

**Ação:** atualizar `.env.example` com todas as chaves (apenas placeholders). Ver `docs/ENVIRONMENT.md` (Lote 3).

---

#### G-02 / G-03 · Webhooks de pagamento sem persistência

**Stripe:** removido do runtime e arquivado para auditoria.

**InfinitePay** (`app/src/app/api/webhooks/infinitepay/route.ts:34`):
```typescript
// TODO: registrar doação no banco de dados
```

**Consequência:** pagamentos são processados pelo gateway e confirmados ao usuário, mas **nenhum registro é criado no banco**. Sem histórico de apoiadores. Sem dados para relatórios de financiamento. Risco de compliance com LGPD (dados de transação sem armazenamento controlado).

**Ação:** criar tabela `doacoes` (verificar se existe no schema v2.12) e implementar `INSERT` nos handlers de webhook.

---

#### G-04 · Sem automação de ETL

**Situação:** `README.md`, `app/CLAUDE.md` e `docs/data_source_master.md` descrevem coletas via "GitHub Actions em cron diário". O diretório `.github/workflows/` **não existe**.

**Consequência:** todo ETL é manual. Sem desenvolvedor disponível → dados param de ser atualizados. Escalabilidade zero.

**Ação sugerida — workflows mínimos:**

| Workflow | Script(s) | Frequência |
|---|---|---|
| `collect-camara.yml` | `collect_deputados.py` + `collect_votacoes.py` + `collect_proposicoes.py` | Diário 6h |
| `collect-senado.yml` | `collect_senadores.py` + `collect_senado_votacoes.py` + `collect_senado_gastos.py` | Diário 6h |
| `collect-emendas.yml` | `collect_emendas.py` + `populate_siafi.py` | Diário 7h |
| `collect-ale.yml` | scripts `etl/ale/` | Semanal |

---

### P1 — Altos

#### G-05 · Links inativos em candidatos-2026

**Arquivo:** `app/src/app/(site)/candidatos-2026/[slug]/CandidatoPageClient.tsx`

- **Linha 168:** `<a href="#">` — link de ação não implementado
- **Linha 329:** `<a href="#">` — idem

**Ação:** mapear destino correto ou substituir por `<button>` com `onClick` apropriado, ou remover o link até implementação.

---

#### G-10 · Scores todos em placeholder

**Situação:** `docs/METRICS.md` define 3 scores (Presença, Atividade Legislativa, Alinhamento de Bancada). Todos marcados `⬜ ETL pendente`. Componente `ScoreRow.tsx` exibe `"–"` para todos os políticos.

**ETL necessário:** `collect_presenca.py` (sessões via `GET /deputados/{id}/eventos` — Câmara API). Não está em nenhum script ativo.

---

### P2 — Médios

#### G-13 · etl/ale/ — status desconhecido

**Situação:** `etl/ale/` contém scripts para ALESP (SP), ALEP (PR), ALMG (MG), ALMT (MT) e CLDF (DF), além de base SAPL genérica e `update_presenca_pct.py`. Todo o diretório está **não commitado** na branch `feat/redesign-2026`.

**Questões em aberto:**
- Quais assembleias já foram coletadas?
- Quantos deputados estaduais têm dados no banco além dos do TSE/2022?
- Os scripts já foram executados em produção?

**Ação:** verificar no banco (`SELECT cargo, COUNT(*) FROM politicos GROUP BY cargo`) e atualizar `app/CLAUDE.md` com o status.

---

### Divergências de Requisitos

#### README vs. Schema — Arquivo único vs. Migrations



**Resolução:** o schema atual está nas migrations. O `001_schema.sql` é histórico. README atualizado no Lote 1.

---

## Histórico de Resolução

| ID | Gap | Status | Lote | Data |
|---|---|---|---|---|
| G-12 | README raiz desatualizado | ✅ Resolvido | Lote 1 | 2026-05-29 |
| G-16 | Artefato HTML na raiz | ✅ Arquivado em `docs/archive/` | Lote 1 | 2026-05-29 |
| G-18 | app/README.md boilerplate | ✅ Substituído por README técnico | Lote 1 | 2026-05-29 |

---

*Próxima revisão: após execução do Lote 2 (DATABASE.md + AUTH.md + BUSINESS_DOMAIN.md)*
