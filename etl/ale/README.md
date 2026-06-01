# ETL — Assembleias Legislativas Estaduais

Coleta dados de deputados estaduais das 5 ALEs com API pública confirmada,
mais suporte genérico para as ~8 ALEs que usam SAPL.

## Arquivos

| Script | UF(s) | Dados | Status (testado 2026-05-23) |
|---|---|---|---|
| `collect_almg.py` | MG | deputados, presenças, votações, despesas, proposições | ❌ API fora — todos os endpoints retornam 404/500 |
| `collect_alep.py` | PR | parlamentares, votações, presenças, proposições | ❌ Paths `/parlamentar` e `/votacao` retornam 404 — API só tem `/proposicao` e `/norma-legal` documentados |
| `collect_almt.py` | MT | deputados, votações, presenças | ❌ `/deputados` e `/sessoes` retornam 404 — URL da API mudou |
| `collect_alesp.py` | SP | deputados (XML+REST), presenças, despesas, votações | ❌ Presenças=0 — faltou rodar `--entidade deputados` antes (id_ale=NULL para SP) |
| `collect_cldf.py` | DF | despesas (verbas indenizatórias via CKAN) | ⚠️ Colunas reais confirmadas (NOME_PARLAMENTAR, VALOR_DESPESA, CLASSIFICACAO). `baixar_tabela` corrigido para seguir redirect S3. Aguarda re-teste. |
| `collect_sapl.py` | AC,AM,RR,PI,TO,SE,AL,MS | votações, presenças | ⚠️ `presencaordemdia` e `votoparlamentar` confirmados. Match por nome via `__str__`. Aguarda re-teste. |
| `update_presenca_pct.py` | todos | atualiza `presenca_pct_atual` em `politicos` | util |
| `base.py` | — | utilitários compartilhados | — |

## Pré-requisitos

```bash
pip install psycopg python-dotenv requests unidecode
```

Variáveis de ambiente em `app/.env.local`:
```
POSTGRES_HOST=...
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DB=postgres
```

## Uso

### Rodar da raiz do projeto

```bash
# Todos os dados de MG (ano atual + ano anterior)
python -m etl.ale.collect_almg

# Só presenças de SP para 2025
python -m etl.ale.collect_alesp --entidade presencas --ano 2025

# PR — só votações
python -m etl.ale.collect_alep --entidade votacoes --ano 2024 2025

# DF via CKAN
python -m etl.ale.collect_cldf --entidade presencas --ano 2025

# SAPL genérico para AC
python -m etl.ale.collect_sapl --uf AC

# SAPL para AM, só votações
python -m etl.ale.collect_sapl --uf AM --entidade votacoes --ano 2025

# Após qualquer coleta: atualizar % presença no perfil
python -m etl.ale.update_presenca_pct --ano 2025
python -m etl.ale.update_presenca_pct --ano 2025 --uf MG
```

### Ordem recomendada (primeira coleta)

```bash
# 1. Deputados (enriquece id_ale nas ALEs Tier 1)
python -m etl.ale.collect_almg --entidade deputados
python -m etl.ale.collect_alep --entidade parlamentares
python -m etl.ale.collect_almt --entidade deputados
python -m etl.ale.collect_alesp --entidade deputados
python -m etl.ale.collect_sapl --uf AC --entidade parlamentares
python -m etl.ale.collect_sapl --uf AM --entidade parlamentares

# 2. Presenças (anos completos)
python -m etl.ale.collect_almg --entidade presencas --ano 2023 2024 2025
python -m etl.ale.collect_alep --entidade presencas --ano 2023 2024 2025
python -m etl.ale.collect_almt --entidade presencas --ano 2023 2024 2025
python -m etl.ale.collect_alesp --entidade presencas --ano 2023 2024 2025
python -m etl.ale.collect_cldf --entidade presencas --ano 2023 2024 2025

# 3. Votações
python -m etl.ale.collect_almg --entidade votacoes --ano 2023 2024 2025
python -m etl.ale.collect_alep --entidade votacoes --ano 2023 2024 2025

# 4. Atualizar KPI
python -m etl.ale.update_presenca_pct --ano 2025
```

## Tabelas alvo

| Tabela | Campos principais |
|---|---|
| `politicos` | `id_ale`, `foto_url`, `email`, `presenca_pct_atual` |
| `ale_presencas` | `politico_id`, `data`, `uf`, `presente`, `tipo_sessao` |
| `votacoes` | `politico_id`, `data`, `voto`, `descricao`, `source_id` |
| `gastos` | `politico_id`, `ano`, `mes`, `valor`, `categoria` |
| `proposicoes` | `tipo`, `numero`, `ano`, `ementa`, `situacao` |

## Notas importantes

- **Verificar antes de rodar**: confirmar que o deputado existe no banco antes de qualquer ETL
  ```sql
  SELECT COUNT(*) FROM politicos WHERE cargo = 'deputado_estadual' AND uf = 'MG';
  -- Deve retornar ~77
  ```
- **id_ale**: chave de ligação entre a API da ALE e o banco. O ETL `collect_deputados`
  deve rodar primeiro para popular esse campo.
- **ON CONFLICT**: todos os INSERTs usam `ON CONFLICT (source_id, source_record_id) DO UPDATE`
  — é seguro reprocessar.
- **Rate limiting**: cada endpoint tem `time.sleep()` entre chamadas. Para ALEs menores,
  não há risco; para ALESP (dados desde 2002), a coleta histórica pode demorar horas.
- **SAPL instabilidade**: domínios SAPL podem mudar. Verificar se o endpoint `/api/` responde
  antes de rodar coleta completa.

## Adicionando nova ALE

1. Conferir se usa SAPL → adicionar UF em `SAPL_DOMINIOS` em `collect_sapl.py`
2. Se tem API própria → criar `collect_ale{uf}.py` seguindo o padrão de `collect_alep.py`
3. Confirmar schema do endpoint com `curl https://{dominio}/api/`
4. Testar com `--entidade deputados` antes de escalar para dados históricos
