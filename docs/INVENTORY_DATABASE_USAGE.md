---
file: docs/INVENTORY_DATABASE_USAGE.md
module: Inventory Database Usage
status: Active
related: [docs/DATABASE.md, docs/BUSINESS_DOMAIN.md, docs/API.md, docs/INVENTORY_API_CONSUMPTION.md, docs/GAP_ANALYSIS.md]
---

# Inventory Database Usage

Data do inventario: 2026-06-02.

Este documento responde: **o codigo realiza queries nestas tabelas?** A classificacao separa schema teorico, uso pelo app/backend, uso por ETL e tabelas fantasmas.

## Legenda CRUD

| Letra | Significado |
|---|---|
| C | `INSERT`/criacao |
| R | `SELECT`/leitura |
| U | `UPDATE`/upsert |
| D | `DELETE` |

## Resumo

| Categoria | Tabelas |
|---|---:|
| Tabelas versionadas identificadas | 46 |
| Tabelas com uso direto no app/backend | 27 aprox. |
| Tabelas usadas por ETL | 24 aprox. |
| Tabelas sem uso app/backend identificado | 15+ |
| Tabelas referenciadas mas nao versionadas | 3 |

## Tabelas Ativas No App/Backend

| Tabela | CRUD app/backend | Arquivos principais | Status de uso |
|---|---|---|---|
| `politicos` | R/U | `/api/busca`, `politicos/[id]/page.tsx`, `/painel`, `/comparar`, `/admin/dados`, `/api/admin/politicos/[id]`, estados, Camara, partidos, projetos | Ativa |
| `partidos` | R | `/api/busca`, perfil, candidatos, estados, Camara, partidos, projetos | Ativa |
| `votacoes` | R | Home, perfil, painel, Camara, projetos, partidos | Ativa |
| `gastos` | R | Perfil, painel, Camara, partidos | Ativa |
| `presenca` | R | Perfil de politico | Ativa parcial |
| `emendas` | R/U | Perfil, estado, admin dados, `/api/admin/emendas/match` | Ativa |
| `perfis` | R/U | `current-user`, `profile-linking`, painel, admin usuarios, admin home | Ativa |
| `acompanhamentos` | C/R/D | `/api/acompanhamentos`, `/api/acompanhamentos/[politicoId]`, painel | Ativa core MVP |
| `glossario` | R | `/api/glossario/[slug]`, `/glossario`, `/glossario/[slug]` | Ativa |
| `proposicoes` | R | `/projetos`, `/projetos/[slug]`, `/proposicoes`, `/proposicoes/[slug]`, Camara | Ativa |
| `proposicao_autores` | R | Projetos e proposicoes detalhe | Ativa |
| `proposicao_tramitacoes` | R | `/projetos/[slug]` | Ativa parcial |
| `candidatos` | R | `/candidatos-2026`, `/candidatos-2026/[slug]` | Ativa parcial |
| `feature_flags` | R/U | `/admin/flags`, `/api/admin/flags` | Ativa admin |
| `admin_logs` | C | `/api/admin/politicos/[id]`, `/api/admin/flags`, `/api/admin/emendas/match`, `/api/admin/etl/run` | Ativa admin |
| `analytics_eventos` | C/R | `/api/analytics`, `/admin/analytics` | Ativa parcial |
| `coletas_log` | R | `/admin`, `/admin/etl` | Ativa leitura admin |
| `politico_resumos_ia` | C/R/U | `app/src/actions/resumo-interpretativo.ts` | Ativa IA |
| `politico_resumos_ia_cotas` | C/R/U | `app/src/actions/resumo-interpretativo.ts` | Ativa IA |
| `municipios` | R | `/estado/[sigla]`, `/cidades`, `MeuEstadoContent` | Ativa parcial |
| `estados_governos` | R | `/estado/[sigla]` | Ativa |
| `estados_economia` | R | `/estado/[sigla]` | Ativa |
| `estados_pacto_federativo` | R | `/estado/[sigla]` | Ativa |
| `estados_tribunais` | R | `/estado/[sigla]` | Ativa |
| `estados_timeline` | R | `/estado/[sigla]` | Ativa |
| `estados_ale` | R | `/estado/[sigla]` | Ativa |
| `ale_presencas` | R indireto/ETL | `update_presenca_pct.py`; app estadual usa dados agregados/placeholder | ETL/ativa parcial |

## Tabelas Usadas Por ETL

