---
file: docs/DATABASE.md
module: Database Schema Reference
status: Active
related: [docs/ARCHITECTURE.md, docs/AUTH.md, docs/ENVIRONMENT.md, docs/auth/AUTH_MIGRATION_LOGTO.md, docs/adr/ADR-001-logto-as-identity-provider.md, supabase/migrations/]
---

# Banco de Dados — Schema v2.12

**Engine:** PostgreSQL 15 (Supabase self-hosted)
**Host produção:** `45.32.169.173` (VPS Vultr via Coolify + Docker)
**URL pública:** `https://supabase.meuspoliticos.com.br`
**Schema atual:** v2.12 + compat Logto — 21 migrations aplicadas (jun/2026)

> ⚠️ **Regra P0:** NUNCA conectar ao banco de produção durante análise de código. Toda análise de schema deve usar os arquivos em `supabase/migrations/`.

> **Nota de legado Auth:** referencias a `auth.users`, `auth.uid()`,
> `auth.jwt()`, roles `anon/authenticated/service_role` e RLS Supabase refletem
> o estado atual/legado. A arquitetura alvo aprovada e Logto + PostgreSQL VPS.
> Ver `docs/auth/AUTH_MIGRATION_LOGTO.md` e
> `docs/adr/ADR-001-logto-as-identity-provider.md`.

---

## 1. Fonte de verdade do schema

| Item | Localização | Status |
|---|---|---|
| Schema atual | `supabase/migrations/` (20+ arquivos) | ✅ Fonte canônica |
| Schema monolítico legado | `supabase/001_schema.sql` | ⚠️ Referência histórica apenas |
| Seeds de desenvolvimento | `supabase/seeds/` | Seeds do glossário |
| Tipos TypeScript gerados | `app/src/lib/supabase/types.ts` | Gerado do schema |

---

## 2. Histórico de versões (changelog das migrations)

| Migration | Versão | Data | Conteúdo principal |
|---|---|---|---|
| `20260513000000_initial_schema.sql` | v2.11 | 2026-05-13 | Schema completo — todas as tabelas base, Fase 1 (Câmara) e Fase 2 (Senado) |
| `20260513120000_v2_12_politicos_campos.sql` | v2.12 | 2026-05-13 | Campos de gabinete e dados pessoais em `politicos` |
| `20260514183000_politico_resumos_ia.sql` | — | 2026-05-14 | Tabelas `politico_resumos_ia` e `politico_resumos_ia_cotas` |
| `20260515180000_restore_public_profile_select_grants.sql` | — | 2026-05-15 | Grants de SELECT restaurados para `anon` e `authenticated` |
| `20260516000000_proposicoes.sql` | — | 2026-05-16 | Tabelas `proposicoes` e `proposicao_autores` |
| `20260517000000_glossario.sql` | — | 2026-05-17 | Tabela `glossario` com campos semânticos |
| `20260520000000_emendas.sql` | — | 2026-05-20 | Tabelas `emendas`, `fornecedores`, views analíticas de emendas |
| `20260520010000_emendas_fix.sql` | — | 2026-05-20 | Correções na tabela `emendas` |
| `20260520100000_admin.sql` | — | 2026-05-20 | Tabelas `admin_logs`, `analytics_eventos`, coluna `perfis.role` |
| `20260521000000_estados.sql` | — | 2026-05-21 | 7 tabelas de estados + seeds de 27 estados + dados econômicos |
| `20260522000000_public_grants.sql` | — | 2026-05-22 | Grants públicos para leitura anon |
| `20260522001000_acompanhamentos_auth_grants.sql` | — | 2026-05-22 | Grants autenticados para acompanhamentos |
| `20260522002000_perfis_trigger.sql` | — | 2026-05-22 | Trigger `on_auth_user_created` — cria perfil automático |
| `20260522003000_glossario_seed.sql` | — | 2026-05-22 | Seed de 50 termos do glossário cívico |
| `20260522004000_emendas_match_municipio.sql` | — | 2026-05-22 | Cruzamento emendas × municípios |
| `20260522005000_proposicao_autores_match.sql` | — | 2026-05-22 | Match autores proposição × politicos |
| `20260522006000_glossario_dedup.sql` | — | 2026-05-22 | Deduplicação do glossário |
| `20260522007000_fixes.sql` | — | 2026-05-22 | Correções gerais |
| `20260522_proposicao_tramitacoes.sql` | — | 2026-05-22 | Tabela `proposicao_tramitacoes` |
| `20260523b_ale_setup.sql` | — | 2026-05-23 | ALE: `ale_sessoes`, `ale_presencas`, view `v_presenca_deputado_estadual` |
| `20260601000000_logto_identity_compat.sql` | — | 2026-06-01 | Compatibilidade Logto: `logto_sub`, `supabase_user_id`, `auth_provider`, `migrado_logto_em` |

