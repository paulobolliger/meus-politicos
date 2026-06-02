---
file: docs/MODERNIZATION_ROADMAP.md
module: Modernization Roadmap
status: Active
related: [docs/TODO_PRODUCTION.md, docs/MVP_REAL_IDENTIFICADO.md, docs/ARCHITECTURE.md, docs/DEPLOYMENT.md, docs/SECURITY.md, docs/DESIGN.md]
---

# Modernization Roadmap

Plano estrategico de retomada para estabilizar o MVP real identificado: busca civica, perfil politico, acompanhamento e feed civico. O plano tambem inclui automacao de ETL e saneamento operacional das fraturas expostas pela macro auditoria v4.0.

## Norte de Produto

O produto nao deve tentar parecer uma plataforma completa antes de fechar o core loop. A retomada deve priorizar:

1. Usuario encontra politico.
2. Usuario entende o perfil com dados rastreaveis.
3. Usuario acompanha o politico.
4. Sistema entrega feed/alertas civicos baseados em eventos reais.
5. Admin consegue manter dados atualizados sem execucao manual obscura.

## Quick Wins - 1 a 3 dias

| ID | Acao | Impacto | Pre-requisito |
|---|---|---|---|
| QW-01 | Revogar chave Resend exposta e substituir valor em doc legado por placeholder | Remove risco P0 imediato | Acesso ao painel Resend |
| QW-02 | Ajustar UI de apoio/confirmacao para nao prometer confirmacao financeira persistida | Reduz risco juridico/UX | Nenhum |
| QW-03 | Rebaixar visualmente botao "rodar ETL" para "registrar solicitacao" ate existir runner | Evita falsa operacao | Nenhum |
| QW-04 | Normalizar parametros `limite`/`porPagina` na API de busca ou nos consumidores | Corrige friccao admin/comparar | Pequena alteracao API/UI |
| QW-05 | Criar helper `requireAdmin()` e `requireUser()` se ainda nao consolidado no runtime | Reduz erro de seguranca em endpoints futuros | Revisao de `current-user.ts` |
| QW-06 | Rodar build com env segura e registrar resultado | Descobre quebras reais | Env local/dev confirmada |
| QW-07 | Criar lista de rotas core para QA manual | Acelera estabilizacao | Inventario de rotas pronto |

## Sprint 1 - Estabilizacao P0/P1 do MVP Real

Duracao sugerida: 5 a 8 dias uteis.

### Objetivo

Remover bloqueios absolutos, validar runtime e fechar o minimo confiavel do core loop.

### Escopo

| Epico | Tarefas | Resultado |
|---|---|---|
| Seguranca P0 | Revogar Resend, remover valor real atual, decidir historico Git, repetir varredura | Incidente encerrado ou risco residual formalmente aceito |
| Pagamentos | Criar/confirmar `doacoes`, persistir webhook InfinitePay, implementar idempotencia, definir autenticidade | Apoio financeiro nao perde confirmacao |
| Infra/build | Pre-flight seguro DB, `npm run build`, validar Vercel envs | Deploy tecnicamente validado |
| Auth | Testar login/cadastro/reset/callback/logout; validar usuario novo e legado | Logto operacional ponta a ponta |
| Core loop | Testar busca, perfil, acompanhar, painel; corrigir estados quebrados | MVP real navegavel |
| Contratos API | Normalizar busca e erros basicos | Menos divergencia UI/backend |

### Entregaveis

| Entregavel | Criterio de aceite |
|---|---|
| Relatorio de rotacao Resend | Data/hora, chave antiga revogada, nova chave fora do repo |
| Webhook InfinitePay persistente | Evento pago cria/atualiza registro idempotente |
| Build validado | `npm run build` concluido ou lista de falhas corrigida |
| Auth validado | Painel e admin bloqueiam/permitem corretamente |
| Core loop validado | Usuario consegue buscar, abrir perfil e acompanhar |

### Fora de Escopo

| Item | Motivo |
|---|---|
| Reescrita completa do design system | Entra apos estabilizacao |
| Automacao completa de todos os ETLs | Sprint 2 |
| IA avancada/candidatos 2026 completos | Sprint 3 |

## Sprint 2 - Automacao de ETL e Observabilidade

Duracao sugerida: 8 a 12 dias uteis.

### Objetivo

Transformar ETL de execucao manual em rotina observavel e acionavel, sem depender de improviso via SSH.

### Escopo

| Epico | Tarefas | Resultado |
|---|---|---|
| Runner ETL | Definir GitHub Actions, Coolify cron ou runner externo | Local de execucao decidido |
| Fila/status | Criar `etl_jobs` ou adaptar `coletas_log` | Admin enxerga status real |
| Scripts | Criar `etl/requirements.txt` ou `pyproject.toml` | Ambiente Python reprodutivel |
| Env | Unificar `POSTGRES_*` e `SUPABASE_DB_*` | Menos drift de configuracao |
| Admin | Fazer `/api/admin/etl/run` enfileirar job real ou acionar provider | Botao deixa de ser placeholder |
| Alertas | Alertar ETL atrasado/falho | Operacao proativa |
| Dados | Reprocessar fontes criticas Camara/Senado/TSE/IBGE/CGU | Dados do MVP atualizados |

