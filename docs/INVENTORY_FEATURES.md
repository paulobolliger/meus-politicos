---
file: docs/INVENTORY_FEATURES.md
module: Inventory Features
status: Active
related: [README.md, docs/MVP_REAL_IDENTIFICADO.md, docs/PRODUCAO_READINESS.md, docs/INVENTORY_ROUTES.md, docs/GAP_ANALYSIS.md, docs/PLACEHOLDER_REPORT.md]
---

# Inventory Features

Data do inventario: 2026-06-02.

Este documento descreve o status funcional real das features identificadas no codigo. A classificacao considera implementacao, consumo real de API/banco, prontidao para producao e gaps operacionais.

## Legenda

| Status | Significado |
|---|---|
| Concluida em codigo | Implementacao real existe e cruza UI/API/banco ou servico externo |
| Parcial | Implementa parte relevante, mas possui lacunas, dependencia de dados ou validacao pendente |
| Placeholder | Existe UI ou texto, mas a funcionalidade principal nao esta pronta |
| Nao identificada | Nao foi encontrada implementacao no codigo atual |
| Risco producao | Existe, mas nao deve ir a producao sem correcao |

## Resumo Executivo De Features

| Feature | Status real | Backend | Frontend | Producao |
|---|---|---|---|---|
| Home publica | Parcial | PostgreSQL `votacoes` | `HomeCidadaoClient` | Beta |
| Busca de politicos | Concluida em codigo | `/api/busca`, `politicos`, `partidos` | `BuscaClient` | MVP, validar runtime |
| Perfil de politico | Parcial | Postgres direto em page server-side | `PerfilSite`, `PerfilApp` | Beta com placeholders |
| Acompanhamento/follow | Concluida em codigo | `/api/acompanhamentos`, `acompanhamentos` | `BotaoAcompanhar` | MVP, validar Logto |
| Painel/feed civico | Parcial | Postgres direto em `/painel` | `FeedCivico`, `KpiStrip`, `SeguindoList` | Beta |
| Auth Logto | Concluida em codigo | `/api/auth/logto/*`, `getCurrentUser` | Forms e redirects | MVP, validar runtime |
| Admin dashboard | Parcial | Postgres direto | Admin pages | Beta interno |
| Feature flags | Concluida em codigo | `/api/admin/flags`, `feature_flags` | `FeatureFlagList` | MVP interno |
| Admin ETL | Parcial/incompleta | `/api/admin/etl/run`, `admin_logs` | `EtlSourceCard` | Nao producao como trigger real |
| Analytics interno | Parcial | `/api/analytics`, `analytics_eventos` | `trackEvent` e admin analytics | MVP baixo |
| Pagamentos InfinitePay | Parcial/risco | `/api/apoio/criar-link`, webhook incompleto | `/apoio` | Bloqueio se fluxo ativo |
| IA/resumo interpretativo | Parcial | OpenAI + `politico_resumos_ia*` | `ResumoInterpretativoCard` | Beta controlado |
| Projetos/proposicoes | Parcial | `proposicoes`, autores, tramitacoes | paginas `/projetos`, `/proposicoes` | Beta |
| Partidos | Parcial | `partidos`, politicos, gastos, votacoes | `/partidos`, `/partidos/[sigla]` | Beta |
| Estados/municipios | Parcial | `estados_*`, `municipios`, `emendas` | `/estado`, `/estado/[sigla]` | Beta parcial |
| Candidatos 2026 | Parcial | `candidatos`; tentativa `candidatos_bens` | `/candidatos-2026` | Beta parcial |
| Rankings/scores | Placeholder/parcial | Campos agregados e coesao pontual | UI exibe metricas, mas scores amplos pendentes | Nao pronto como promessa ampla |
| Alertas/proximas votacoes | Placeholder | Nao identificado como fluxo completo | Componentes no painel | Nao pronto |

## Busca

Status: **Concluida em codigo; MVP**.

### O que funciona

A busca publica esta conectada a uma API real:

| Camada | Arquivo | Detalhe |
|---|---|---|
| UI | `app/src/components/busca/BuscaClient.tsx` | Monta query string e chama `/api/busca` com `cache: 'no-store'` |
| Pagina | `app/src/app/(site)/busca/page.tsx` | Renderiza `BuscaClient` |
| API | `app/src/app/api/busca/route.ts` | `GET` com filtros e paginacao |
| Banco | `politicos`, `partidos` | `SELECT`, `COUNT`, filtros por nome, cargo, UF, partido |

### Parametros reais

| Parametro | Uso |
|---|---|
| `q` | Busca por `p.nome_eleitoral ILIKE` ou `p.nome ILIKE` |
| `cargo` | Filtra enum/cargo validado |
| `uf` | Filtra `p.uf` |
| `partido` | Filtra `pa.sigla` |
| `ordem` | Ordena por relevancia/nome, presenca, gastos ou votacoes |
| `pagina` | Paginacao com `LIMIT` e `OFFSET` |

### Payload retornado

| Campo | Origem |
|---|---|
| `items` | Politicos normalizados |
| `total` | Count filtrado |
| `totalPaginas` | Derivado de `total` e `POR_PAGINA` |
| `pagina` | Query atual |
| `porPagina` | Constante `20` |
| `elapsedMs` | Tempo da request |
| `totalIndexados` | Count de politicos oficiais |
| `chips` | Cargos, UFs e partidos fixos |

### Consumidores adicionais

| Consumidor | Uso |
|---|---|
| `CompararClient` | Busca politicos para adicionar a comparacao |
| `MatchEmendaButton` | Busca politicos para vincular emenda no admin |

### Gaps

| Gap | Severidade |
|---|---|
| Runtime de banco nao validado | P1 |
| Chips nao trazem contagens reais por filtro | P3 |
| Endpoint aceita `porPagina` em alguns consumidores, mas API usa constante `POR_PAGINA` e `pagina`; compatibilidade deve ser revisada | P2 |

## Acompanhamento De Politicos

Status: **Concluida em codigo; MVP autenticado**.

### Fluxos

| Fluxo | UI | API | Banco | Status |
|---|---|---|---|---|
| Seguir politico | `BotaoAcompanhar` | `POST /api/acompanhamentos` | `INSERT INTO acompanhamentos` | Funcional em codigo |
| Deixar de seguir | `BotaoAcompanhar` | `DELETE /api/acompanhamentos/[politicoId]` | `DELETE FROM acompanhamentos` | Funcional em codigo |
| Listar seguidos via API | Nao identificado como consumo principal | `GET /api/acompanhamentos` | `SELECT politico_id` | API real, consumo UI parcial |
| Painel de seguidos | `/painel` | Le direto no server component | `SELECT politico_id FROM acompanhamentos` | Funcional em codigo |

### Tratamento de erros

| Condicao | Tratamento |
|---|---|
| Usuario nao autenticado | API retorna `401`; UI redireciona para login |
| `politico_id` ausente | API retorna `400` |
| Duplicidade | `23505` retorna `{ ok: true }` |
| FK invalida | `23503` retorna erro amigavel |
| Erro banco | Retorna mensagem/codigo do Postgres; revisar para producao |

### Dependencias

| Dependencia | Detalhe |
|---|---|
| Logto | `getCurrentUser()` precisa de sessao Logto autenticada |
| `perfis` | Usuario Logto precisa estar reconciliado a perfil interno |
| `acompanhamentos` | Tabela com relacao `usuario_id`/`politico_id` |
| `politicos` | FK/validacao do politico |

### Gaps

| Gap | Severidade |
|---|---|
| Validacao end-to-end Logto nao executada | P1 |
| Estado inicial `isSeguindo` no perfil publico aparece `false` em `PerfilPage` para site | P2 |
| `GET /api/acompanhamentos` existe, mas painel usa query direta; pode gerar duplicacao de regra | P3 |

## Feed Civico E Painel

Status: **Parcial; core funcional em codigo**.

### O que funciona

O painel `/painel` faz:

1. `getCurrentUser()`.
2. `redirect('/login')` se nao houver usuario.
3. Consulta `perfis` para nome.
4. Consulta `acompanhamentos` para politicos seguidos.
5. Consulta `politicos` + `partidos` para cards.
6. Consulta `votacoes` dos ultimos 7 dias.
7. Consulta `gastos` dos ultimos 7 dias.
8. Converte linhas em `FeedEvento`.
9. Renderiza `PainelHeader`, `KpiStrip`, `FeedCivico`, `SeguindoList`, `AlertasList`, `ProximasVotacoes`.

### Dados usados

| Dado | Tabela | Status |
|---|---|---|
| Usuario | `perfis` | Real |
| Seguidos | `acompanhamentos` | Real |
| Cards de politicos | `politicos`, `partidos` | Real |
| Eventos de votacao | `votacoes` | Real |
| Eventos de gasto | `gastos` | Real |
| Alertas ativos | Nao identificado como fluxo real | Placeholder/zero |
| Proxima votacao | Nao identificado como fluxo real | Placeholder/null |

### Gaps

| Gap | Severidade |
|---|---|
| `alertasAtivos={0}` | P2 |
| `proximaVotacaoLabel={null}` | P2 |
| `FeedCivico` contem estado "Esta area esta em breve" quando sem dados | P2 |
| Painel depende de dados recentes; se ETL nao roda, feed pode ficar vazio | P1 |

## Perfil De Politico

Status: **Parcial com dados reais**.

### Modo site

Quando host nao inicia com `app.`, a pagina usa `PerfilSite`.

| Dado | Query |
|---|---|
| Politico | `SELECT ... FROM politicos p WHERE slug/id` |
| Partido | `SELECT sigla FROM partidos WHERE id = $1` |
| Votacoes | `SELECT ... FROM votacoes WHERE politico_id = $1 LIMIT 20` |
| Gastos | `SELECT ... FROM gastos WHERE politico_id = $1 AND ano = anoAtual LIMIT 200` |
| Presenca | `SELECT ... FROM presenca WHERE politico_id = $1 LIMIT 12` |
| Emendas | `SELECT ... FROM emendas WHERE politico_id = $1 LIMIT 20` |

### Modo app

Quando host inicia com `app.`, a pagina usa `PerfilApp` com dados mais detalhados do politico, votacoes, gastos e presenca.

### Gaps

| Gap | Severidade |
|---|---|
| Comissoes marcadas como em breve | P2 |
| Algumas metricas/scores parecem placeholder ou derivadas de poucos campos | P2 |
| Estado de "seguindo" no site nao e consultado inicialmente | P2 |
| Secoes sem dados precisam distinguir "sem dados oficiais" de "nao implementado" | P1 |

## Rankings, Scores E Comparacao

Status: **Parcial; nao pronto como promessa ampla de ranking**.

### Evidencias de implementacao

| Feature | Evidencia | Status |
|---|---|---|
| Ordenacao por presenca/gastos/votacoes na busca | `/api/busca` altera `ORDER BY` por `ordem` | Funcional em codigo |
| Comparacao de politicos | `/comparar` e `CompararClient` | Parcial |
| Campos agregados em `politicos` | `presenca_pct_atual`, `gasto_total_ano`, `total_votacoes` | Usados |
| Coesao partidaria | `/partidos/[sigla]` consulta score/total sessoes | Parcial |
| Resumo interpretativo | `ResumoInterpretativoCard`, `resumo-interpretativo.ts` | Parcial |

### Limites

| Limite | Impacto |
|---|---|
| Nao ha ranking moral oficial identificado | Correto para neutralidade, mas deve ser claro na UI |
| Scores amplos aparecem como pendencia em docs legadas | Nao prometer alem do codigo |
| Comparacao depende de dados agregados disponiveis | Pode ficar pobre para cargos sem cobertura |
| Coesao/heatmap em partido possui areas placeholder | Nao considerar producao plena |

## Analytics

Status: **Parcial; MVP interno baixo**.

### Implementacao

| Camada | Arquivo | Detalhe |
|---|---|---|
| Cliente | `app/src/lib/analytics.ts` | `fetch('/api/analytics', ...)` |
| API | `app/src/app/api/analytics/route.ts` | `POST /api/analytics` |
| Banco | `analytics_eventos` | `INSERT INTO analytics_eventos (tipo, payload, usuario_id)` |
| Admin | `app/src/app/(admin)/admin/analytics/page.tsx` | Consulta eventos e mostra top buscas/views |

