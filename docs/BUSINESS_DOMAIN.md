---
file: docs/BUSINESS_DOMAIN.md
module: Business Domain Reference
status: Active
related: [docs/DATABASE.md, docs/METRICS.md, docs/BACKOFFICE_DATA_CONTRACT.md, docs/meuspoliticos_master.md]
---

# Domínio de Negócio — Meus Políticos

> Este documento descreve as regras de negócio, entidades políticas, fluxos de dados e invariantes do domínio. Para métricas e scores, ver `docs/METRICS.md`. Para fallbacks e display de campos, ver `docs/BACKOFFICE_DATA_CONTRACT.md`.

---

## 1. Missão e princípios

**Missão:** Transparência para decidir melhor — o sistema operacional da cidadania política brasileira.

**Empresa:** NORO GURU (NORO Tecnologia e Turismo Ltda · CNPJ 63.429.497/0001-88)

### Princípios inegociáveis

| Princípio | Regra de implementação |
|---|---|
| Sem opinião, sem ranking moral | Scores são benchmarks relativos — nunca julgamento absoluto |
| Neutralidade política absoluta | Nenhum partido, candidato ou ideologia é favorecido na plataforma |
| IA como facilitador | Resumos IA sempre rotulados; fonte original sempre acessível |
| LGPD | CEP nunca persistido; CPF apenas no ETL, nunca no banco público |
| Filtro de decisão | "Isso aumenta transparência ou só aumenta ruído?" — se não aumenta claramente, não entra |

---

## 2. Entidades políticas cobertas

### 2.1 Políticos ativos (tabela `politicos`)

| Cargo | Universo | Fonte |
|---|---|---|
| Deputado Federal | 513 | Câmara API v2 |
| Senador | 81 | API Senado |
| Governador | 27 | TSE + fontes estaduais |
| Deputado Estadual | ~1.059 (ALEs coletadas) | TSE + APIs ALEs |

**Total de políticos no banco:** ~1.680 registros

### 2.2 Candidatos 2026 (tabela `candidatos`)

Candidatos registrados no TSE para as eleições de outubro 2026. Perfil cruzado com `politicos` via `politico_id` quando o candidato já tem mandato.

**Tipos de perfil (`perfil_candidato`):**
- `em_exercicio` — candidato com mandato atual (deputado se candidatando à reeleição, por exemplo)
- `ex_mandatario` — já teve mandato, sem mandato atual
- `sem_mandato` — candidato sem histórico de mandato

### 2.3 Cobertura geográfica

- 5.570 municípios com código IBGE e código TSE (para cruzamento)
- 27 estados com dados institucionais, econômicos e de governo
- Regiões: Norte, Nordeste, Centro-Oeste, Sudeste, Sul

---

## 3. Modelo de dados — relacionamentos principais

```
auth.users
    └── perfis (1:1, trigger automático)
            └── acompanhamentos (N:M → politicos)

partidos
    └── politicos.partido_id (partido atual)
    └── politico_partidos (histórico de filiações)
    └── candidatos.partido_id

politicos (hub central)
    ├── votacoes (N:1)
    ├── gastos (N:1)
    ├── presenca (N:1)
    ├── emendas (N:1)
    ├── discursos (N:1)
    ├── feed_eventos (N:1)
    ├── redes_sociais (N:1)
    ├── candidatos.politico_id (quando candidato tem mandato)
    ├── politico_ids (entity resolution Câmara v1↔v2)
    └── politico_senado_ids (entity resolution Câmara↔Senado)

senadores (paralelo a politicos para fase 2)
    ├── senado_votacoes
    ├── senado_materias
    ├── senado_comissoes
    ├── senado_discursos
    └── senado_sessoes

proposicoes
    ├── proposicao_autores → politicos (soft FK)
    └── proposicao_tramitacoes (histórico de tramitação)

municipios
    ├── politicos.municipio_id (naturalidade/domicílio)
    ├── emendas.municipio_ibge (destino da emenda)
    └── candidatos.municipio_id

estados_info
    ├── estados_economia
    ├── estados_governos → politicos (soft FK)
    ├── estados_ale
    ├── estados_pacto_federativo
    ├── estados_tribunais
    └── estados_timeline
```