---

## 3. ENUMs

| ENUM | Valores | Uso |
|---|---|---|
| `cargo_tipo` | `presidente`, `vice_presidente`, `governador`, `vice_governador`, `senador`, `deputado_federal`, `deputado_estadual`, `prefeito`, `vice_prefeito`, `vereador` | Cargo de políticos e candidatos |
| `situacao_politico` | `ativo`, `licenciado`, `suplente`, `afastado`, `inativo` | Status do mandato |
| `voto_tipo` | `sim`, `nao`, `abstencao`, `ausente`, `obstrucao`, `artigo_17` | Resultado de votação nominal |
| `impacto_nivel` | `'1'` (baixo), `'2'` (médio), `'3'` (alto), `'4'` (crítico) | Prioridade no feed de atividades |
| `dado_estado` | `oficial`, `parcial`, `atrasado`, `em_processamento`, `indisponivel` | Qualidade/frescor do dado |
| `situacao_candidato` | `deferido`, `indeferido`, `cassado`, `pendente` | Status da candidatura TSE |
| `perfil_candidato` | `em_exercicio`, `ex_mandatario`, `sem_mandato` | Tipo de perfil do candidato 2026 |
| `correcao_status` | `pendente`, `aprovado`, `rejeitado`, `arquivado` | Fluxo de correção de dados |
| `coleta_status` | `ok`, `atrasado`, `falhou`, `em_andamento` | Status de execução de ETL |
| `parse_status_tipo` | `pending`, `parsed`, `error` | Ciclo de vida Bronze layer (raw_senado) |

---

## 4. Tabelas — Mapa Completo

### 4.1 Dados públicos — Estrutura política

| Tabela | Linhas aprox. | Descrição |
|---|---|---|
| `municipios` | ~5.570 | Municípios IBGE com código TSE para cruzamento |
| `partidos` | ~30 | Partidos políticos com cor, logo, número eleitoral |
| `temas` | 9 | Categorias de votações/projetos — seed fixo |
| `politicos` | ~1.680 | Hub central — dep. federais + senadores + governadores + dep. estaduais |
| `politico_partidos` | variável | Histórico de filiações ("PSL → PL → União") |
| `redes_sociais` | variável | Perfis em redes por político |

### 4.2 Dados de atuação parlamentar

| Tabela | Fonte | Linhas aprox. |
|---|---|---|
| `votacoes` | Câmara API v2 | ~379k |
| `gastos` | CEAP (Câmara) + CEAPS (Senado) | ~567k |
| `presenca` | Câmara API — eventos | ⬜ ETL pendente |
| `emendas` | Portal da Transparência | ~16.6k |
| `discursos` | Câmara API | — |
| `atuacao` | Calculado (fase 2) | — |
| `feed_eventos` | ETL múltiplas fontes | — |

### 4.3 Candidatos 2026 (TSE)

| Tabela | Descrição |
|---|---|
| `candidatos` | Candidatos registrados no TSE para 2026 |
| `candidaturas_historico` | Histórico eleitoral desde 1994 |

### 4.4 Senado Federal (Fase 2)

| Tabela | Fonte | Linhas aprox. |
|---|---|---|
| `senadores` | API Senado (`legis.senado.leg.br`) | ~81 |
| `senado_votacoes` | API Senado | ~13k |
| `senado_materias` | API Senado | — |
| `senado_comissoes` | API Senado | — |
| `senado_discursos` | API Senado | — |
| `senado_sessoes` | API Senado | — |
| `politico_senado_ids` | Entity resolution (CPF âncora) | — |
| `raw_senado` | Bronze layer — XML bruto + SHA-256 | — |

### 4.5 Proposições legislativas

| Tabela | Descrição |
|---|---|
| `proposicoes` | PLs, PECs, PLPs, PDLs, MPVs (~57k da Câmara) |
| `proposicao_autores` | Autores de cada proposição (soft FK para `politicos`) |
| `proposicao_tramitacoes` | Histórico de tramitação na Câmara |

### 4.6 Estados e Assembleias