### Gaps

| Gap | Severidade |
|---|---|
| Sem monitoramento externo confirmado | P1 |
| Sem alertas/uptime confirmados | P1 |
| Sem contrato completo de eventos documentado ainda | P2 |
| Erros de analytics nao devem quebrar UX; validar comportamento | P3 |

## IA

Status: **Parcial; feature real com controle de cota, mas requer validacao de custo e produto**.

### Implementacao app

| Item | Evidencia |
|---|---|
| Server action | `app/src/actions/resumo-interpretativo.ts` |
| SDK | `openai` em `app/package.json` |
| Cache | `politico_resumos_ia` |
| Cotas | `politico_resumos_ia_cotas` |
| UI | `ResumoInterpretativoCard` |

### Implementacao ETL

| Item | Evidencia |
|---|---|
| Script | `etl/ia/simplificar_proposicoes.py` |
| Tabela alvo | `proposicoes` |
| Custo | Comentarios indicam custo estimado e modo `--all` com cautela |

### Gaps

| Gap | Severidade |
|---|---|
| Custos OpenAI precisam de limite operacional | P1 |
| Resultado IA deve ser rotulado e rastreavel | P1 |
| Fallback sem API key precisa ser validado | P2 |
| Prompts/contratos ainda devem ser documentados em API/INTEGRATIONS | P2 |

## Admin E Backoffice

Status: **Parcial, utilizavel como backoffice tecnico**.

### Areas

| Area | Arquivo | Backend | Status |
|---|---|---|---|
| Dashboard | `(admin)/admin/page.tsx` | Contagens e `coletas_log` | Funcional parcial |
| Usuarios | `(admin)/admin/usuarios/page.tsx` | `perfis` | Funcional parcial |
| Flags | `(admin)/admin/flags/page.tsx`, `/api/admin/flags` | `feature_flags`, `admin_logs` | Funcional em codigo |
| Dados | `(admin)/admin/dados/page.tsx` | Diagnosticos SQL | Funcional parcial |
| ETL | `(admin)/admin/etl/page.tsx`, `/api/admin/etl/run` | `coletas_log`, `admin_logs` | Incompleto como trigger |
| Analytics | `(admin)/admin/analytics/page.tsx` | `analytics_eventos` | Funcional parcial |
| Editor politico | `PoliticoEditorSection`, `/api/admin/politicos/[id]` | `politicos`, `admin_logs` | Funcional parcial |
| Match emendas | `MatchEmendaButton`, `/api/admin/emendas/match` | `emendas`, `admin_logs`, `/api/busca` | Funcional parcial |

### Gaps

| Gap | Severidade |
|---|---|
| Confirmar RBAC em todas as paginas e APIs admin | P1 |
| ETL run nao dispara coleta real | P1 |
| Admin depende de banco runtime nao validado | P1 |
| Auditoria existe, mas precisa contrato de eventos/admin logs | P2 |

## Pagamentos E Apoio

Status: **Parcial com risco de producao**.

### Implementacao

| Fluxo | Arquivo | Status |
|---|---|---|
| Criar link InfinitePay | `/api/apoio/criar-link` | Chama API externa e retorna URL |
| Tela apoio | `/apoio` | Chama endpoint de link |
| Verificar pagamento | `/api/apoio/verificar-pagamento` | Existe, sem consumidor UI identificado |
| Webhook InfinitePay | `/api/webhooks/infinitepay` | Recebe payload, valida campos, loga |

### Bloqueio

O webhook contem `TODO: registrar doacao no banco de dados` e nao persiste evento. Se a captacao estiver ativa publicamente, isso e bloqueio de producao.

## Projetos, Proposicoes E Camara

Status: **Parcial com dados reais**.

