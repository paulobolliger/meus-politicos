---
file: docs/TODO_PRODUCTION.md
module: Production TODO
status: Active
related: [docs/PRODUCAO_READINESS.md, docs/GAP_ANALYSIS.md, docs/SECURITY.md, docs/DEPLOYMENT.md, docs/DATABASE.md, docs/API.md, docs/DESIGN.md]
---

# TODO Production

Lista consolidada de pendencias para estabilizar o MVP real do Meus Politicos antes de qualquer declaracao de producao plena. Este documento herda os achados dos Lotes 1 a 7 e organiza execucao por severidade.

## Criterio de Severidade

| Nivel | Definicao | Regra de decisao |
|---|---|---|
| P0 | Bloqueia producao ou cria risco critico de seguranca/financeiro | Deve ser resolvido antes de go-live publico |
| P1 | Bloqueia confiabilidade do MVP real | Deve entrar na Sprint 1 de estabilizacao |
| P2 | Divida relevante de qualidade, observabilidade ou UX | Pode entrar apos estabilizacao do core loop |
| P3 | Organizacao, melhoria incremental ou backlog nao bloqueante | Planejar quando o produto estiver operando |

## P0 - Bloqueios Absolutos

| ID | Area | Pendencia | Evidencia | Saida esperada |
|---|---|---|---|---|
| P0-01 | Seguranca | Revogar a chave Resend exposta em doc legado | `docs/meuspoliticos_master.md:229`, `docs/meuspoliticos_master.md:264`; historico Git com ocorrencias nominais | Chave antiga invalidada, nova chave em secret manager, incidente registrado |
| P0-02 | Seguranca | Remover valor real de `RESEND_API_KEY` do workspace atual | Varredura em `docs/SECURITY.md` | Documento legado com placeholder, sem valor real no `rg` atual |
| P0-03 | Seguranca/Git | Decidir tratamento do historico Git contaminado | Commits `50ad33a`, `824978d`, `27ef38f`, `6324566` indicados por `git log -S RESEND_API_KEY` | Decisao formal: reescrever historico ou aceitar risco apos revogacao |
| P0-04 | Pagamentos | Persistir confirmacao InfinitePay antes de retornar sucesso operacional | `app/src/app/api/webhooks/infinitepay/route.ts` apenas loga payload | Tabela/servico de doacoes com insert/upsert idempotente |
| P0-05 | Pagamentos | Definir validacao de autenticidade do webhook InfinitePay | Nenhuma env de assinatura/HMAC identificada | Assinatura/HMAC/IP allowlist ou decisao formal documentada se provider nao suportar |
| P0-06 | Banco/Infra | Executar pre-flight seguro em ambiente explicitamente local/dev | Inventario abortou por host remoto/desconhecido | Conectividade validada com timeout <= 5s sem tocar producao por engano |

## P1 - Estabilizacao do MVP Real

### Core Loop

| ID | Area | Pendencia | Evidencia | Saida esperada |
|---|---|---|---|---|
| P1-01 | Produto | Fechar loop buscar -> perfil -> acompanhar -> painel/feed | `FeedCivico.tsx` ainda nao deriva de pipeline real | Feed civico gerado de eventos persistidos |
| P1-02 | Produto | Ligar `feed_eventos`/fontes civicas ao painel | `docs/DATABASE.md` registra `feed_eventos`; painel nao usa atualmente | Query real no painel e estado vazio honesto |
| P1-03 | Produto | Corrigir candidatos 2026 para nao sugerir completude | `docs/PLACEHOLDER_REPORT.md`, rotas `candidatos-2026` | UI com status de cobertura e links funcionais |
| P1-04 | API | Normalizar contrato de busca | `CompararClient` usa `limite`; `MatchEmendaButton` usa `porPagina`; API espera `pagina`/range | Parametros aceitos ou consumidores ajustados |

### Banco