| Tabela | CRUD ETL | Arquivos |
|---|---|---|
| `partidos` | C/R/U | `collect_deputados.py`, `collect_senadores.py`, `collect_eleitos_2022.py`, `collect_candidatos_2026.py`, `seed_partido_info.py` |
| `politicos` | C/R/U | Camara, Senado, TSE, ALE, Portal Transparencia, update presenca |
| `redes_sociais` | C | `etl/camara/collect_deputados.py` |
| `votacoes` | C/R/U | `collect_votacoes.py`, `collect_senado_votacoes.py`, ALE scripts, `link_votacoes_proposicoes.py` |
| `gastos` | C/R/U | `collect_camara_gastos.py`, `collect_senado_gastos.py`, ALE despesas |
| `emendas` | C/R/U | `collect_emendas.py`, `populate_siafi.py` |
| `candidatos` | C/U | `collect_candidatos_2026.py` |
| `candidaturas_historico` | C/R | `collect_eleitos_2022.py`, `collect_candidatos_2026.py` |
| `feed_eventos` | C/R | `collect_candidatos_2026.py` |
| `coletas_log` | C | Quase todos os ETLs |
| `proposicoes` | C/R/U | `collect_proposicoes.py`, `collect_tramitacoes.py`, ALE proposicoes, IA |
| `proposicao_autores` | C/D | `collect_proposicoes.py` |
| `proposicao_tramitacoes` | C/R/U | `collect_tramitacoes.py` |
| `municipios` | R/U | `collect_municipios.py` |
| `estados_economia` | C/R/U | `collect_estados_ibge.py` |
| `estados_governos` | C | `seed_governos_tribunais.py` |
| `estados_tribunais` | C | `seed_governos_tribunais.py` |
| `estados_pacto_federativo` | C/U | `collect_pacto_federativo.py` |
| `ale_presencas` | C/R | ALE scripts, `update_presenca_pct.py` |
| `senadores` | C/U | `collect_senadores.py` |
| `politico_resumos_ia*` | Nao ETL; app action | Server action |
| `partidos_fundos` | C/R/U | `collect_fundos_tse.py`, app partidos |

### Arquivos TXT/CSV De ETL, Seed E Referencia

| Arquivo | Tipo | Classificacao v4.0 | Uso Operacional | Acao |
|---|---|---|---|---|
| `requirements.txt` | TXT tecnico | Referencia de runtime ETL Python | Declara dependencias de coleta/carga (`requests`, `psycopg[binary]`, `python-dotenv`, `python-dateutil`, `unidecode`). Nao e dump, mas confirma que o pipeline Python espera acesso PostgreSQL/Supabase e leitura de `.env`. | Manter como referencia de ETL; alinhar com `etl/README.md` quando a orquestracao for formalizada. |
| `docs/stitch_wireframes_match.csv` | CSV documental | Matriz historica de wireframes x rotas | Nao contem massa bruta de politicos, gastos ou emendas. Funciona como artefato de validacao visual/produto, cruzando wireframes com rotas como `/busca`, `/painel`, `/politicos/[id]`, `/comparar`, `/proposicoes`, `/estado/[sigla]`, `/candidatos-2026` e lacunas sem rota. | Referenciado em `BUSINESS_DOMAIN.md` e `GAP_ANALYSIS.md`; sugerir arquivamento apos incorporacao canonica `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_analysis.txt` | TXT temporario | Export tecnico/visual obsoleto | Export avulso relacionado ao wireframe "App / Painel civico pessoal (logado)"; nao contem seed, dump ou tabela importavel. | Remover da arvore `app/` somente apos validacao humana; sugerir `docs/archive/` `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_text_only.txt` | TXT temporario | Export tecnico/visual obsoleto | Variante textual do mesmo material de painel civico pessoal; util apenas como evidencia historica de requisito de dashboard autenticado. | Remover da arvore `app/` somente apos validacao humana; sugerir `docs/archive/` `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_structure.txt` | TXT temporario | Export tecnico/visual obsoleto | Variante estrutural/HTML do wireframe de painel civico pessoal, com payload de fonte/markup nao operacional. | Remover da arvore `app/` somente apos validacao humana; sugerir `docs/archive/` `[REQUER_CONFIRMAÇÃO_HUMANA]`. |
| `app/temp_clean_text.txt` | TXT temporario | Export tecnico/visual obsoleto | Variante limpa/textual do wireframe de painel civico pessoal; nao e insumo de banco. | Remover da arvore `app/` somente apos validacao humana; sugerir `docs/archive/` `[REQUER_CONFIRMAÇÃO_HUMANA]`. |

Resultado da varredura: nenhum CSV bruto de politicos, gastos, emendas, votos ou prestacao de contas foi encontrado entre os arquivos extras avaliados. O unico CSV localizado e documental/visual, nao uma massa de seed.

## Tabelas Fantasmas Ou Subutilizadas

Tabela fantasma aqui significa: existe no schema versionado, mas **nao foi identificado uso direto pelo backend/app atual**. Algumas sao usadas por ETL ou planejadas para fases futuras.