| Feature | Tabelas | Status |
|---|---|---|
| Lista de projetos site | `proposicoes` | Funcional parcial |
| Detalhe de projeto site | `proposicoes`, `proposicao_autores`, `proposicao_tramitacoes`, `votacoes` | Funcional parcial |
| Proposicoes app | `proposicoes`, `proposicao_autores` | Funcional parcial |
| Pagina Camara | `politicos`, `partidos`, `gastos`, `votacoes`, `proposicoes` | Funcional parcial |
| Tramitacoes ETL | `etl/camara/collect_tramitacoes.py` | Script existe |

Gaps: historico detalhado ainda aparece como "em breve" em UI de projeto; cobertura depende de ETL.

## Partidos

Status: **Parcial com dados reais**.

| Feature | Tabelas/dados | Status |
|---|---|---|
| Lista de partidos | `partidos`, fundos | Funcional parcial |
| Detalhe de partido | `partidos`, membros, gastos, coesao | Funcional parcial |
| Membros | `politicos` associados a partido | Funcional em codigo |
| Coesao | Query especifica em votacoes/sessoes | Parcial |
| Heatmap | UI placeholder | Placeholder |

## Estados, Municipios E Assembleias

Status: **Parcial**.

| Feature | Tabelas/dados | Status |
|---|---|---|
| Hub de estados | Config estatico + UI | Parcial |
| Estado detalhe | `estados_governos`, `estados_economia`, `estados_pacto_federativo`, `estados_tribunais`, `estados_timeline`, `municipios`, `emendas`, `politicos` | Funcional parcial |
| Municipios | `municipios` | Funcional parcial |
| Assembleia estadual | `politicos`, `partidos`, ALE | Parcial |
| Perfil deputado estadual | `politicos`, colegas/ALE | Parcial |
| Deputados estaduais/vereadores no meu estado | Dados em breve em UI | Placeholder parcial |

## Candidatos 2026

Status: **Parcial**.

| Feature | Dados | Status |
|---|---|---|
| Lista de candidatos | `candidatos` | Funcional parcial |
| Detalhe de candidato | `candidatos` | Funcional parcial |
| Bens patrimoniais | `candidatos_bens` tentativo | Parcial; tabela pode nao existir |
| Chat/perguntas | UI input placeholder | Placeholder |
| Links de navegacao | 2 `href="#"` identificados | Corrigir |

## Features Nao Prontas Para Promessa Publica

| Feature | Motivo |
|---|---|
| Pagamento/doacao contabilizada | Webhook nao persiste |
| ETL executado pelo admin | Endpoint so registra intencao |
| Alertas civicos | Sem fluxo real completo identificado |
| Proximas votacoes | Sem fonte/consulta real identificada no painel |
| Rankings/scores amplos | Parcial e possivelmente placeholder |
| Heatmaps completos | Placeholder em partidos/perfis |
| Cobertura completa estadual/municipal | UI indica dados em breve |
| Chat IA sobre candidatos/projetos | Inputs existem, fluxo nao comprovado |

## Project Health Por Feature

| Feature | Nota | Justificativa |
|---|---:|---|
| Busca | 85 | API, UI e banco conectados |
| Perfil politico | 76 | Dados reais amplos, mas secoes incompletas |
| Acompanhamento | 82 | APIs reais e banco, depende de Logto runtime |
| Painel/feed | 72 | Le dados reais, mas alertas/proximas votacoes incompletos |
| Auth | 78 | Logto implementado, precisa validacao end-to-end |
| Admin flags/editor | 74 | Acoes reais e logs, validar RBAC/runtime |
| Admin ETL | 45 | Registra acao, nao executa ETL |
| Analytics | 58 | Coleta basica, falta observabilidade robusta |
| IA | 64 | Implementacao real, custo/guardrails pendentes |
| Pagamentos | 42 | Link real, persistencia ausente |
| Estados/ALE | 62 | Muitas consultas reais, cobertura parcial |
| Candidatos 2026 | 55 | Lista/detalhe parcial, placeholders e tabela opcional |

## Conclusao

O raio-X funcional confirma que o MVP real esta concentrado em busca, perfil, acompanhamento e painel. As features de admin, IA, estados, partidos, projetos e candidatos ja passaram do estagio de prototipo, mas ainda carregam dependencias de dados, placeholders e validacao operacional. Pagamentos, segredo em documentacao legada e ETL via admin sao os principais bloqueios para producao plena.
