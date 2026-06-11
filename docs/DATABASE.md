---
file: docs/DATABASE.md
module: Database Schema Reference
status: Active
related: [docs/BUSINESS_DOMAIN.md, docs/INVENTORY_DATABASE_USAGE.md, docs/GAP_ANALYSIS.md, docs/AUTH.md, db/schema.sql, db/migrations]
---

# Database

Data da consolidacao: 2026-06-02.

Banco alvo identificado no codigo: PostgreSQL direto via pacote `pg`. O repositorio mantem uma estrutura de migrations SQL neutra em `/db`, e o runtime atual do app consulta Postgres diretamente por `Pool`/`pool.query` na VPS.

Pre-flight ativo nao executado: `app/.env.local` indicou host remoto/desconhecido. Pela regra P0, nenhuma conexao ativa foi feita.

## Fonte De Verdade Do Schema

| Fonte | Status | Observacao |
|---|---|---|
| `db/migrations/*.sql` | Fonte principal versionada | Define evolucoes incrementais |
| `db/schema.sql` | Referencia monolitica historica/compilada | Contem schema amplo e muitas politicas |
| `etl/partidos/collect_fundos_tse.py` | Cria tabela nao versionada | `partidos_fundos` aparece aqui, nao em migrations |
| `docs/TODO_PRODUCTION.md` | Proposta futura | `doacoes` documentada como pendente |
| Codigo app | Fonte de uso real | Consulta algumas tabelas nao encontradas no schema versionado |

## Migrations Identificadas

| Migration | Conteudo principal |
|---|---|
| `20260513000000_initial_schema.sql` | Schema base: politicos, partidos, votacoes, gastos, usuarios, candidatos, Senado, feed |
| `20260513120000_v2_12_politicos_campos.sql` | Campos adicionais em `politicos` |
| `20260514183000_politico_resumos_ia.sql` | `politico_resumos_ia`, `politico_resumos_ia_cotas` |
| `20260515180000_restore_public_profile_select_grants.sql` | Grants publicos |
| `20260516000000_proposicoes.sql` | `proposicoes`, `proposicao_autores` |
| `20260517000000_glossario.sql` | `glossario` |
| `20260520000000_emendas.sql` | `emendas`, `fornecedores` |
| `20260520010000_emendas_fix.sql` | Ajustes em `emendas` |
| `20260520100000_admin.sql` | `admin_logs`, `analytics_eventos`, `feature_flags`, `perfis.role` |
| `20260521000000_estados.sql` | `estados_*` |
| `20260522000000_public_grants.sql` | Grants publicos |
| `20260522001000_acompanhamentos_auth_grants.sql` | Grants de `acompanhamentos`/`perfis` |
| `20260522002000_perfis_trigger.sql` | Trigger legado de perfil |
| `20260522003000_glossario_seed.sql` | Seed glossario |
| `20260522004000_emendas_match_municipio.sql` | Match emendas/municipios |
| `20260522005000_proposicao_autores_match.sql` | Match autores/proposicoes/politicos |
| `20260522006000_glossario_dedup.sql` | Deduplicacao glossario |
| `20260522007000_fixes.sql` | Fixes gerais |
| `20260522_proposicao_tramitacoes.sql` | `proposicao_tramitacoes` |
| `20260523b_ale_setup.sql` | `ale_sessoes`, `ale_presencas`, view de presenca estadual |
| `20260601000000_logto_identity_compat.sql` | Colunas `logto_sub`, `supabase_user_id`, `auth_provider`, `migrado_logto_em` em `perfis` |

## ENUMs

| ENUM | Valores |
|---|---|
| `cargo_tipo` | `presidente`, `vice_presidente`, `governador`, `vice_governador`, `senador`, `deputado_federal`, `deputado_estadual`, `prefeito`, `vice_prefeito`, `vereador` |
| `situacao_politico` | `ativo`, `licenciado`, `suplente`, `afastado`, `inativo` |
| `voto_tipo` | `sim`, `nao`, `abstencao`, `ausente`, `obstrucao`, `artigo_17` |
| `impacto_nivel` | `1`, `2`, `3`, `4` |
| `dado_estado` | `oficial`, `parcial`, `atrasado`, `em_processamento`, `indisponivel` |
| `situacao_candidato` | `deferido`, `indeferido`, `cassado`, `pendente` |
| `perfil_candidato` | `em_exercicio`, `ex_mandatario`, `sem_mandato` |
| `correcao_status` | `pendente`, `aprovado`, `rejeitado`, `arquivado` |
| `coleta_status` | `ok`, `atrasado`, `falhou`, `em_andamento` |
| `parse_status_tipo` | `pending`, `parsed`, `error` |