---

## 4. Entity Resolution (cruzamento de fontes)

O maior desafio técnico do projeto: cada fonte de dados usa um identificador diferente para o mesmo político.

| Campo em `politicos` | Fonte | Uso |
|---|---|---|
| `id_camara` | Câmara API v2 | Coletas de votações, gastos, presença |
| `id_senado` | API Senado | Coletas de dados do Senado |
| `id_tse` | TSE | Cruzamento com candidaturas 2026 |
| `codigo_siafi` | CGU/SIAFI | Cruzamento com emendas parlamentares |
| `id_ale` | APIs das ALEs | Coletas de assembleias estaduais |

**CPF como âncora no ETL:** O CPF é usado apenas dentro do ETL para cruzar IDs entre fontes. Nunca é persistido no banco público. Após o cruzamento, `politico_senado_ids.match_confidence` registra a confiança do match.

**`match_confidence` em `politico_senado_ids`:**
- `1.000` = CPF + nome + UF coincidem exatamente
- `0.950` = CPF + nome (fuzzy match)
- `0.800` = nome + UF apenas (sem CPF disponível)
- `< 0.800` = validação manual obrigatória

---

## 5. Categorias temáticas

9 temas usados para classificar votações, discursos e projetos (seed fixo, não altera sem migration):

| Slug | Nome | Cor | Ícone |
|---|---|---|---|
| `economia` | Economia | `#e8eefb` | `ti-chart-bar` |
| `social` | Social | `#e8f5ee` | `ti-users` |
| `educacao` | Educação | `#f0e8ff` | `ti-school` |
| `saude` | Saúde | `#e8f5ee` | `ti-heart` |
| `seguranca` | Segurança | `#fff0e8` | `ti-shield` |
| `meio-ambiente` | Meio Ambiente | `#e8f5ee` | `ti-leaf` |
| `politica` | Política | `#e8eefb` | `ti-building-bank` |
| `infraestrutura` | Infraestrutura | `#faeeda` | `ti-road` |
| `institucional` | Institucional | `#f5f6fa` | `ti-file-description` |

---

## 6. Hierarquia de impacto

Usado em `votacoes`, `gastos`, `discursos` e `feed_eventos` para priorização no feed do usuário:

| Nível | Valor | Exemplos |
|---|---|---|
| Baixo | `'1'` | Gasto CEAP, discurso, participação em comissão |
| Médio | `'2'` | Votação nominal comum, novo PL, ausência |
| Alto | `'3'` | Votação relevante, PEC, candidatura 2026 |
| Crítico | `'4'` | Cassação, afastamento, troca de partido, votação constitucional |

---

## 7. Estado do dado (`dado_estado`)

Indica a qualidade/frescor de cada registro. Exibido na UI como indicador de confiabilidade:

| Estado | Significado | UI |
|---|---|---|
| `oficial` | Dado confirmado da fonte oficial | Sem alerta |
| `parcial` | Dado incompleto ou em reconciliação | Badge "Parcial" |
| `atrasado` | ETL atrasado — dado pode estar desatualizado | Badge "Atrasado" |
| `em_processamento` | ETL em andamento | Badge "Processando" |
| `indisponivel` | Fonte temporariamente inacessível | Exibir "–" |

---

## 8. Glossário cívico

50 termos em `glossario` com:
- `definicao_simples` — linguagem cidadã (para o site público)
- `definicao_tecnica` — linguagem jurídica (para o app analítico)
- `categoria` — `'legislativo'` | `'eleitoral'` | `'financeiro'` | `'institucional'`
- `termos_relacionados` — array de slugs para links cruzados

**Termos principais cobertos:** PL, PEC, CEAP, emenda parlamentar, emenda Pix, plenário, quórum, votação nominal, regime de urgência, impeachment, ficha limpa, SIAFI, TCU, CGU, Portal da Transparência, entre outros.

---

## 9. Fluxo de correção de dados

Qualquer cidadão pode reportar dados incorretos via `/correcao` no site público.

