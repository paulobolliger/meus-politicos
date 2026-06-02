---
file: docs/PRODUCAO_READINESS.md
module: Producao Readiness
status: Active
related: [README.md, docs/MVP_REAL_IDENTIFICADO.md, docs/TODO_PRODUCTION.md, docs/SECURITY.md, docs/DEPLOYMENT.md, docs/ENVIRONMENT.md, docs/GAP_ANALYSIS.md]
---

# Producao Readiness

Data do inventario: 2026-06-02.

Este documento consolida a prontidao de lancamento com base no inventario estatico executado na Fase 1B. Nenhuma conexao ativa com banco remoto/desconhecido foi executada.

## Score Geral

Project Health Score preliminar: **72/100**.

Classificacao: **Beta tecnico, ainda nao producao plena**.

| Faixa | Significado |
|---|---|
| 0-39 | Nao pronto |
| 40-59 | Alpha tecnico |
| 60-79 | MVP/Beta |
| 80-89 | Release candidate |
| 90-100 | Producao |

O projeto esta acima de um prototipo porque possui rotas reais, banco modelado, consultas reais, autenticacao Logto em codigo, painel autenticado e APIs internas. Ainda nao chega a producao porque ha gaps P0 em seguranca documental, pagamentos, validacao runtime e operacao.

## Resumo Por Area

| Area | Nota | Status | Veredito |
|---|---:|---|---|
| Infraestrutura | 72 | MVP/Beta | Base Vercel/Next/workspace existe, mas deploy e CI/CD nao foram validados nesta fase |
| Banco de Dados | 76 | MVP/Beta | Schema amplo e muitas consultas reais; pre-flight ativo abortado por seguranca |
| Frontend | 74 | MVP/Beta | Core loop funcional em codigo, mas ha placeholders e fluxos parciais |
| Admin/Backoffice | 68 | MVP/Beta parcial | Telas e APIs existem; ETL run ainda nao dispara processo real |
| ETL | 62 | MVP parcial | Scripts amplos existem; execucao orquestrada e observabilidade nao confirmadas |
| Observabilidade | 54 | Alpha/MVP baixo | `analytics_eventos` existe, mas sem pipeline robusto confirmado |
| Seguranca | 48 | Nao pronto para producao | Segredo aparente em doc legado e varredura historica ainda pendente |

## Infraestrutura

Nota: **72/100**.

Status: **MVP/Beta**.

### Evidencias positivas

| Item | Evidencia |
|---|---|
| Workspace npm raiz | `package.json` com `workspaces: ["app"]` |
| App Next.js | `app/package.json` com `next: 16.2.6` |
| Build/start padronizados | scripts raiz delegam para `app` |
| Config Vercel | `vercel.json` existe na raiz |
| Config Next | `app/next.config.ts` carrega env da raiz com `loadEnvConfig(path.resolve(__dirname, ".."))` |
| Supabase local config | `supabase/config.toml` existe |

### Riscos

| Risco | Severidade | Detalhe |
|---|---|---|
| Deploy nao validado nesta fase | P1 | Inventario foi estatico; nenhum `npm run build` foi executado |
| CI/CD nao confirmado | P2 | Arquivos `.github/workflows` nao apareceram no inventario inicial |
| Ambientes por subdominio dependem de config externa | P1 | `localhost`, `app.localhost`, `painel.localhost` dependem de host/proxy |
| Banco remoto/desconhecido em `.env.local` | P0/P1 | Impede pre-flight automatico pela regra P0 |

### Acoes para subir nota

1. Executar `npm run build` com variaveis seguras.
2. Validar deploy preview.
3. Documentar Vercel project, dominos, env vars e rollback.
4. Criar/validar workflow CI com lint/build.

## Banco De Dados

Nota: **76/100**.

Status: **MVP/Beta**.

### Evidencias positivas

| Item | Evidencia |
|---|---|
| Schema SQL amplo | `supabase/001_schema.sql` e `supabase/migrations/*.sql` |
| RLS habilitado em varias tabelas | Migrations contem `ENABLE ROW LEVEL SECURITY` |
| Uso real por frontend/server | `pool.query()` em home, busca, perfil, painel, admin e APIs |
| Tabelas centrais usadas | `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas`, `perfis`, `acompanhamentos` |
| Dados estaduais e proposicoes consultados | `estados_*`, `municipios`, `proposicoes`, `proposicao_autores`, `proposicao_tramitacoes` |

### Pre-flight

Resultado: **abortado por seguranca, nao falha funcional**.

Motivo: `app/.env.local` foi classificado como `remote-dev-unknown`, porta `5432`, banco `meus_politicos_db`, senha presente. Como o host nao era local e nao havia garantia de nao-producao, nenhuma conexao ativa foi executada.

### Riscos