| Tabela | Descrição |
|---|---|
| `estados_info` | Dados institucionais dos 27 estados (seed completo) |
| `estados_economia` | Indicadores econômicos anuais por estado (IBGE 2022/2023) |
| `estados_governos` | Histórico de governadores |
| `estados_ale` | Dados da Assembleia Legislativa por legislatura |
| `estados_pacto_federativo` | Transferências intergovernamentais (STN 2023) |
| `estados_tribunais` | TCE, TJ, MP, Defensoria por estado |
| `estados_timeline` | Eventos históricos e políticos por estado |
| `ale_sessoes` | Sessões plenárias/comissões das ALEs |
| `ale_presencas` | Presença individual de dep. estaduais por sessão |

### 4.7 Usuários e plataforma

| Tabela | RLS | Descrição |
|---|---|---|
| `perfis` | `auth.uid() = id` | Perfil de usuário (1:1 com `auth.users`; compatibilizado com `logto_sub`, `supabase_user_id`, `auth_provider`, `migrado_logto_em`) |
| `acompanhamentos` | `auth.uid() = usuario_id` | Políticos seguidos por usuário |
| `correcoes` | INSERT público / ALL admin | Fluxo de correção de dados públicos |
| `feature_flags` | Admin only | Flags de features gerenciadas sem deploy |
| `admin_logs` | Admin only | Log de ações administrativas |
| `analytics_eventos` | Admin only | Eventos de analytics da plataforma |

### 4.8 IA e glossário

| Tabela | Descrição |
|---|---|
| `politico_resumos_ia` | Cache de resumos interpretativos gerados por IA |
| `politico_resumos_ia_cotas` | Controle de cota diária de geração por político |
| `glossario` | 50 termos cívicos com definição simples e técnica |
| `coletas_log` | Log de execução de todos os ETLs |

### 4.9 Entity resolution

| Tabela | Propósito |
|---|---|
| `politico_ids` | Câmara API v1 (`ideCadastro`) ↔ v2 (`id`) |
| `politico_senado_ids` | Câmara ↔ Senado (CPF como âncora no ETL — nunca persistido) |

---

## 5. Tabela `politicos` — campos completos

A tabela central do sistema. Todos os outros dados se relacionam via `politicos.id`.

```
id             uuid PK
nome           text
nome_civil     text
nome_eleitoral text                    — nome na urna (Câmara API)
slug           text UNIQUE             — URL: 'nikolas-ferreira-dep-federal-mg'
partido_id     uuid → partidos.id
uf             text
cargo          cargo_tipo
situacao       situacao_politico
mandato_inicio date
mandato_fim    date
numero_mandato integer
foto_url       text
foto_fonte     text                    — 'camara.leg.br' | 'senado.leg.br' | 'tse.jus.br'
email          text
data_nascimento date
naturalidade   text
escolaridade   text
ocupacao       text
sexo           text                    — 'M' | 'F' (v2.12)
uf_nascimento  char(2)                 — (v2.12)
data_falecimento date                  — null se vivo (v2.12)
gabinete_nome  text                    — (v2.12)
gabinete_telefone text                 — (v2.12)
gabinete_email text                    — (v2.12)
id_camara      integer UNIQUE          — ID Câmara API v2
id_senado      integer UNIQUE          — ID Senado API
id_tse         text
id_ale         text                    — ID na ALE (20260523b)
codigo_siafi   text UNIQUE             — CGU/SIAFI — código do autor em emendas
municipio_id   uuid → municipios.id
presenca_pct_atual  numeric(5,2)       — cache calculado diariamente
gasto_total_ano     numeric(14,2)      — cache calculado diariamente
total_votacoes      integer            — cache calculado diariamente
total_emendas_ano   numeric(15,2)      — (20260520)
total_emendas_historico numeric(15,2)  — (20260520)
source_id      text                    — lineage: 'camara_deputados' | 'senado' | 'tse'
source_record_id text
collected_at   timestamptz
dado_estado    dado_estado
removido_em    timestamptz             — soft delete
criado_em      timestamptz
atualizado_em  timestamptz
```

---

## 6. Views