| ID | Area | Pendencia | Evidencia | Saida esperada |
|---|---|---|---|---|
| P1-05 | Banco | Centralizar factory de conexao PostgreSQL | Muitos `new Pool()` em paginas, APIs e helpers | `lib/db` com timeout, SSL, logging e config unica |
| P1-06 | Banco | Resolver defaults divergentes `5432` vs `5433` | `docs/ENVIRONMENT.md` | Porta padrao unica por ambiente |
| P1-07 | Banco | Criar/confirmar tabela `doacoes` | Ausente em migrations; citada por TODO/webhook | Migration SQL versionada |
| P1-08 | Banco | Versionar `partidos_fundos` se usado pelo app | Criada por script ETL, nao por migration | Migration ou guard de ausencia |
| P1-09 | Banco/Auth | Validar RLS/grants vs Logto e `pg` direto | RLS legado usa `auth.uid()`/`auth.jwt()` | Roles Postgres de menor privilegio e grants revisados |
| P1-10 | Auth | (Resolvido) Criar provisioning para usuario Logto sem perfil legado | Resolvido via runtime logic e migration de decupagem | Criação automática em perfis |
| P1-11 | Auth | Reduzir dependencia de `auth.users` legado | Decupagem de constraints realizada; linking de email legado preservado | Plano de desligamento ou tabela de emails interna |
| P1-11b | Banco | Criar tabela `municipios_financas` | Card 'Saúde Fiscal' pendente de dados reais | Executar migration SQL para criar a tabela com unique constraint |

### ETL e Dados

| ID | Area | Pendencia | Evidencia | Saida esperada |
|---|---|---|---|---|
| P1-12 | ETL | Fazer `/api/admin/etl/run` disparar job real ou rebaixar visualmente para "registrar solicitacao" | Endpoint retorna "Trigger manual via SSH em breve" | Job runner externo ou UI honesta |
| P1-13 | ETL | Criar tabela/fila `etl_jobs` ou equivalente | `docs/DEPLOYMENT.md` recomenda orquestracao | Status de job, lock, exit_code e logs sanitizados |
| P1-14 | ETL | Automatizar coletas Camara/Senado/TSE/IBGE/CGU/ALE | Scripts existem in `etl/**`, sem orquestrador | Scheduler/Cron/GitHub Actions/Coolify job |
| P1-15 | ETL | Unificar envs `POSTGRES_*` e `SUPABASE_DB_*` | Runtime usa `POSTGRES_*`; ETL aceita ambos | Contrato unico por `.env`/secret manager |
| P1-16 | ETL | Criar `requirements.txt`/`pyproject.toml` do ETL | Dependencias Python nao consolidadas | Ambiente reprodutivel |
| P1-17 | Dados | Revalidar status de candidatos 2026 | Produto incompleto | Dados de TSE atualizados ou disclaimer operacional |
| P1-17b | ETL/Dados | Desenvolver e agendar script de ETL para SICONFI | Card 'Saúde Fiscal' pendente de dados reais | Script etl/siconfi/collect_financas.py integrado via API ou BigQuery |

### Deploy e Observabilidade

| ID | Area | Pendencia | Evidencia | Saida esperada |
|---|---|---|---|---|
| P1-18 | Deploy | Rodar `npm run build` com env segura | Lotes documentais nao executaram build | Build validado |
| P1-19 | Deploy | Validar Logto em runtime real | `docs/AUTH.md` | Login, callback, logout, painel e admin testados |
| P1-20 | Observabilidade | Instalar monitoramento de erros | `docs/PRODUCAO_READINESS.md` aponta ausencia | Sentry/alternativa com alertas |
| P1-21 | Observabilidade | Monitorar uptime e endpoints criticos | Sem monitoramento confirmado | Uptime para site, app, painel e APIs criticas |
| P1-22 | Observabilidade | Alertar ETL atrasado/falho | `coletas_log` existe; sem alerta | Alerta por fonte e SLA |