## Tabelas Versionadas

| Tabela | Origem | Papel | Uso real |
|---|---|---|---|
| `municipios` | schema base | Municipios IBGE/TSE | App e ETL |
| `partidos` | schema base | Partidos | App e ETL |
| `temas` | schema base | Categorias tematicas | Schema/ETL potencial |
| `politicos` | schema base | Hub central | App, API, admin, ETL |
| `politico_partidos` | schema base | Historico de filiacao | Schema, pouco/no uso real identificado |
| `redes_sociais` | schema base | Redes do politico | ETL Camara insere; app pouco/no uso |
| `votacoes` | schema base | Votos nominais | App e ETL |
| `gastos` | schema base | Gastos parlamentares | App e ETL |
| `presenca` | schema base | Presenca parlamentar | App consulta; ETL direto pouco identificado |
| `emendas` | schema base + migration | Emendas parlamentares | App, admin, ETL |
| `discursos` | schema base | Discursos | Ghost no app atual |
| `atuacao` | schema base | Agregados/atuacao | Ghost no app atual |
| `candidatos` | schema base | Candidatos 2026 | App e ETL |
| `candidaturas_historico` | schema base | Historico eleitoral | ETL |
| `perfis` | schema base + admin + Logto | Perfil interno/RBAC | App/API/admin |
| `acompanhamentos` | schema base | Follow usuario-politico | App/API |
| `correcoes` | schema base | Correcao cidadã | Schema; rota atual nao identificada |
| `feature_flags` | schema base/admin | Flags | Admin/API |
| `coletas_log` | schema base | Logs ETL | Admin/ETL |
| `politico_resumos_ia` | schema + migration | Cache IA | Server action |
| `politico_resumos_ia_cotas` | schema + migration | Cota IA | Server action |
| `feed_eventos` | schema base | Feed precomputado | ETL TSE; app painel nao usa atualmente |
| `politico_ids` | schema base | Entity resolution Camara | Ghost no app atual |
| `senadores` | schema base | Espelho Senado | ETL |
| `senado_votacoes` | schema base | Votacoes Senado normalizadas | Ghost app; ETL pode usar via `votacoes` consolidada |
| `senado_materias` | schema base | Materias Senado | Ghost no app atual |
| `senado_comissoes` | schema base | Comissoes Senado | Ghost no app atual |
| `senado_discursos` | schema base | Discursos Senado | Ghost no app atual |
| `senado_sessoes` | schema base | Sessoes Senado | Ghost no app atual |
| `politico_senado_ids` | schema base | Entity resolution Senado | Ghost no app atual |
| `raw_senado` | schema base | Bronze layer Senado | Ghost no app atual |
| `proposicoes` | migration | Proposicoes legislativas | App e ETL |
| `proposicao_autores` | migration | Autores de proposicoes | App e ETL |
| `fornecedores` | migration | Fornecedores de emendas | Schema/ETL potencial |
| `glossario` | migration | Glossario civico | App/API |
| `admin_logs` | migration | Auditoria admin | APIs admin |
| `analytics_eventos` | migration | Analytics interno | API/admin |
| `estados_info` | migration | Metadados UF | Schema; uso direto nao identificado |
| `estados_economia` | migration | Indicadores UF | App/ETL |
| `estados_governos` | migration | Governadores | App/ETL |
| `estados_ale` | migration | Assembleia estadual | App |
| `estados_pacto_federativo` | migration | STN/transferencias | App/ETL |
| `estados_tribunais` | migration | Tribunais estaduais | App/ETL |
| `estados_timeline` | migration | Timeline UF | App |
| `proposicao_tramitacoes` | migration | Tramites Camara | App/ETL |
| `ale_sessoes` | migration | Sessoes ALE | ETL/schema |
| `ale_presencas` | migration | Presenca ALE | ETL/app indireto |