| Tabela | Status | Motivo |
|---|---|---|
| `temas` | Fantasma app | Schema tem tema, mas app atual nao consulta diretamente |
| `politico_partidos` | Fantasma app | Historico partidario nao consultado no app atual |
| `discursos` | Fantasma app | Nenhuma query app/ETL ativa relevante no inventario atual |
| `atuacao` | Fantasma app | Tabela de agregados nao usada pelo app |
| `correcoes` | Fantasma app | Fluxo `/correcao` nao identificado no App Router atual |
| `politico_ids` | Fantasma app | Entity resolution historico, sem leitura app |
| `senado_votacoes` | Fantasma app | App usa `votacoes` consolidada, nao tabela Senado especifica |
| `senado_materias` | Fantasma app | Sem leitura app |
| `senado_comissoes` | Fantasma app | Perfil app mostra comissoes em breve; tabela nao consultada |
| `senado_discursos` | Fantasma app | Sem leitura app |
| `senado_sessoes` | Fantasma app | Sem leitura app |
| `politico_senado_ids` | Fantasma app | Entity resolution, sem leitura app |
| `raw_senado` | Fantasma app/admin | Bronze layer sem tela/worker identificado |
| `fornecedores` | Fantasma app | Migration cria, app nao consulta diretamente |
| `estados_info` | Subutilizada | Schema seed, mas pagina de estado usa config e outras `estados_*` |
| `ale_sessoes` | Fantasma app | ETL/schema; app nao consulta diretamente |

## Tabelas Referenciadas Mas Ausentes Das Migrations

| Tabela | Referencia no codigo/docs | Risco | Acao |
|---|---|---|---|
| `doacoes` | `webhooks/infinitepay` comentado, `TODO_PRODUCTION.md` | P0/P1: pagamento nao persiste | Criar migration e implementar webhook |
| `partidos_fundos` | `(site)/partidos/page.tsx:78`, `etl/partidos/collect_fundos_tse.py:154` | P1/P2: pagina pode quebrar em banco limpo | Versionar migration |
| `candidatos_bens` | `(site)/candidatos-2026/[slug]/page.tsx:103` | P2: bens patrimoniais ausentes | Criar migration ou remover consulta |

## CRUD Por Fluxo

### Busca

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `app/src/app/api/busca/route.ts` | `politicos`, `partidos` | R |
| `app/src/components/busca/BuscaClient.tsx` | via API | R indireto |

### Perfil Politico

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `app/src/app/(app)/politicos/[id]/page.tsx` | `politicos`, `partidos`, `votacoes`, `gastos`, `presenca`, `emendas` | R |

### Acompanhamento

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `app/src/app/api/acompanhamentos/route.ts` | `acompanhamentos` | C/R |
| `app/src/app/api/acompanhamentos/[politicoId]/route.ts` | `acompanhamentos` | D |
| `app/src/app/(painel)/(dashboard)/painel/page.tsx` | `perfis`, `acompanhamentos`, `politicos`, `partidos`, `votacoes`, `gastos` | R |

### Auth/Perfil Interno

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `app/src/lib/auth/profile-linking.ts` | `perfis`, `auth.users` | R/U |
| `app/src/lib/auth/current-user.ts` | via profile-linking | R |
| `app/src/app/(admin)/admin/usuarios/page.tsx` | `perfis`, `auth.users` | R |

### Admin

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `/admin/page.tsx` | `politicos`, `emendas`, `gastos`, `votacoes`, `proposicoes`, `municipios`, `perfis`, `coletas_log` | R |
| `/admin/flags/page.tsx` | `feature_flags` | R |
| `/api/admin/flags/route.ts` | `feature_flags`, `admin_logs` | U/C |
| `/api/admin/politicos/[id]/route.ts` | `politicos`, `admin_logs` | U/C |
| `/api/admin/emendas/match/route.ts` | `politicos`, `emendas`, `admin_logs` | R/U/C |
| `/api/admin/etl/run/route.ts` | `admin_logs` | C |
| `/admin/analytics/page.tsx` | `analytics_eventos` | R |

### IA

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `app/src/actions/resumo-interpretativo.ts` | `politico_resumos_ia_cotas`, `politico_resumos_ia` | C/R/U |
| `etl/ia/simplificar_proposicoes.py` | `proposicoes` | R/U |

### Pagamentos

| Arquivo | Tabelas | Operacoes |
|---|---|---|
| `app/src/app/api/apoio/criar-link/route.ts` | Nenhuma tabela | Chama InfinitePay |
| `app/src/app/api/webhooks/infinitepay/route.ts` | `doacoes` comentada/ausente | Nenhuma operacao real |

## Riscos De Integridade

| Risco | Evidencia | Impacto |
|---|---|---|
| `doacoes` nao existe | Ausente das migrations | Perda de dados financeiros |
| Tabelas fora da migration | `partidos_fundos` criada por script | Ambientes novos inconsistentes |
| Fallback `auth.users` | `profile-linking.ts`, admin usuarios | Dependencia legado Supabase Auth |
| RLS legado vs Postgres direto | SQL usa `auth.uid()`, app usa `pg` | Modelo de seguranca precisa validacao |
| Ghost tables | Senado/discursos/atuacao/correcoes | Schema maior que produto real |

## Conclusao

O banco tem cobertura ampla e o app realmente consulta varias tabelas centrais. O core loop usa `politicos`, `partidos`, `votacoes`, `gastos`, `perfis` e `acompanhamentos`. As maiores lacunas sao: `doacoes` ausente, `partidos_fundos` fora das migrations, `candidatos_bens` sem schema versionado, e varias tabelas planejadas/futuras que ainda nao participam do produto atual.