### Ordem Logica dos ETLs

| Ordem | Familia | Motivo |
|---:|---|---|
| 1 | IBGE/estados/municipios | Base geografica |
| 2 | Partidos | Base relacional |
| 3 | Politicos Camara/Senado/TSE | Entidades centrais |
| 4 | Gastos/votacoes/proposicoes/emendas | Eventos e metricas |
| 5 | SIAFI/fornecedores/fundos | Enriquecimento |
| 6 | IA/simplificacao | Depende de proposicoes e limite de custo |
| 7 | Feed/eventos | Depende de eventos consolidados |

### Entregaveis

| Entregavel | Criterio de aceite |
|---|---|
| Runner ETL ativo | Executa uma fonte em ambiente controlado |
| Status no admin | Mostra ultimo job, sucesso/falha e horario |
| Alerta de falha | Uma falha simulada gera alerta |
| Requirements Python | Instala ambiente ETL do zero |
| Feed base | Eventos persistidos disponiveis para painel |

## Sprint 3 - Produto, UI e Inteligencia Civica

Duracao sugerida: 10 a 15 dias uteis.

### Objetivo

Converter a base estabilizada em experiencia de produto confiavel, com feed civico real, UX honesta e IA governada.

### Escopo

| Epico | Tarefas | Resultado |
|---|---|---|
| Feed civico | Conectar `feed_eventos`/eventos a `FeedCivico` | Painel entrega valor continuo |
| Candidatos 2026 | Revalidar dados TSE, remover `href="#"`, declarar cobertura | Modulo eleitoral honesto |
| Design debt | Reduzir inline styles nas rotas core, substituir emojis por lucide | UI mais consistente |
| Estados vazios | Padronizar EmptyState/erro/loading | Menos falsas promessas |
| IA | Monitorar limite/custo, sinalizar origem e cache | IA governada |
| Dependencias | Remover orfaos confirmados e validar peers React 19/Next 16 | Menos risco de build |
| Licencas | Gerar relatorio/SBOM | Compliance basico |

### Entregaveis

| Entregavel | Criterio de aceite |
|---|---|
| Feed civico real | Eventos reais aparecem para politicos acompanhados |
| QA visual core | Desktop/mobile aprovados em busca, perfil, painel, apoio, admin |
| Dependencias saneadas | Build passa apos remocoes |
| Relatorio de licencas | Licencas especiais identificadas |
| Candidatos 2026 com status claro | Usuario entende cobertura e limitacoes |

## Cronograma Resumido

| Semana | Foco | Marco |
|---|---|---|
| Semana 1 | Sprint 1 | P0 resolvidos, build/auth/core loop validados |
| Semana 2 | Sprint 2 inicio | Runner ETL definido, requirements e fila/status criados |
| Semana 3 | Sprint 2 fim | ETL automatizado minimo, alertas e reprocessamento critico |
| Semana 4 | Sprint 3 inicio | Feed real e UI honesta |
| Semana 5 | Sprint 3 fim | QA visual, dependencias, licencas e candidatos 2026 saneados |

## Indicadores de Sucesso

| Indicador | Meta inicial |
|---|---|
| Tempo desde ultima coleta critica | Visivel por fonte no admin |
| Build Next.js | Verde em ambiente com env segura |
| Login Logto | Fluxos principais validados |
| Follow de politico | Persistente e refletido no painel |
| Feed civico | Pelo menos 1 tipo de evento real por politico acompanhado |
| Webhook InfinitePay | Persistencia idempotente comprovada |
| Segredos no workspace | Nenhum valor real conhecido |
| Rotas core mobile | Sem bloqueios visuais |

## Decisoes Pendentes

| Decisao | Opcoes | Recomendacao |
|---|---|---|
| Orquestrador ETL | GitHub Actions, Coolify cron, runner dedicado | Escolher o que tiver melhor acesso seguro ao banco |
| Banco em serverless | `pg` direto vs pooler/proxy | Avaliar pooler e centralizar conexao |
| Historico Git contaminado | Reescrever historico vs revogar e registrar risco | Depende de exposicao publica do repo |
| Feed civico | Materializar em `feed_eventos` vs calcular on-demand | Materializar eventos para painel |
| Cache client | Sem lib vs SWR/TanStack Query | Adotar somente onde houver dor real |

## Veredito Estrategico

A retomada deve ser conservadora. O produto ja tem estrutura suficiente para um MVP real, mas nao deve expandir novas frentes antes de resolver: segredo exposto, webhook financeiro, validacao de banco/build/auth e ETL automatizado. Depois disso, a prioridade passa a ser feed civico real, porque ele fecha o valor recorrente do acompanhamento.