| Risco | Severidade | Detalhe |
|---|---|---|
| Conectividade real nao validada | P0/P1 | O app depende intensamente de Postgres direto |
| Tabelas possivelmente fantasmas | P2 | Algumas tabelas do schema nao apareceram em consultas de app |
| Queries duplicadas por pagina | P2 | Muitos arquivos criam `new Pool()` localmente |
| Divergencia de portas | P2 | Alguns trechos usam default `5432`, outros `5433` |
| `auth.users` legado ainda consultado | P1 | Reconciliacao Logto usa fallback em schema legado |

### Acoes para subir nota

1. Executar pre-flight em ambiente explicitamente local/dev com timeout de 5 segundos.
2. Validar migrations aplicadas.
3. Mapear tabelas ativas, fantasmas e subutilizadas em `INVENTORY_DATABASE_USAGE.md`.
4. Padronizar camada de conexao Postgres para reduzir duplicacao.
5. Validar RLS/grants para rotas publicas, admin e usuarios autenticados.

## Frontend

Nota: **74/100**.

Status: **MVP/Beta**.

### Evidencias positivas

| Item | Evidencia |
|---|---|
| Rotas publicas amplas | `(site)` contem home, busca, politicos, projetos, partidos, estados, Camara, glossario, apoio |
| Busca conectada | `BuscaClient.tsx` chama `/api/busca` |
| Perfil conectado | `politicos/[id]/page.tsx` consulta dados reais |
| Follow/unfollow conectado | `BotaoAcompanhar.tsx` chama APIs reais |
| Painel autenticado | `/painel` le usuario, acompanhamentos e feed |
| UI componentizada | `components/site`, `components/politico-v2`, `components/painel`, `components/admin`, `components/ui` |

### Gaps de UI/produto

| Gap | Severidade | Evidencia |
|---|---|---|
| Placeholders "em breve" | P2 | Feed civico, estado, fontes, deputados estaduais, perfil app, partidos/projetos |
| Dados mockados | P2 | `HomeApp.tsx` declara bloco de dados mock |
| Links inativos | P2 | 2 ocorrencias de `href="#"` em `CandidatoPageClient.tsx` |
| Alertas/proximas votacoes limitados | P2 | Painel passa `alertasAtivos={0}` e `proximaVotacaoLabel={null}` |
| UX de pagamentos sem persistencia | P1/P0 | Link de pagamento existe, confirmacao real nao persiste |

### Acoes para subir nota

1. Gerar `PLACEHOLDER_REPORT.md` com arquivo e linha.
2. Definir quais placeholders ficam fora do MVP e quais bloqueiam.
3. Remover links `href="#"` ou substituir por acoes reais/desabilitadas.
4. Validar fluxo completo via browser: busca -> perfil -> login -> acompanhar -> painel.

## Admin E Backoffice

Nota: **68/100**.

Status: **MVP parcial**.

### Evidencias positivas

| Area | Evidencia |
|---|---|
| Dashboard admin | `app/src/app/(admin)/admin/page.tsx` |
| Usuarios | `app/src/app/(admin)/admin/usuarios/page.tsx` |
| Flags | `app/src/app/(admin)/admin/flags/page.tsx` e `/api/admin/flags` |
| Dados | `app/src/app/(admin)/admin/dados/page.tsx` |
| Analytics | `app/src/app/(admin)/admin/analytics/page.tsx` |
| ETL | `app/src/app/(admin)/admin/etl/page.tsx` e `/api/admin/etl/run` |
| Auditoria | `admin_logs` usado por APIs admin |
| RBAC | `requireAdmin()` e checagem `currentUser.role !== 'admin'` |

### Riscos

| Risco | Severidade | Detalhe |
|---|---|---|
| ETL run nao executa ETL real | P1 | Apenas insere em `admin_logs` e informa SSH manual em breve |
| Sem confirmacao de protecao em todas as telas | P1 | A consolidacao de AUTH deve verificar layouts e APIs |
| Operacoes admin dependem de banco remoto nao validado | P1 | Pre-flight abortado |

### Acoes para subir nota

1. Confirmar protecao de todas as rotas admin.
2. Documentar contrato de cada acao admin.
3. Implementar ou reclassificar trigger ETL como backlog.
4. Validar auditoria em `admin_logs`.

## ETL

Nota: **62/100**.

Status: **MVP parcial**.

### Evidencias positivas

| Fonte | Pasta/script |
|---|---|
| Camara | `etl/camara/*` |
| Senado | `etl/senado/*` |
| TSE | `etl/tse/*` |
| Assembleias estaduais | `etl/ale/*` |
| IBGE | `etl/ibge/*` |
| Portal da Transparencia | `etl/portal_transparencia/*` |
| Partidos | `etl/partidos/*` |
| OpenAI/simplificacao | `etl/ia/simplificar_proposicoes.py` |
| Estados/STN | `etl/estados/*`, `etl/stn/*` |

### Riscos