## Tabelas Referenciadas Mas Nao Versionadas

| Tabela | Referencia | Status | Risco |
|---|---|---|---|
| `doacoes` | `docs/TODO_PRODUCTION.md`, webhook comentado | Nao encontrada em migrations | Pagamentos sem persistencia |
| `partidos_fundos` | `etl/partidos/collect_fundos_tse.py`, `(site)/partidos/page.tsx` | Criada por script ETL, nao por migration | Deploy limpo pode quebrar pagina de partidos |
| `candidatos_bens` | `(site)/candidatos-2026/[slug]/page.tsx` | Nao encontrada em migrations; codigo faz `catch` | Bens patrimoniais podem nunca aparecer |

## Relacionamentos Estruturais

| Origem | Destino | Tipo | Observacao |
|---|---|---|---|
| `politicos.partido_id` | `partidos.id` | N:1 | Join central em busca/perfil |
| `politicos.municipio_id` | `municipios.id` | N:1 | Naturalidade/domicilio |
| `politico_partidos.politico_id` | `politicos.id` | N:1 | Historico |
| `politico_partidos.partido_id` | `partidos.id` | N:1 | Historico |
| `redes_sociais.politico_id` | `politicos.id` | N:1 | Redes |
| `votacoes.politico_id` | `politicos.id` | N:1 | Votos |
| `votacoes.tema_id` | `temas.id` | N:1 | Tema |
| `gastos.politico_id` | `politicos.id` | N:1 | Gastos |
| `presenca.politico_id` | `politicos.id` | N:1 | Presenca |
| `emendas.politico_id` | `politicos.id` | N:1 | Emendas |
| `discursos.politico_id` | `politicos.id` | N:1 | Discursos |
| `discursos.tema_id` | `temas.id` | N:1 | Tema |
| `atuacao.politico_id` | `politicos.id` | N:1 | Agregado |
| `candidatos.politico_id` | `politicos.id` | N:1 nullable | Candidato com mandato |
| `candidatos.partido_id` | `partidos.id` | N:1 | Partido |
| `candidatos.municipio_id` | `municipios.id` | N:1 | Municipio |
| `candidaturas_historico.politico_id` | `politicos.id` | N:1 nullable | Historico |
| `candidaturas_historico.candidato_id` | `candidatos.id` | N:1 nullable | Historico |
| `acompanhamentos.usuario_id` | `perfis.id` | N:1 | Usuario interno |
| `acompanhamentos.politico_id` | `politicos.id` | N:1 | Politico seguido |
| `correcoes.politico_id` | `politicos.id` | N:1 nullable | Correcao |
| `feed_eventos.politico_id` | `politicos.id` | N:1 | Feed precomputado |
| `senadores.politico_id` | `politicos.id` | N:1 | Senado |
| `senadores.partido_id` | `partidos.id` | N:1 | Senado |
| `senado_votacoes.senador_id` | `senadores.id` | N:1 | Senado |
| `senado_votacoes.tema_id` | `temas.id` | N:1 | Tema |
| `politico_senado_ids.politico_id` | `politicos.id` | N:1 | Entity resolution |
| `proposicao_autores.proposicao_id` | `proposicoes.id` | N:1 | Autoria |
| `proposicao_autores.politico_id` | `politicos.id` | N:1 nullable | Autoria reconhecida |
| `ale_presencas.politico_id` | `politicos.id` | N:1 | ALE |
| `ale_presencas.sessao_id` | `ale_sessoes.id` | N:1 nullable | ALE |

## Tabelas Centrais: Estrutura Operacional

### `politicos`

Tabela hub. Campos-chave identificados no schema/codigo:

| Campo | Papel |
|---|---|
| `id` | UUID primario |
| `slug` | Rota publica |
| `nome`, `nome_civil`, `nome_eleitoral` | Identidade |
| `cargo`, `uf`, `situacao` | Mandato |
| `partido_id` | Partido atual |
| `id_camara`, `id_senado`, `id_tse`, `id_ale`, `codigo_siafi` | Entity resolution |
| `presenca_pct_atual`, `gasto_total_ano`, `total_votacoes` | Agregados usados na UI |
| `dado_estado`, `source_id`, `source_record_id`, `collected_at` | Qualidade/lineage |
| `logicamente removido` | `removido_em` |

### `perfis`

Tabela de usuario interno.

| Campo | Papel |
|---|---|
| `id` | UUID interno, historicamente ligado a `auth.users` |
| `nome` | Nome exibido |
| `role` | RBAC admin/user |
| `logto_sub` | Subject externo Logto |
| `supabase_user_id` | Compat legado |
| `auth_provider` | `supabase` ou `logto` |
| `migrado_logto_em` | Timestamp de migracao |

### `acompanhamentos`

Tabela do core loop autenticado.

| Campo | Papel |
|---|---|
| `usuario_id` | Perfil interno |
| `politico_id` | Politico seguido |
| Unique esperado | Par usuario/politico para evitar duplicidade |

### `votacoes`, `gastos`, `presenca`, `emendas`

Conjunto de atuacao parlamentar. Todas usam `politico_id` e alimentam perfil/painel. `votacoes` tambem se conecta a `proposicao_id` em usos recentes do app, embora o schema inicial tenha evoluido por migrations.

## Views Citadas/Usadas

| View | Uso identificado |
|---|---|
| `v_emendas_municipio` | `(site)/cidades/page.tsx` |
| `v_presenca_deputado_estadual` | Criada na migration ALE; uso direto no app nao identificado |
| `feed_usuario`, `resumo_politico`, `fila_ia_pendente`, `ultima_coleta_por_fonte`, `v_ranking_emendas`, `v_fornecedores_comuns` | Citadas na documentacao/schema legado; uso app atual nao confirmado |

## RLS E Acesso

RLS aparece habilitado para as tabelas principais no schema/migrations. O modelo legado ainda usa `auth.uid()`/`auth.jwt()` em politicas, enquanto o runtime app atual usa Logto e consultas diretas por `pg`.

Risco: se o app usa credencial Postgres direta com permissao ampla, RLS pode nao proteger como esperado dependendo do role de conexao. Isso precisa de validacao em ambiente real.

| Grupo | Politica observada |
|---|---|
| Dados publicos | `FOR SELECT USING (true)` |
| `perfis` | Acesso proprio via `auth.uid()` no modelo legado |
| `acompanhamentos` | Acesso proprio via `auth.uid()` no modelo legado |
| Admin | `auth.jwt()->>'role' = 'admin'` ou existencia em `perfis` |
| `raw_senado`/logs | Admin-only |

## Lineage E ETL

Padrao recorrente nas tabelas de dados:

| Campo | Papel |
|---|---|
| `source_id` | Fonte do dado |
| `source_record_id` | ID original |
| `collected_at` | Momento da coleta |
| `dado_estado` | Qualidade/frescor |

ETLs usam `ON CONFLICT ... DO UPDATE` para idempotencia em varias tabelas. `coletas_log` registra execucoes.

## Gaps De Schema

| Gap | Evidencia | Severidade |
|---|---|---|
| `doacoes` ausente | Somente docs/TODO e pseudo-codigo comentado | P0/P1 |
| `partidos_fundos` fora das migrations | Criada dentro de script ETL | P1/P2 |
| `candidatos_bens` ausente | Codigo tenta consultar e captura erro | P2 |
| Politicas RLS legadas com Logto | `auth.uid()`/`auth.jwt()` no SQL, Logto no runtime | P1 |
| Muitos `new Pool()` | Conexao duplicada no app | P2 |

## Conclusao

O schema e amplo e sustenta boa parte do produto real. O ponto critico e a diferenca entre schema versionado, tabelas criadas por scripts e tabelas que o codigo espera mas nao existem nas migrations. Antes de producao, `doacoes`, `partidos_fundos` e `candidatos_bens` precisam ser resolvidas explicitamente, e o modelo RLS/Auth precisa ser validado contra o runtime Logto + Postgres direto.