## P2 - Qualidade, UX e Hardening

| ID | Area | Pendencia | Evidencia | Saida esperada |
|---|---|---|---|---|
| P2-01 | API | Normalizar erros Postgres expostos ao cliente | APIs retornam `pgError.message` e `code` | Erro publico padronizado + log interno |
| P2-02 | API | Rate limit para busca, analytics, apoio e auth-adjacent | APIs publicas sem limitador identificado | Middleware/edge/rate limit provider |
| P2-03 | API | Decidir destino de `/api/apoio/verificar-pagamento` | API fantasma no frontend | Integrar, proteger ou remover |
| P2-04 | API | Decidir destino de `GET /api/acompanhamentos` | Painel consulta DB direto | Reusar API ou documentar redundancia |
| P2-05 | Frontend | Corrigir `href="#"` e placeholders visuais | `docs/PLACEHOLDER_REPORT.md` | Links reais ou botoes desabilitados com estado |
| P2-06 | Frontend | Reduzir inline styles em telas principais | `docs/DESIGN.md` | Tokens/classes/componentes civicos |
| P2-07 | Frontend | Trocar emojis funcionais por `lucide-react` | `AdminSidebar.tsx` | Iconografia consistente |
| P2-08 | Frontend | QA desktop/mobile das rotas core | Nao executado nos lotes documentais | Sem overflow/sobreposicao |
| P2-09 | Seguranca | Definir CSP e headers customizados | `docs/SECURITY.md` | Headers em `next.config`/Vercel |
| P2-10 | IA | Monitorar custo e limite diario OpenAI | `IA_RESUMO_MAX_GERACOES_DIA` | Dashboard/log de consumo |
| P2-11 | Dependencias | Confirmar orfaos antes de remover | `docs/DEPENDENCIES.md` | `npm ls`, build e PR de limpeza |
| P2-12 | Licencas | Gerar relatorio de licencas/SBOM | Lockfile contem MIT/ISC/Apache/BSD/MPL etc. | Relatorio automatizado |

## P3 - Organizacao e Evolucao

| ID | Area | Pendencia | Saida esperada |
|---|---|---|---|
| P3-01 | Docs | Manter docs incrementais apos cada mudanca relevante | `AI_INSTRUCTIONS.md` obedecido por agentes |
| P3-02 | Docs | Arquivar docs legados com criterio humano | Pasta/archive ou notas de obsolescencia |
| P3-03 | Produto | Definir KPIs publicos do MVP real | Busca, follow, feed, apoio, tempo de atualizacao |
| P3-04 | Produto | Planejar cache client estruturado | SWR/TanStack Query ou padrao interno |
| P3-05 | UI | Criar biblioteca civica de cards/tabelas/status | Menos duplicacao visual |
| P3-06 | Dados | Revisar tabelas fantasmas/subutilizadas trimestralmente | Inventario de DB atualizado |
| P3-07 | Operacao | Criar runbooks para incidentes | Pagamento, auth, DB, ETL, segredo |

## Go/No-Go

| Condicao | Go? |
|---|---|
| Chave Resend ainda ativa ou presente em workspace | No-Go |
| Webhook InfinitePay sem persistencia e sem decisao de seguranca | No-Go para fluxo financeiro produtivo |
| Banco remoto/dev nao validado em ambiente seguro | No-Go para producao plena |
| Build Next.js nao validado | No-Go tecnico |
| ETL sem orquestracao | Go limitado somente se dados forem declarados congelados/manual |
| Feed civico sem pipeline real | Go limitado somente se o painel nao prometer feed produtivo |

## Primeira Ordem de Execucao

1. Resolver P0-01 a P0-03: revogacao e saneamento do segredo Resend.
2. Resolver P0-04 e P0-05: persistencia e autenticidade InfinitePay.
3. Resolver P0-06, P1-18 e P1-19: pre-flight seguro, build e auth runtime.