| Risco | Severidade | Detalhe |
|---|---|---|
| Execucao nao validada | P1 | Inventario foi estatico |
| Orquestracao ausente/incompleta | P1 | Admin nao dispara ETL real |
| Scripts conectam por env direta | P1 | Varios scripts usam `POSTGRES_*`/`SUPABASE_DB_*` |
| Custos OpenAI em ETL | P2 | `simplificar_proposicoes.py` indica custo e modo `--all` |

### Acoes para subir nota

1. Documentar ordem segura de execucao dos ETLs.
2. Validar scripts em ambiente dev com dados controlados.
3. Criar logs padronizados em `coletas_log`.
4. Definir mecanismo operacional para trigger admin ou remover promessa de UI.

## Observabilidade

Nota: **54/100**.

Status: **Alpha/MVP baixo**.

### Evidencias positivas

| Item | Evidencia |
|---|---|
| Endpoint analytics | `/api/analytics` |
| Tabela de eventos | `analytics_eventos` |
| Admin analytics | `app/src/app/(admin)/admin/analytics/page.tsx` |
| Logs de coleta | `coletas_log` |
| Admin logs | `admin_logs` |

### Riscos

| Risco | Severidade | Detalhe |
|---|---|---|
| Sem monitoramento externo confirmado | P1 | Nao identificado no inventario |
| Sem alertas de erro/uptime confirmados | P1 | Precisa ser confirmado |
| Webhook pagamento loga no console | P1 | Sem persistencia/alerta operacional |
| ETL sem orquestracao observavel pelo admin | P1 | Apenas registro de intencao |

### Acoes para subir nota

1. Definir monitoramento de uptime e erros.
2. Persistir eventos criticos: pagamento, login, follow, admin actions, ETL.
3. Criar dashboard operacional minimo.
4. Documentar playbooks em `DEPLOYMENT.md` e `SECURITY.md`.

## Seguranca

Nota: **48/100**.

Status: **Nao pronto para producao**.

### Evidencias positivas

| Item | Evidencia |
|---|---|
| Logto implementado | `app/src/lib/logto/*` |
| RBAC admin | `requireAdmin()` e `role` em `perfis` |
| RLS no schema | Migrations habilitam RLS |
| `.env.example` usa placeholders | Arquivo raiz nao expoe segredo real no template |
| Regra P0 aplicada | Pre-flight remoto/desconhecido abortado |

### Riscos P0/P1

| Risco | Severidade | Evidencia |
|---|---|---|
| Segredo aparente em doc legado | P0 | `docs/meuspoliticos_master.md` contem `RESEND_API_KEY` com valor real aparente |
| Varredura historica Git pendente | P0 | Regra 13 exige busca no historico de commits |
| Webhook InfinitePay sem autenticidade/persistencia robusta | P1/P0 | Codigo apenas valida campos e loga |
| `auth.users` legado ainda usado em fallback | P1 | `profile-linking.ts` consulta `auth.users` |
| Erros de banco podem retornar mensagem/codigo ao cliente | P2 | APIs retornam `pgError.message` e `code` |

### Acoes para subir nota

1. Rotacionar imediatamente a chave identificada.
2. Remover segredo de documentacao e historico conforme politica aprovada.
3. Executar varredura historica de segredos.
4. Revisar respostas de erro das APIs.
5. Validar assinatura/autenticidade de webhooks.
6. Confirmar RLS/grants e RBAC em runtime.

## Bloqueios De Go-Live

| ID | Bloqueio | Area | Severidade | Status |
|---|---|---|---|---|
| BLK-01 | Segredo aparente em documentacao legada | Seguranca | P0 | Aberto |
| BLK-02 | Webhook InfinitePay nao persiste doacao | Pagamentos | P0/P1 | Aberto |
| BLK-03 | Pre-flight de banco nao executado por host remoto/desconhecido | Banco/Infra | P0/P1 | Aberto |
| BLK-04 | Build/deploy nao validado nesta fase | Infra | P1 | Aberto |
| BLK-05 | Trigger de ETL pelo admin nao executa ETL real | Admin/ETL | P1 | Aberto |

## Status De Lancamento Por Categoria

| Categoria | Status | Comentario |
|---|---|---|
| Nao pronto | Seguranca | Segredo legado e historico pendente |
| Nao pronto | Pagamentos completos | Evento de pagamento nao persiste |
| MVP | Busca/perfil/painel | Core loop existe em codigo |
| MVP | Auth Logto | Implementado, precisa validacao runtime |
| MVP | Banco | Modelado e usado, precisa pre-flight permitido |
| Beta | Frontend publico | Boa cobertura, mas placeholders |
| Alpha/MVP | Observabilidade | Analytics basico, sem operacao robusta |

## Recomendacao De Proxima Acao

Prosseguir para o Lote 2 para mapear rotas e features com granularidade. Em paralelo, tratar BLK-01 como incidente de seguranca: rotacionar a chave e preparar remediacao documental com confirmacao humana antes de arquivar/remover documentos legados.

Sem resolver os bloqueios P0, o projeto nao deve ser promovido como producao plena.