| View | Propósito |
|---|---|
| `feed_usuario` | Feed unificado (votações + gastos + discursos + feed_eventos) para políticos acompanhados pelo usuário |
| `resumo_politico` | Agregado por político: presença, gastos, votações, seguidores |
| `fila_ia_pendente` | Itens aguardando processamento por IA (`ia_processado = false`) |
| `ultima_coleta_por_fonte` | Último status de coleta por fonte/tipo — exibido em `/admin` e `/status` |
| `v_ranking_emendas` | Ranking de parlamentares por total de emendas pagas |
| `v_emendas_municipio` | Emendas agregadas por município com per capita |
| `v_fornecedores_comuns` | Fornecedores comuns entre gabinetes (análise de concentração) |
| `v_presenca_deputado_estadual` | Percentual de presença de dep. estaduais em ALEs |

---

## 7. Row Level Security (RLS)

RLS ativo em todas as tabelas. Modelo de acesso:

| Política | Tabelas |
|---|---|
| `FOR SELECT USING (true)` — qualquer um lê | Todas as tabelas de dados públicos: `municipios`, `partidos`, `temas`, `politicos`, `votacoes`, `gastos`, `presenca`, `emendas`, `candidatos`, `proposicoes`, `estados_*`, `ale_*`, `glossario` |
| `FOR ALL USING (auth.uid() = id)` | `perfis` — usuário acessa apenas seu próprio perfil |
| `FOR ALL USING (auth.uid() = usuario_id)` | `acompanhamentos` — usuário acessa apenas seus |
| `FOR INSERT WITH CHECK (true)` | `correcoes` — qualquer um pode submeter |
| `FOR ALL USING (auth.jwt() ->> 'role' = 'admin')` | `coletas_log`, `raw_senado`, `admin_logs`, `feature_flags`, `analytics_eventos` |
| `FOR ALL USING (EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin'))` | Alternativa admin usada em algumas tabelas |
| `FOR ALL USING (auth.jwt() ->> 'role' = 'admin')` | `politico_resumos_ia`, `politico_resumos_ia_cotas` |

---

## 8. Triggers

Todas as tabelas com `atualizado_em` têm trigger `BEFORE UPDATE` chamando `set_atualizado_em()`.

Trigger especial de negócio:

| Trigger | Tabela | Função |
|---|---|---|
| `on_auth_user_created` | `auth.users` | Cria registro em `perfis` automaticamente após cadastro |

A função `handle_new_user()` extrai `full_name` / `name` / `given_name` do `raw_user_meta_data` (OAuth) ou usa a parte local do e-mail como fallback. Não sobrescreve nome já preenchido pelo usuário.

---

## 9. Padrão de lineage (rastreabilidade)

Todas as tabelas ETL incluem os campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `source_id` | text | Identificador da fonte: `'camara_deputados'`, `'senado_legis'`, `'tse'`, `'portal_transparencia'` |
| `source_record_id` | text | ID do registro na fonte original |
| `collected_at` | timestamptz | Timestamp da coleta |

---

## 10. Bronze layer (raw_senado)

A tabela `raw_senado` armazena o XML bruto da API do Senado para reprocessamento sem re-fetch.

- Deduplicação por SHA-256 do conteúdo (`checksum UNIQUE`)
- Ciclo: `pending` → `parsed` (Silver layer atualizado) ou `error` (re-processar)
- RLS: admin-only — o XML pode conter dados sensíveis de formatação

---

## 11. Acesso ao banco (desenvolvimento)

**Via Supabase Studio (produção):**
```
https://supabase.meuspoliticos.com.br
```

**Via SSH tunnel (ETL local):**
```bash
ssh -L 5433:10.0.2.2:5432 root@45.32.169.173 -N -o ServerAliveInterval=30
# Banco disponível em localhost:5433
```

**Credenciais:** ver `app/.env.local` — variáveis `POSTGRES_*`. Nunca commitar.

---

## 12. Status dos dados coletados

Ver `app/CLAUDE.md` para tabela atualizada. Resumo atual (mai/2026):

| Tabela | Fonte | Registros | Período |
|---|---|---|---|
| `gastos` | `camara_ceap` | ~527k | 2022–2025 |
| `gastos` | `senado_ceaps` | ~40k | 2023–2026 |
| `votacoes` | `camara_votos_bulk` | ~379k | 2023–2025 |
| `votacoes` | `senado_legis` | ~13k | até mai/2026 |
| `emendas` | `portal_transparencia` | ~16.6k | 2024–2025 |
| `proposicoes` | `camara_dadosabertos` | ~57k | até mai/2026 |
| `politicos` | `camara_deputados` | 513 dep. federais | — |
| `politicos` | `senado_legis` | 81 senadores | — |

---

*Atualizado em: 2026-05-29 · Schema v2.12 · Auditoria v2.1*