```
Usuário submete → INSERT em correcoes (INSERT sem auth)
                → status: 'pendente'
                → Admin revisa em /admin/dados
                → status: 'aprovado' | 'rejeitado' | 'arquivado'
```

`link_fonte` é obrigatório na submissão — o dado correto deve ter fonte rastreável.

---

## 10. Feature Flags

Controle de features sem deploy — gerenciado em `/admin/flags`.

| Slug | Descrição | Default |
|---|---|---|
| `busca_postgres_direto` | Busca via Postgres direto | ON (100%) |
| `emendas_pix_visivel` | Seção Emendas Pix no perfil | OFF |
| `comparativo_parlamentares` | Página /comparar | OFF |
| `candidatos_2026` | Seção de candidatos 2026 | OFF |
| `glossario_tooltips` | Tooltips inline do glossário | OFF |
| `plano_premium` | Exportação CSV e alertas por email | OFF |
| `insights_rankings` | Página /insights com rankings | OFF |
| `na_imprensa` | Aba "Na imprensa" no perfil | OFF |
| `push_notifications` | Alertas via Web Push API | OFF |
| `atuacao_parlamentar` | Aba de atuação parlamentar | OFF |
| `timeline_politica` | Linha do tempo no perfil | OFF |
| `modo_eleicao_2026` | Estado especial eleições outubro 2026 | OFF |
| `explique_votacao` | Contexto IA por votação | OFF |

---

## 11. Pipeline ETL — fontes de dados

| Fonte | Diretório | Dados coletados |
|---|---|---|
| Câmara dos Deputados | `etl/camara/` | Deputados, votações, gastos (CEAP), proposições, presença |
| Senado Federal | `etl/senado/` | Senadores, votações, gastos (CEAPS), discursos |
| TSE | `etl/tse/` | Eleitos 2022, candidatos 2026, histórico eleitoral |
| Assembleias Estaduais | `etl/ale/` | ALESP (SP), ALEP (PR), ALMG (MG), ALMT (MT), CLDF (DF) |
| IBGE | `etl/ibge/` | Municípios, estados, dados demográficos |
| Portal da Transparência | `etl/portal_transparencia/` | Emendas parlamentares, SIAFI |
| Partidos | `etl/partidos/` | Dados de partidos e fundos partidários |
| IA | `etl/ia/` | Processamento com OpenAI (resumos, simplificação) |
| STN | `etl/stn/` | Secretaria do Tesouro Nacional (pacto federativo) |

**Padrão de escrita:** todos os ETLs usam `UPSERT ... ON CONFLICT ... DO UPDATE` para idempotência. Após cada coleta, `INSERT` em `coletas_log` com status, registros e duração.

---

## 12. IA no domínio

O sistema usa OpenAI para:

| Caso de uso | Campo | Controle |
|---|---|---|
| Simplificar ementa de votação | `votacoes.descricao_simples` | `ia_processado`, `ia_gerado_em`, `ia_modelo` |
| Simplificar ementa de proposição | `proposicoes.ementa_simples` | idem |
| Resumir proposta de governo (candidatos 2026) | `candidatos.proposta_resumo` (JSONB) | idem |
| Resumo interpretativo de perfil | `politico_resumos_ia.conteudo_json` | Cache + cota diária |

**Cota diária de resumos:** `politico_resumos_ia_cotas.limite_diario` (default 3) — controlado por `IA_RESUMO_MAX_GERACOES_DIA` no `.env`.

**Invariante:** todo conteúdo IA deve ser explicitamente rotulado na UI com "Gerado por IA" e link para a fonte original.

---

## 13. LGPD — dados pessoais

| Dado | Status | Regra |
|---|---|---|
| CEP do usuário | Nunca persistido | Usado apenas server-side para "quem me representa"; descartado após a query |
| CPF | Apenas no ETL | Usado como âncora para entity resolution; nunca inserido em nenhuma tabela do banco público |
| E-mail | Somente em `auth.users` | Gerenciado pelo Supabase Auth; não exposto via RLS público |
| Nome do usuário | `perfis.nome` | RLS: `auth.uid() = id` — acessível apenas pelo próprio usuário |

---

*Atualizado em: 2026-05-29 · Auditoria v2.1*
