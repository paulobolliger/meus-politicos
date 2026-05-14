# Data Source Master — meuspoliticos.com
> Documento vivo — versão 1.0 — maio 2026
> Referência central para todas as decisões de coleta, ingestão e qualidade de dados

---

## 0. Panorama técnico — arquitetura de dados completa

> *Visão de cima de onde vem cada dado, como as fontes se conversam e quais scripts ETL são necessários.*

---

### O problema central: um político, múltiplos IDs

O mesmo político existe em 4 sistemas diferentes com IDs incompatíveis:

```
Câmara:  id_camara = 204554
Senado:  id_senado = 5987
TSE:     id_tse = "0123456"
CPF      = âncora universal (só no ETL — nunca persiste no banco)
```

A tabela `politicos` é o **hub central** que unifica tudo via UUID interno.

```
CPF (só no ETL — nunca persiste no banco público)
    ↓
MATCH Câmara + TSE + Senado
    ↓
politicos.id (UUID interno)
    │
    ├─ politicos.id_camara  → chave para endpoints da Câmara
    ├─ politicos.id_senado  → chave para endpoints do Senado
    ├─ politicos.id_tse     → chave para candidaturas e bens no TSE
    └─ politicos.slug       → chave pública da URL
```

---

### Mapa completo: fonte → campo → tabela

```
┌─────────────────────────────────────────────────────────────┐
│                    API CÂMARA DOS DEPUTADOS                 │
│                  dadosabertos.camara.leg.br                  │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─ GET /deputados/{id}
           │   └─→ politicos (nome, foto, email, gabinete, sexo,
           │                  naturalidade, escolaridade, slug)
           │   └─→ partidos (sigla, nome)
           │   └─→ redes_sociais (instagram, twitter, youtube)
           │
           ├─ GET /deputados/{id}/historico
           │   └─→ politico_partidos (troca de partido + timestamp)
           │
           ├─ GET /deputados/{id}/despesas
           │   └─→ gastos (CEAP: valor, categoria, fornecedor, CNPJ)
           │
           ├─ GET /deputados/{id}/votacoes + /votacoes/{id}/votos
           │   └─→ votacoes (como votou: sim/não/abstenção)
           │   └─→ feed_eventos (votação relevante)
           │
           ├─ GET /deputados/{id}/eventos
           │   └─→ presenca (calculada: presente/ausente por sessão)
           │
           ├─ GET /deputados/{id}/discursos
           │   └─→ discursos (resumo, tema, link)
           │
           └─ GET /deputados/{id}/mandatosExternos
               └─→ candidaturas_historico (cargos anteriores)


┌─────────────────────────────────────────────────────────────┐
│                     API SENADO FEDERAL                      │
│                   legis.senado.leg.br                        │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─ /senadores/lista/atual
           │   └─→ politicos (nome, partido, UF) + senadores
           │   └─→ politico_ids (id_senado vinculado ao uuid)
           │
           ├─ /senadores/{id}/votacoes
           │   └─→ votacoes (mesmo schema da Câmara)
           │
           ├─ /senadores/{id}/discursos
           │   └─→ discursos
           │
           └─ /senadores/{id}/comissoes
               └─→ senado_comissoes


┌─────────────────────────────────────────────────────────────┐
│                          TSE                                │
│               dadosabertos.tse.jus.br (CSV)                 │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─ consulta_cand_{ano}.csv
           │   └─→ candidatos (registro, número, situação)
           │   └─→ candidaturas_historico (eleições desde 1994)
           │   └─→ politico_ids (id_tse via CPF ← só no ETL)
           │
           ├─ bem_candidato_{ano}.csv
           │   └─→ candidatos.bens_declarados (JSON)
           │
           └─ DivulgaCandContas (API)
               └─→ politicos.foto_url (candidatos sem foto na Câmara)


┌─────────────────────────────────────────────────────────────┐
│               PORTAL DA TRANSPARÊNCIA (CGU)                 │
│           portaldatransparencia.gov.br/api-de-dados          │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─ /emendas-parlamentares
           │   └─→ emendas (valor, município beneficiado, objeto)
           │
           ├─ /transferencias-voluntarias
           │   └─→ emendas (cruzamento com execução)
           │
           └─ /viagens (fase 2)
               └─→ feed_eventos (viagem internacional do Presidente)


┌─────────────────────────────────────────────────────────────┐
│                           IBGE                              │
│           servicodados.ibge.gov.br/api/v1/localidades        │
└──────────┬──────────────────────────────────────────────────┘
           │
           └─ /municipios
               └─→ municipios (5.570 com código IBGE)
               └─→ chave de cruzamento com ViaCEP e TSE


┌─────────────────────────────────────────────────────────────┐
│                          ViaCEP                             │
│                    viacep.com.br/ws/                         │
└──────────┬──────────────────────────────────────────────────┘
           │
           └─ /{cep}/json/
               └─→ UF + código IBGE (em memória — nunca persiste)
               └─→ "Quem me representa" → filtra politicos por UF


┌─────────────────────────────────────────────────────────────┐
│                  DOU — DIÁRIO OFICIAL DA UNIÃO              │
│                    inlabs.seges.gov.br                       │
└──────────┬──────────────────────────────────────────────────┘
           │
           └─ XML diário por seção
               └─→ feed_eventos Seção 1: decretos, MPs (fase 2)
               └─→ feed_eventos Seção 2: nomeações/exonerações (fase 2)


┌─────────────────────────────────────────────────────────────┐
│                       SIOP / PPA                            │
│              siop.planejamento.gov.br                        │
└──────────┬──────────────────────────────────────────────────┘
           │
           └─ GraphQL + SOAP
               └─→ perfil Presidente: metas PPA prometidas vs executadas
               └─→ cruzamento com Portal da Transparência via código de ação (17 dígitos)


┌─────────────────────────────────────────────────────────────┐
│                    NOTÍCIAS / MÍDIA                         │
│         Bing News · Agência Brasil · RSS portais             │
└──────────┬──────────────────────────────────────────────────┘
           │
           └─→ feed_eventos tipo 'na_imprensa'
               └─→ source_id = 'g1' | 'agencia_brasil' | 'bing_news'
```

---

### Pipeline de cada script ETL

```
API / CSV
  ↓ validar schema (JSON Schema)
  ↓ normalizar (tipos, encoding UTF-8, datas UTC)
  ↓ entity resolution (CPF → politico_id)
  ↓ upsert no Supabase (ON CONFLICT → UPDATE)
  ↓ registrar em coletas_log (status, registros, duração)
  ↓ se erro → registrar + continuar (nunca travar tudo)
```

---

### Scripts ETL — roadmap completo

| Script | Fonte | Fase | Frequência |
|---|---|---|---|
| `collect_deputados.py` | Câmara | ✅ Feito | Semanal |
| `collect_votacoes.py` | Câmara | MVP | Diário 6h |
| `collect_gastos.py` | Câmara | MVP | Diário 6h |
| `collect_presenca.py` | Câmara | MVP | Diário 6h |
| `collect_discursos.py` | Câmara | MVP | Diário 6h30 |
| `collect_municipios.py` | IBGE | MVP | Mensal |
| `collect_candidatos.py` | TSE CSV | MVP | Por lote (ago/2026) |
| `collect_emendas.py` | Portal Transparência | Fase 2 | Diário 7h |
| `collect_senadores.py` | Senado | Fase 2 | Semanal |
| `collect_votacoes_senado.py` | Senado | Fase 2 | Diário |
| `collect_dou.py` | INLABS | Fase 2 | Diário 10h30 |
| `collect_siop.py` | SIOP | Fase 2 | Semestral |
| `collect_noticias.py` | Bing/RSS | Fase 2 | 4x/dia |
| `collect_governadores.py` | TSE + SEPLAN estaduais | Fase 2 | Semanal |
| `collect_dep_estaduais.py` | 27 assembleias | Fase 3 | Diário |
| `collect_prefeitos.py` | TSE CSV | Fase 3 | Semanal |
| `collect_vereadores.py` | TSE + câmaras municipais | Fase 4 | Semanal |

---

O Meus Políticos opera como **infraestrutura de dados cívicos**, não apenas como portal. Isso muda a arquitetura completamente.

O sistema é desenhado como uma camada de unificação de dados públicos:
- Auditável — toda decisão rastreável
- Reproduzível — qualquer dado pode ser recoletado do zero
- Historificada — mudanças nunca são perdidas
- Resiliente — continua funcionando quando fontes falham
- Preparada para IA — dados estruturados e citáveis
- Preparada para indexação semântica — entidades claras

**Princípio central:**
> O sistema NÃO confia em uma única fonte. Ele mantém source of truth, fontes derivadas, snapshots, lineage, logs de coleta e estado de confiabilidade.

---

## 2. Matriz de fontes — MVP

### P0 — Câmara dos Deputados
| Campo | Valor |
|---|---|
| source_id | `camara_deputados` |
| Órgão | Câmara dos Deputados |
| Categoria | Legislativo |
| Escopo | Federal |
| Oficial | Sim |
| URL base | `dadosabertos.camara.leg.br` |
| API URL | `https://dadosabertos.camara.leg.br/api/v2` |
| Documentação | `dadosabertos.camara.leg.br/swagger/api.html` |
| Formato | JSON |
| Autenticação | Nenhuma |
| Rate limit | Não documentado — testar empiricamente |
| Paginação | Cursor por `itens` e `pagina` |
| Timezone | America/Sao_Paulo |
| Atualização | Diária (votações em tempo quase real durante sessões) |
| Cobertura histórica | Votações desde 1991, gastos desde 2009 |
| Status | Ativo — melhor API pública do Brasil |
| Authority score | 95/100 |
| Estabilidade | Alta |
| Completude | ~95% |
| Fase | **MVP** |

**Dados disponíveis:**
- Deputados (perfil, foto, partido, mandato)
- Votações nominais
- Gastos com cota parlamentar (CEAP)
- Presença em sessões
- Proposições (PLs, PECs)
- Discursos
- Frentes parlamentares
- Eventos e agenda

**Source of truth para:** atividade legislativa federal da Câmara, gastos CEAP, presença em plenário

---

### P0 — TSE — Tribunal Superior Eleitoral
| Campo | Valor |
|---|---|
| source_id | `tse` |
| Órgão | Tribunal Superior Eleitoral |
| Categoria | Eleitoral |
| Escopo | Federal + Municipal |
| Oficial | Sim |
| URL base | `dadosabertos.tse.jus.br` |
| Infraestrutura | **CKAN** (Comprehensive Knowledge Archive Network) — Action API v3 |
| Formato | **CSV** separado por `;` · encoding `ISO-8859-1` (padrão) |
| API REST nativa | Não — mas existe API de **descoberta de metadados** via CKAN |
| Autenticação | Nenhuma |
| Timezone | America/Sao_Paulo |
| Atualização | Diária em período eleitoral (upsert obrigatório) · Por eleição fora do período |
| Cobertura histórica | Candidaturas desde 1994 · dados estruturados sólidos a partir de 2004 |
| Status | Ativo — CSVs pesados e inconsistentes |
| Authority score | 99/100 |
| Estabilidade | Média (schema muda entre eleições) |
| Completude | ~85% (fotos e propostas variam) |
| Fase | **MVP** (municípios e candidatos 2026) + contínuo |

**Dados disponíveis:**
- Candidatos (todos os cargos, todas as eleições desde 1994)
- Resultados eleitorais
- Bens declarados
- Propostas de governo (PDF)
- Filiação partidária
- Coligações
- Prestação de contas de campanha (receitas e despesas)

**Source of truth para:** tudo eleitoral — candidaturas, resultados, bens declarados, histórico político

**Riscos:**
- CSVs com encoding inconsistente (`ISO-8859-1` padrão, mas alguns arquivos em UTF-8 ou ASCII)
- Schema muda entre eleições sem aviso prévio
- Arquivos de centenas de MB (votação por seção pode passar de 10 GB)
- Fotos e propostas nem sempre disponíveis para eleições anteriores a 2004
- `CD_MUNICIPIO` do TSE **não é o código IBGE** — requer tabela de cruzamento separada
- `VALOR_BEM` usa vírgula como separador decimal — tratar antes de converter para numeric
- Sentinelas `#NULO#` e `#NE#` nos CSVs devem ser convertidos para `NULL`

---

#### CKAN — Descoberta de arquivos (não hardcode URLs)

O portal usa CKAN com Action API v3. Em vez de URLs estáticas nos scripts, consultar a API antes de cada ingestão:

```python
import requests

# Descobre os recursos de candidatos 2026 antes de baixar
url = "https://dadosabertos.tse.jus.br/api/3/action/package_search"
resp = requests.get(url, params={"q": "candidatos 2026"})
recursos = resp.json()["result"]["results"]
# Extrair os links de download dos recursos retornados
```

---

#### Padrão de nomes dos arquivos CSV

```
consulta_cand_2026_BR.csv       → candidatos nacional
consulta_cand_2026_SP.csv       → candidatos por UF
bem_candidato_2026_BR.csv       → bens declarados nacional
votacao_candidato_munzona_2026_BR.csv → resultados por município/zona
receitas_candidatos_2026_BR.csv → doações de campanha
```

Sufixo `BR` = arquivo consolidado nacional · sufixo `UF` (ex: `SP`, `MG`) = por estado.

---

#### Schemas dos CSVs principais

**`consulta_cand` — Candidatos (fonte primária)**

| Coluna | Tipo | Descrição |
|---|---|---|
| `SQ_CANDIDATO` | varchar(20) | **Chave primária eleitoral** — sequencial único por eleição |
| `ANO_ELEICAO` | int | Ano do pleito |
| `NR_CANDIDATO` | int | Número na urna |
| `NM_CANDIDATO` | varchar | Nome civil completo |
| `NM_URNA_CANDIDATO` | varchar | Nome de campanha |
| `NR_CPF_CANDIDATO` | varchar(11) | **Âncora para entity resolution** — confirmado disponível em 2026 |
| `DS_SITUACAO_CANDIDATURA` | varchar | `DEFERIDO` / `INDEFERIDO` / `RENÚNCIA` |
| `SG_PARTIDO` | varchar | Sigla do partido |
| `DS_GENERO` | varchar | Gênero declarado |
| `DS_COR_RACA` | varchar | Cor/raça autodeclarada |
| `DT_NASCIMENTO` | varchar | Data de nascimento — usar para entity resolution com Câmara |

**`bem_candidato` — Bens declarados**

| Coluna | Descrição | Atenção |
|---|---|---|
| `SQ_CANDIDATO` | FK para consulta_cand | Relação 1:N — candidato tem N bens |
| `CD_TIPO_BEM_CANDIDATO` | Código da categoria | ex: 11 = Apartamento |
| `DS_TIPO_BEM_CANDIDATO` | Descrição da categoria | ex: "Veículo automotor terrestre" |
| `DS_BEM_CANDIDATO` | Descrição detalhada | Texto livre — pode conter dados sensíveis |
| `VALOR_BEM` | Valor monetário | **Vírgula como decimal** — converter com `replace(',', '.')` |

**`votacao_candidato_munzona` — Resultados por município/zona**

| Coluna | Descrição | Atenção |
|---|---|---|
| `SQ_CANDIDATO` | FK para consulta_cand | — |
| `CD_MUNICIPIO` | Código do município | **Não é o código IBGE** — requer tabela de cruzamento TSE→IBGE |
| `NM_MUNICIPIO` | Nome da cidade | — |
| `NR_ZONA` | Número da zona eleitoral | — |
| `QT_VOTOS_NOMINAIS` | Total de votos na zona | — |
| `DS_SIT_TOT_TURNO` | Resultado: `ELEITO` / `NÃO ELEITO` / `SUPLENTE` | — |

**`receitas_candidatos` — Doações de campanha**

| Coluna | Descrição |
|---|---|
| `SQ_CANDIDATO` | FK para consulta_cand |
| `NR_CPF_CNPJ_DOADOR` | Identificador do doador (PF ou PJ) |
| `NM_DOADOR` | Nome ou razão social |
| `VR_RECEITA` | Valor da doação |
| `DS_ORIGEM_RECEITA` | Tipo: Fundo Partidário / Fundo Especial / Doação Direta |

---

#### DivulgaCandContas — Fotos e PDFs

O TSE não embute fotos e propostas nos CSVs. Eles ficam em um sistema satélite com endpoints REST:

**Fotos dos candidatos:**
```
GET https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/foto/{ANO}/{COD_UE}/{SQ_CANDIDATO}
```

**Propostas de governo (PDF):**
```
GET https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/{ANO}/{COD_UE}/{ID_ELEICAO}/candidato/{SQ_CANDIDATO}
```
→ Retorna JSON · procurar objeto de documentos com tipo `"Proposta de Governo"`

**`COD_UE`:**
- Cargos federais/estaduais → sigla da UF (ex: `SP`, `MG`)
- Presidente → `BR`

**Disponibilidade histórica de fotos:** boa a partir de 2004 · qualidade superior a partir de 2018 (padrão biométrico)

**Recomendação:** capturar os links de forma assíncrona e armazenar em CDN próprio — evita broken links se o TSE mudar o servidor.

---

#### Entity resolution — TSE × Câmara × Senado

O TSE não compartilha identificadores com a Câmara (`idDeputado`) ou o Senado (`id_senado`). A cascata de matching recomendada:

| Prioridade | Campo | Confiança |
|---|---|---|
| 1 | `NR_CPF_CANDIDATO` (TSE) = CPF (Câmara/Senado) | 1.0 — confirmado para 2026 |
| 2 | `NM_CANDIDATO` + `DT_NASCIMENTO` | ~0.99 — elimina 99% dos homônimos |
| 3 | Título de eleitor | 0.95 — disponível em datasets internos |

**Importante:** o CPF voltará a ser divulgado em 2026 (confirmado pelo TSE após pressão da sociedade civil). Para dados históricos (pré-2022), usar nome civil + data de nascimento.

---

#### Calendário 2026 — quando cada dado fica disponível

| Data | Evento | Dado disponível |
|---|---|---|
| Mar 5 – Abr 3 2026 | Janela Partidária | Trocas de partido dos parlamentares em exercício |
| Jul 20 – Ago 5 2026 | Convenções partidárias | Primeiras listas de candidatos (não oficiais) |
| Até Ago 15 2026 | Prazo de registro de candidaturas | Ingestão massiva: `consulta_cand`, `bem_candidato`, fotos |
| Ago 16 2026 | Início da propaganda eleitoral | Ativar feature flag `candidatos_2026` |
| Set 2026 | Prestação de contas parcial | `receitas_candidatos` — primeiro ranking de financiamento |
| Out 4 2026 | Primeiro turno | Resultados em tempo real · `votacao_candidato_munzona` |
| Out 25 2026 | Segundo turno | Consolidação dos eleitos |
| Nov 2026 | Prestação de contas final | Dados definitivos de gastos e doadores |

**Atenção:** entre Ago 15 e a eleição, o TSE atualiza os arquivos **diariamente** (julgamentos de registro). O pipeline deve fazer **upsert por `SQ_CANDIDATO`**, não insert simples.

---

#### Estratégia de ingestão

**Fonte por período:**
- **2026 (eleição atual):** TSE direto — latência zero, dados oficiais em tempo real
- **1996–2022 (histórico):** Brasil.IO — já normalizado, encoding tratado, `#NULO#` limpo

**Pipeline Python — parâmetros definitivos:**
```python
import pandas as pd

dtype_map = {
    'SQ_CANDIDATO': str,       # nunca deixar virar float
    'NR_CPF_CANDIDATO': str,   # preservar zeros à esquerda
    'NR_CANDIDATO': str,
    'CD_CARGO': 'int16'
}

reader = pd.read_csv(
    file_path,
    sep=';',
    encoding='ISO-8859-1',
    chunksize=100_000,
    dtype=dtype_map,
    on_bad_lines='warn'
)

for chunk in reader:
    chunk.columns = [c.lower() for c in chunk.columns]
    chunk = chunk.replace({'#NULO#': None, '#NE#': None})
    chunk['valor_bem'] = chunk['valor_bem'].str.replace(',', '.').astype(float)
    # upsert no Supabase via on_conflict(SQ_CANDIDATO)
```

**Staging table:** carregar bruto em tabela de staging → transformar via SQL no PostgreSQL (significativamente mais rápido do que transformar em Python para volumes acima de 1M de linhas).

---

#### Cobertura municipal — prefeitos e vereadores

**O TSE já cobre 100% dos dados municipais.** Não é necessário acessar TREs individualmente para dados de candidatos, resultados ou bens declarados de prefeitos e vereadores. O portal consolida todos os 5.568 municípios em arquivos únicos nacionais.

**3 níveis de granularidade para resultados:**

| Nível | Dataset | Uso |
|---|---|---|
| Município + Zona | `votacao_candidato_munzona` | Análises políticas gerais — perfil do candidato |
| Seção eleitoral | `detalhe_votacao_secao` | Granularidade máxima — urna a urna |
| Seção por UF (arquivo separado) | `votacao_secao_2024_SP.zip` | Estados grandes (SP, MG, RJ) — volume massivo |

O nível de seção é o mais granular existente na Justiça Eleitoral — os TREs não têm dado mais fino que este.

**Datasets adicionais relevantes:**

| Dataset | O que contém | Uso no projeto |
|---|---|---|
| `lista-de-municipios-e-zonas` | Código TSE do município → zonas eleitorais que o compõem | Navegação geográfica · relação 1:N (metrópoles têm dezenas de zonas) |
| `eleitorado_local_votacao_2024` | Nome e endereço de cada local de votação | Base para geolocalização de seções |
| `perfil_eleitorado` | Gênero, faixa etária, escolaridade — **agregado por seção/município** | Contexto demográfico do eleitorado · nunca individualizado (LGPD) |

---
| Campo | Valor |
|---|---|
| source_id | `ibge` |
| Órgão | IBGE |
| Categoria | Geográfico |
| Escopo | Nacional |
| Oficial | Sim |
| API URL | `https://servicodados.ibge.gov.br/api/v1/localidades` |
| Formato | JSON |
| Autenticação | Nenhuma |
| Rate limit | Generoso — sem restrições documentadas |
| Atualização | **Anual** — ciclo de publicação do IBGE · não requer polling |
| Status | Ativo — estável · 5.570 municípios (estável desde 2013) |
| Authority score | 99/100 |
| Fase | **MVP** |

**Dados disponíveis:**
- Municípios com código IBGE (7 dígitos)
- Estados (UFs) com sigla e código
- Regiões, mesorregiões, microrregiões
- Hierarquia completa município → microrregião → mesorregião → UF → região

**Source of truth para:** referência geográfica, CEP → município (via ViaCEP + IBGE), cruzamento com TSE

---

#### Endpoints principais

```
GET /municipios                    → todos os 5.570 municípios em uma chamada
GET /municipios?orderBy=nome       → ordenado alfabeticamente (recomendado para ingestão)
GET /estados/{UF}/municipios       → municípios de uma UF específica (sigla ou código)
GET /estados                       → 27 UFs com código, sigla e nome
GET /regioes                       → 5 grandes regiões brasileiras
```

**Objeto município — estrutura JSON (hierarquia completa em uma resposta):**
```json
{
  "id": 3106200,
  "nome": "Belo Horizonte",
  "microrregiao": {
    "id": 31030,
    "nome": "Belo Horizonte",
    "mesorregiao": {
      "id": 3107,
      "nome": "Metropolitana de Belo Horizonte",
      "UF": {
        "id": 31,
        "sigla": "MG",
        "nome": "Minas Gerais",
        "regiao": { "id": 3, "sigla": "SE", "nome": "Sudeste" }
      }
    }
  }
}
```

Caminhos dos campos para a ingestão:
```python
codigo_ibge = m['id']
nome        = m['nome']
sigla_uf    = m['microrregiao']['mesorregiao']['UF']['sigla']
nome_uf     = m['microrregiao']['mesorregiao']['UF']['nome']
nome_regiao = m['microrregiao']['mesorregiao']['UF']['regiao']['nome']
```

---

#### Código IBGE — 7 dígitos, nunca 6

O código oficial tem **7 dígitos** — o último é dígito verificador (módulo 10). Sistemas legados do governo frequentemente usam só 6. **Sempre persistir os 7 dígitos** no banco. Truncar para 6 apenas em cruzamentos com sistemas externos, via software.

---

#### Cruzamento TSE × IBGE — arquivo oficial

O TSE usa `CD_MUNICIPIO` de 5 dígitos — sem relação aritmética com o código IBGE. O cruzamento oficial está disponível em:

```
https://cdn.tse.jus.br/estatistica/sead/odsele/municipio_tse_ibge/municipio_tse_ibge.zip
```

CSV comprimido com colunas `CD_MUNICIPIO_TSE` ↔ `CD_MUNICIPIO_IBGE`. Usar para popular `municipios.cd_municipio_tse` após a carga inicial do IBGE.

**Atualização:** sob demanda — baixar junto com cada novo ciclo eleitoral.

---

#### Ciclo de atualização

- Publicação anual do Quadro Geográfico de Referência (geralmente março)
- **Estratégia:** sincronização anual — sem necessidade de polling ou cron diário
- **2025:** 5.570 municípios estáveis · 784 com limites atualizados · 12 novos distritos criados
- Monitorar: fusões, criações e alterações de nomes (toponímia) a cada publicação

---

#### Script de ingestão

```python
import requests
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def ingest_municipios():
    resp = requests.get(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
        params={"orderBy": "nome"}
    )
    municipios = resp.json()

    payload = [
        {
            "codigo_ibge": m["id"],
            "nome":        m["nome"],
            "uf":          m["microrregiao"]["mesorregiao"]["UF"]["sigla"],
            "regiao":      m["microrregiao"]["mesorregiao"]["UF"]["regiao"]["nome"],
        }
        for m in municipios
    ]

    # Inserir em batches de 500 — evita timeout no Supabase
    for i in range(0, len(payload), 500):
        supabase.table("municipios").insert(payload[i:i+500]).execute()
        print(f"{min(i+500, len(payload))}/{len(municipios)} municípios inseridos")
```

---

#### Futuro — SIDRA API (v3)

O IBGE disponibiliza uma segunda API (`servicodados.ibge.gov.br/api/v3/agregados`) com dados socioeconômicos por município: IDH, PIB per capita, população estimada. Útil para contextualizar o desempenho dos políticos na fase 3+.

---

### P1 — Portal da Transparência (CGU)
| Campo | Valor |
|---|---|
| source_id | `portal_transparencia` |
| Órgão | Controladoria-Geral da União |
| Categoria | Financeiro |
| Escopo | Federal |
| Oficial | Sim |
| API URL | `https://api.portaldatransparencia.gov.br/api-de-dados` |
| Formato | JSON · UTF-8 |
| Autenticação | **API Key obrigatória** — header `api-key: <token>` |
| Rate limit diurno | **400 req/min** (06:00–00:00) |
| Rate limit madrugada | **700 req/min** (00:00–06:00) |
| Rate limit CPF | **180 req/min** (endpoints que filtram por CPF) |
| Paginação | Offset por `pagina` · 15 registros/página · performance degrada após pág. 500 |
| Atualização | Diária — delay de 24–48h (D+1 ou D+2 em relação ao SIAFI) |
| Cobertura histórica | Emendas consistentes a partir de **2014** · `valorPago` confiável a partir de **2020** |
| Status | Ativo — volume extremo |
| Authority score | 95/100 |
| Fase | **MVP** (emendas e gastos complementares) |

**Dados disponíveis:**
- Emendas parlamentares individuais e de bancada
- Emendas PIX (Transferências Especiais — EC 105/2019)
- Transferências a municípios e convênios
- Notas fiscais de fornecedores beneficiados
- Viagens pagas pelo Executivo (por CPF)
- Remuneração de parlamentares que ocupam cargos ministeriais

**Source of truth para:** emendas parlamentares, transferências, execução orçamentária

**Estratégia:** ingestão incremental de madrugada · nunca coletar tudo de uma vez · Delta Load por ano corrente

---

#### Obtenção da API Key

URL: `https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email`

| Nível Gov.br | Requisito | Elegível |
|---|---|---|
| Bronze | Cadastro básico via CPF | ❌ Inelegível |
| Prata | Biometria facial (CNH) ou login via banco | ✅ |
| Ouro | Certificado digital (e-CPF) ou biometria TSE | ✅ |

**Regras:**
- 2FA obrigatório no app Gov.br — sem ele o token não é gerado
- 1 chave por CPF — nova chave invalida a anterior
- Geração quase instantânea se os requisitos forem atendidos
- Token enviado para o e-mail cadastrado no Gov.br

---

#### Endpoints relevantes

**Emendas:**
```
GET /emendas
  params: ano, codigoAutor (SIAFI), numeroEmenda, pagina
  → Lista emendas parlamentares registradas na LOA

GET /emendas/documentos/{codigo}
  params: codigo (ID da emenda), pagina
  → Documentos fiscais e ordens bancárias vinculadas à emenda
```

**Emendas PIX (Transferências Especiais):**
```
GET /transferencias-especiais
  params: uf, municipio, ano
  → Exclusivo para Emendas PIX via Transferegov
```

**Transferências e convênios:**
```
GET /convenios/{id}
  → Detalha acordos entre União e municípios

GET /notas-fiscais
  params: cnpjFavorecido, periodo
  → Empresas/entidades que receberam recursos de emendas
```

**Dados do parlamentar como servidor:**
```
GET /viagens-por-cpf
  params: cpf, dataInicio, dataFim
  → Viagens pagas pelo Executivo ao CPF informado

GET /servidores/remuneracao
  params: cpf, mesAno
  → Remuneração de parlamentares que ocupam cargos de Ministro
```

---

#### Schema JSON — objeto de emenda

```json
{
  "id": "123456",
  "codigoEmenda": "202341210001",
  "numeroEmenda": "0001",
  "ano": 2023,
  "autor": {
    "codigo": "4121",
    "nome": "NOME DO PARLAMENTAR",
    "tipo": "INDIVIDUAL"
  },
  "tipoEmenda": "Emenda Individual",
  "funcao": "Saúde",
  "subfuncao": "Atenção Básica",
  "valorEmpenhado": 1500000.00,
  "valorLiquidado": 500000.00,
  "valorPago": 450000.00,
  "valorRestosAPagar": 0.00
}
```

**Estrutura do `codigoEmenda` (12 dígitos):**
```
2023  4121  0001
├─── ├──── └──── sequencial
│    └────────── código SIAFI do autor (4 dígitos)
└────────────── ano (4 dígitos)
```

---

#### Identificação do parlamentar — o desafio do SIAFI

O Portal da Transparência **não usa `id_camara` nem CPF** nos endpoints públicos de emendas. O autor é identificado pelo `codigo` SIAFI — um identificador orçamentário interno da CGU.

**Estratégia de cruzamento (cascata):**

| Prioridade | Método | Confiança |
|---|---|---|
| 1 | `codigo_siafi` → campo `codigo` no objeto `autor` | Exata |
| 2 | Nome normalizado (sem acentos, maiúsculo) + UF | Alta |
| 3 | `pg_trgm` (fuzzy match por trigrama no PostgreSQL) | Média |

**Tabela de mapeamento recomendada:** `politicos` deve ter campo `codigo_siafi` — ver schema v2.9+.

---

#### Emendas PIX vs. Emendas comuns

| Atributo | Emenda comum | Emenda PIX |
|---|---|---|
| `tipoEmenda` | `"INDIVIDUAL"` ou `"BANCADA"` | `"TRANSFERÊNCIA ESPECIAL"` |
| Endpoint de detalhe | `/convenios` | `/transferencias-especiais` |
| Rastreabilidade | Alta — vinculada a contrato/nota fiscal | Baixa — até o repasse ao município |
| Beneficiário | CNPJ da entidade ou município | CNPJ do município/estado |
| Campo de objeto | `finalidade` (bem definida) | `finalidade_especial` (genérico, melhora a partir de 2024 pós-STF ADPF 854) |

---

#### Rate limiting e retry

HTTP 429 inclui header `Retry-After` (em segundos). Ignorar repetidamente pode causar bloqueio de IP ou revogação do token.

```python
import requests, time, logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class PortalTransparenciaETL:
    def __init__(self, api_key):
        self.base_url = "https://api.portaldatransparencia.gov.br/api-de-dados"
        self.headers  = {"api-key": api_key, "Accept": "application/json"}
        self.session  = self._setup_session()

    def _setup_session(self):
        session = requests.Session()
        retry = Retry(
            total=5,
            backoff_factor=1,
            status_forcelist=[429, 500, 503],
            allowed_methods=["GET"]
        )
        session.mount("https://", HTTPAdapter(max_retries=retry))
        session.headers.update(self.headers)
        return session

    def fetch_emendas(self, ano, codigo_autor=None):
        resultados = []
        for pagina in range(1, 1001):
            params = {"ano": ano, "pagina": pagina}
            if codigo_autor:
                params["codigoAutor"] = codigo_autor
            resp = self.session.get(f"{self.base_url}/emendas", params=params, timeout=30)
            if resp.status_code != 200 or not resp.json():
                break
            resultados.extend(resp.json())
            time.sleep(0.15)  # ~400 req/min — respeita limite diurno
        return resultados
```

---

#### Armadilhas conhecidas

- **`valorPago` nulo:** emendas recém-indicadas ainda não têm execução — tratar como `0` ou `NULL` na tabela
- **Chave primária composta em emendas de bancada:** `codigoEmenda + cnpjBeneficiario + idDocumento` — o `id` sozinho não é único por linha de execução
- **Encoding:** API retorna UTF-8, mas falhas ocasionais no middleware da CGU corrompem nomes de convênios — usar `response.json()` (não `.text`)
- **Delta Load:** dados históricos de anos anteriores raramente mudam — focar reprocessamento diário apenas nos 2 últimos exercícios financeiros

---

#### Recomendações para o Supabase

- **`pg_trgm`:** habilitar extensão para fuzzy match de nomes entre Câmara e Portal — `CREATE EXTENSION pg_trgm;`
- **Materialized views:** pré-calcular totais de emendas por parlamentar por ano — garante carregamento do perfil em milissegundos no Next.js

---

### P1 — ViaCEP
| Campo | Valor |
|---|---|
| source_id | `viacep` |
| URL | `https://viacep.com.br/ws/{CEP}/json/` |
| Formato | JSON (também suporta XML, PIPED, QUERTY) |
| Autenticação | Nenhuma |
| Rate limit | Sem limite documentado — bloqueio automático apenas para scraping em massa |
| Fase | **MVP** |

**Uso:** CEP → `ibge` + `uf` → query direto em `municipios` e `politicos` — sem chamada secundária ao IBGE

**Privacidade:** CEP **nunca** armazenado no banco · usar `POST` (não `GET`) para que o CEP não apareça em logs de URL do servidor · descartar a variável após extração dos campos geográficos (LGPD)

---

#### Schema da resposta

```json
{
  "cep":        "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "bairro":     "Sé",
  "localidade": "São Paulo",
  "uf":         "SP",
  "ibge":       "3550308",
  "gia":        "1004",
  "ddd":        "11",
  "siafi":      "7107"
}
```

| Campo | Relevância |
|---|---|
| `localidade` | Nome do município — exibição na UI |
| `uf` | Estado — filtro para deputados estaduais e senadores |
| `ibge` | **Código IBGE de 7 dígitos** — chave direta para `municipios.codigo_ibge` |
| `siafi` | Código SIAFI do município — útil para cruzar com Portal da Transparência |
| `ddd` | Código de área — contexto regional |
| `logradouro`, `bairro` | Podem vir **vazios** em municípios pequenos — `localidade` + `uf` + `ibge` sempre presentes |

**Fluxo simplificado "Quem me representa":**
```
CEP → ViaCEP → { ibge, uf }
              ↓
  SELECT * FROM politicos
  WHERE municipio_id = (SELECT id FROM municipios WHERE codigo_ibge = {ibge})
     OR (cargo IN ('deputado_federal','senador') AND uf = {uf})
```

---

#### Tratamento de erros

| Cenário | HTTP Status | Resposta | Ação recomendada |
|---|---|---|---|
| CEP inválido (não-numérico ou ≠ 8 dígitos) | `400` | — | Validar com regex antes de chamar a API |
| CEP válido mas inexistente | **`200`** | `{"erro": true}` | ⚠️ Verificar `dados.get("erro")` — **não** confiar só no status code |
| Erro de servidor | `5xx` | — | Retry com backoff exponencial |

**Armadilha principal:** CEP inexistente retorna HTTP **200**, não 4xx. Sempre verificar a flag `{"erro": true}` no corpo da resposta.

---

#### Python — implementação de referência

```python
import re, requests
from requests.exceptions import RequestException, Timeout

def buscar_por_cep(cep_bruto: str) -> dict:
    """
    CEP → { municipio, uf, ibge, siafi }
    O CEP é descartado ao fim do escopo — nunca persistir.
    """
    cep = re.sub(r'\D', '', str(cep_bruto))
    if len(cep) != 8:
        return {"erro": "CEP deve ter 8 dígitos numéricos"}

    try:
        resp = requests.get(
            f"https://viacep.com.br/ws/{cep}/json/",
            headers={"User-Agent": "MeusPoliticos/1.0 (contato@meuspoliticos.com)"},
            timeout=5
        )
        resp.raise_for_status()           # levanta exceção para 4xx/5xx
        dados = resp.json()

        if dados.get("erro") is True:     # CEP inexistente (status 200 com flag)
            return {"erro": "CEP não encontrado"}

        return {
            "municipio": dados.get("localidade"),
            "uf":        dados.get("uf"),
            "ibge":      dados.get("ibge"),   # chave direta para municipios.codigo_ibge
            "siafi":     dados.get("siafi"),
        }
        # cep descartado automaticamente aqui

    except Timeout:
        return {"erro": "ViaCEP indisponível — tente novamente"}
    except RequestException as e:
        return {"erro": f"Falha de conexão: {e}"}
```

---

## 3. Matriz de fontes — Fase 2

### Senado Federal 🔶 Fase 2 — em desenvolvimento

> **Duas APIs distintas** — não confundir:

| API | URL base | O que contém |
|---|---|---|
| **Legislativa** | `https://legis.senado.leg.br/dadosabertos` | Senadores, votações, discursos, comissões, matérias |
| **Administrativa** | `https://adm.senado.gov.br/adm-dadosabertos` | CEAPS (gastos), servidores de gabinete, remunerações |

| Campo | Valor |
|---|---|
| source_id | `senado_legis` / `senado_adm` |
| Formato | XML por padrão · JSON via `Accept: application/json` ou sufixo `.json` na URL |
| Autenticação | Nenhuma |
| Rate limit | **10 req/segundo** (legislativa) |
| Estabilidade | Média — monitorar headers de depreciação |
| Fase | Fase 2 🔶 |

**Dados disponíveis:**
- Senadores (perfil, mandato, partido, UF, foto)
- Votações nominais em plenário e comissões
- CEAPS — gastos com cota parlamentar (API administrativa)
- Discursos e notas taquigráficas
- Comissões e participação
- Matérias legislativas e autorias
- Servidores de gabinete (API administrativa)

---

#### Endpoints — API Legislativa (`legis.senado.leg.br/dadosabertos`)

```
GET /senador/lista/atual
  → Lista os 81 senadores em exercício com perfil básico

GET /senador/{CodigoParlamentar}
GET /senador/{CodigoParlamentar}.json      ← sufixo .json como alternativa ao header Accept
  → Perfil completo: nome civil, nome parlamentar, UF, partido, foto, data nascimento

GET /senador/{CodigoParlamentar}/autorias
  → PLs, emendas e requerimentos de autoria do senador

GET /plenario/lista/votacao/{dataInicio}/{dataFim}
  → Votações nominais no período · formato: YYYYMMDD
  → Inclui resultado geral, orientação das bancadas e votos individuais por CodigoParlamentar

GET /senador/{CodigoParlamentar}/discursos
  → Discursos com links para texto e vídeo das sessões
```

#### Endpoints — API Administrativa (`adm.senado.gov.br/adm-dadosabertos`)

```
GET /api/v1/senadores/despesas_ceaps/{ano}
  → Todos os gastos CEAPS do ano por todos os senadores
  → Campos: nome do senador, tipo de despesa, fornecedor, CNPJ/CPF, valor bruto/líquido

GET /api/v1/servidores/lotacoes
  → Servidores vinculados a cada gabinete de senador
```

---

#### Identificador principal — `CodigoParlamentar`

O Senado usa `CodigoParlamentar` como ID único — mapeia para `senadores.id_senado` no schema. Não é o mesmo que `id_camara` da Câmara.

**JSON da resposta tem raiz nomeada** — normalizar antes de processar:
```python
data = response.json()
parlamentar = data['Parlamentar']          # perfil individual
lista = data['ListaParlamentarEmExercicio'] # lista de senadores
# usar pd.json_normalize() para achatar campos aninhados
```

Campos principais do objeto senador:

| Campo JSON | Descrição | Schema |
|---|---|---|
| `CodigoParlamentar` | ID único — chave para todos os joins | `senadores.id_senado` |
| `NomeParlamentar` | Nome parlamentar | `senadores.nome` |
| `SiglaPartido` | Partido atual | via `partidos.sigla` |
| `UfMandato` | Estado de representação | `senadores.uf` |
| `UrlFotoParlamentar` | Foto oficial | `senadores.foto_url` |

---

#### Votações simbólicas e sessões secretas

Assim como na Câmara, votações simbólicas ou sessões secretas **não retornam votos individuais**. Tratar explicitamente no ETL — registrar a votação sem votos individuais.

---

#### Monitoramento de depreciação

O Senado sinaliza mudanças via headers HTTP nas respostas:

```
Deprecation: <data em que começou a depreciação>
Sunset: <data limite para desativação>
Link: <url-novo-endpoint>; rel="successor"
```

O ETL deve logar esses headers e alertar quando presentes — evita quebras silenciosas no pipeline.

---

#### CEAPS — categorias de despesa

| Categoria | Descrição | Análise possível |
|---|---|---|
| Aluguel de escritórios | Manutenção de bases nos estados | Verificar custos acima da média regional |
| Passagens aéreas | Deslocamentos em missão | Cruzar datas com presença em sessões |
| Divulgação da atividade | Publicidade do mandato | Gastos elevados em anos eleitorais |
| Consultorias | Serviços técnicos | Identificar empresas de fachada |

---

#### Python — implementação de referência

```python
import requests, time
import pandas as pd

BASE_LEGIS = "https://legis.senado.leg.br/dadosabertos"
BASE_ADM   = "https://adm.senado.gov.br/adm-dadosabertos"
HEADERS    = {"Accept": "application/json"}

def fetch_senadores_atuais():
    resp = requests.get(f"{BASE_LEGIS}/senador/lista/atual", headers=HEADERS)
    resp.raise_for_status()
    lista = resp.json()["ListaParlamentarEmExercicio"]["Parlamentares"]["Parlamentar"]
    return pd.json_normalize(lista)

def fetch_ceaps(ano: int):
    resp = requests.get(f"{BASE_ADM}/api/v1/senadores/despesas_ceaps/{ano}", headers=HEADERS)
    resp.raise_for_status()
    # monitorar header de depreciação
    if "Deprecation" in resp.headers:
        print(f"⚠️ Endpoint em depreciação — Sunset: {resp.headers.get('Sunset')}")
    return resp.json()

def fetch_votacoes(data_inicio: str, data_fim: str):
    # formato: YYYYMMDD
    url = f"{BASE_LEGIS}/plenario/lista/votacao/{data_inicio}/{data_fim}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    time.sleep(0.1)  # respeitar 10 req/s
    return resp.json()
```

---

**Tabelas criadas (schema v2.10):**

| Tabela | Volume estimado | Status |
|---|---|---|
| `senadores` | ~500 (atual + histórico) | ⏳ pendente validação |
| `politico_senado_ids` | ~5k linkages | ⏳ pendente |
| `raw_senado` (Bronze) | variável | ⏳ pendente |
| `senado_votacoes` | 50M+ registros | ⏳ ETAPA 2 |
| `senado_materias` | 100k registros | ⏳ ETAPA 3 |
| `senado_comissoes` | 50k registros | ⏳ ETAPA 4 |
| `senado_discursos` | 500k registros | ⏳ ETAPA 5 |
| `senado_sessoes` | 5k registros | ⏳ ETAPA 6 |

**Entity resolution — CPF como âncora:**
O campo `cpf` (disponível na API da Câmara via `GET /deputados/{id}`) é usado exclusivamente no ETL para cruzar deputados e senadores na tabela `politico_senado_ids`. O CPF **nunca é persistido** no banco público — apenas o `politico_id` resultante do cruzamento.

O campo `match_confidence` (0.80–1.0) registra a confiança do cruzamento — suporta fuzzy matching para casos onde o CPF não está disponível diretamente. Linkagens abaixo de 0.90 requerem validação manual.

| Score | Critério | Ação |
|---|---|---|
| `1.0` | CPF + nome + UF coincidem exatamente | ✅ Aprovado |
| `0.95` | CPF + nome (fuzzy match) | ✅ Aprovado |
| `0.80` | Nome + UF apenas (sem CPF) | ⚠️ Revisão recomendada |
| `< 0.80` | Match fraco | ❌ Validação manual obrigatória |

Tabelas de resolução:
- `politico_ids` — mapeia IDs Câmara v1 ↔ v2 (mesmo deputado, duas versões da API)
- `politico_senado_ids` — mapeia Senado ↔ `politicos` (âncora: CPF)

**Camadas de segurança (RLS no Supabase):**
- Camada Silver (`senadores`, `senado_votacoes`, etc.): leitura pública permitida
- Camada Bronze (`raw_senado`): acesso restrito — apenas service role admin

**Deduplicação:**
A camada Bronze armazena o XML bruto com checksum SHA-256. Requisições repetidas ao mesmo endpoint são detectadas e ignoradas com `ON CONFLICT DO NOTHING`.

O campo `parse_status` rastreia o ciclo de vida de cada registro bruto:
```
pending → parsed → error
```

**Estrutura de ETAPAs:**

```
ETAPA 1   Fetch senadores          → senadores, politico_senado_ids
ETAPA 2   Fetch votações           → senado_votacoes              [⏳ implementação completa]
ETAPA 3   Fetch matérias           → senado_materias              [⏳ implementação completa]
ETAPA 4   Fetch comissões          → senado_comissoes             [⏳ implementação completa]
ETAPA 5   Fetch discursos          → senado_discursos             [⏳ implementação completa]
ETAPA 6   Fetch sessões            → senado_sessoes               [⏳ implementação completa]
ETAPA 7   Armazenar XML bruto      → raw_senado (Bronze)
ETAPA 10  Validar entity resolution via CPF
ETAPA 11  Cross-link deputados ↔ senadores
```

**Query cross-house — exemplo:**
```sql
SELECT 'Câmara' AS casa, v.descricao, v.data
FROM votacoes v
JOIN politicos p ON p.id = v.politico_id
WHERE p.cpf_hash = '<hash>'
UNION ALL
SELECT 'Senado', sv.descricao, sv.data
FROM senado_votacoes sv
JOIN senadores s ON s.id = sv.senador_id
JOIN politico_senado_ids psi ON psi.id_senado = s.id_senado
JOIN politicos p ON p.id = psi.politico_id
WHERE p.cpf_hash = '<hash>'
ORDER BY data DESC;
```

---

### TransfereGov / SICONV
| Campo | Valor |
|---|---|
| source_id | `transferegov` |
| Categoria | Financeiro |
| Fase | Fase 2 |

**Dados:** transferências voluntárias, convênios, execução de emendas

---

### SIOP — Sistema Integrado de Planejamento e Orçamento
| Campo | Valor |
|---|---|
| source_id | `siop` |
| Órgão | Ministério do Planejamento e Orçamento |
| URL base | `siop.planejamento.gov.br` |
| Categoria | Orçamentário / Programático |
| Escopo | **Federal apenas** — não cobre PPAs estaduais |
| Autenticação | Bearer token (CPF + senha) — validade 48h |
| Formato | GraphQL (JSON) · SOAP/WSDL (XML) · SPARQL (RDF) |
| Rate limit | Não documentado — usar throttling |
| Ambiente de testes | `testews.siop.gov.br` |
| Fase | Fase 2 — perfil do Presidente |

> **SIOP não tem API REST pública** no sentido convencional — requer usuário cadastrado e Bearer token renovado a cada 48h.

---

#### Endpoints

| Módulo | Tecnologia | Endpoint | Para que serve |
|---|---|---|---|
| Orçamento Impositivo | **GraphQL** | `siop.planejamento.gov.br/modulo/impositivo/itens/api` | Emendas parlamentares e execução |
| Monitoramento PPA | **SOAP/WSDL** | `siop.planejamento.gov.br/services/WSMonitoramento?wsdl` | Metas físicas e indicadores do PPA |
| Dados Abertos | **SPARQL** | `siop.planejamento.gov.br/sparql/` | Consultas semânticas — público, sem auth |
| Login | REST | `siop.planejamento.gov.br/modulo/login/rest/login` | Gerar Bearer token |

---

#### Autenticação

```python
import requests, time

LOGIN_URL = "https://www.siop.planejamento.gov.br/modulo/login/rest/login"

def autenticar_siop(cpf, senha):
    resp = requests.post(LOGIN_URL, json={"cpf": cpf, "senha": senha})
    resp.raise_for_status()
    token = resp.text.replace('"', '')
    expiry = time.time() + (48 * 3600)  # token válido por 48h — renovar antes de expirar
    return token, expiry
```

---

#### Hierarquia do PPA — schema

```
Programa                  ← unidade que articula a política pública
  └─ Objetivo Geral       ← declaração de intenção de alto nível
       └─ Objetivo Específico  ← resultados esperados
            ├─ Meta       ← valor quantitativo do indicador no período
            ├─ Indicador  ← métrica de desempenho (linha de base + polaridade)
            └─ Entrega    ← bem ou serviço entregue à sociedade
                 ├─ Meta da Entrega   ← quantificação física da entrega
                 └─ Ação Orçamentária ← vínculo financeiro (código de 17 dígitos)
```

**⚠️ Metas cumulativas:** se uma meta é marcada como cumulativa, o valor do ano N inclui os anos anteriores. Tratar no ETL para não mostrar queda onde houve progresso acumulado.

---

#### Chave de cruzamento SIOP ↔ Portal da Transparência

O código da **Ação Orçamentária** é o elo entre os dois sistemas:

```
Código de 17 dígitos:
[Esfera 2] [UO 5] [Função 2] [Subfunção 3] [Programa 4] [Ação 4] [Localizador 4]
   99        99999     99         999           9999         AAAA       9999

Exemplo: 10.71100.10.302.2301.20B4.0001
         │    │    │   │     │    │    └─ Localizador
         │    │    │   │     │    └─────── Ação (AAAA) ← chave de cruzamento
         │    │    │   │     └──────────── Programa PPA (2301)
         │    │    │   └────────────────── Subfunção (Assistência Hospitalar)
         │    │    └────────────────────── Função (Saúde)
         │    └─────────────────────────── Unidade Orçamentária (Ministério)
         └──────────────────────────────── Esfera (Fiscal)
```

**Fluxo de cruzamento:**
```
SIOP: meta física → ação orçamentária (AAAA)
Portal da Transparência: /despesas?acao=AAAA → valorEmpenhado + valorPago
Resultado: custo unitário = valorPago ÷ quantidadeAlcançada
```

---

#### Ciclo de atualização

| Evento | Quando | Impacto |
|---|---|---|
| Monitoramento semestral | Janelas definidas pelo MPO (ex: ago–set) | Metas físicas atualizadas |
| Revisão anual do PPA | 1º semestre — Projeto de Lei ao Congresso | Metas podem ser alteradas |
| Sinalização de revisão | Quando gestor percebe que não atingirá meta | Campo `sinalizacao_revisao = true` |

**Para detectar "baixar a régua":** monitorar o campo `Sinalização de necessidade de revisão` + campo `Análise sintética da realização da entrega` (texto qualitativo obrigatório quando a meta é revisada).

---

#### PPAs estaduais — fora do SIOP

**O SIOP cobre apenas o governo federal.** Para governadores, buscar por estado:

| Estado | Fonte | Formato |
|---|---|---|
| São Paulo | Portal da Fazenda / Sistema PPA-SP | CSV (monitoramento físico e financeiro) |
| Minas Gerais | Portal de Transparência MG (CKAN) | API de dados abertos |
| Rio de Janeiro | SEPLAG-CE / Projeto Avança RJ | Iniciativas e metodologia de monitoramento |
| Paraná | SEPLAN-PR / Siconfi | Monitoramento físico + execução financeira |
| Ceará | SEPLAG-CE | Volumes de revisão e demonstrativos por região |
| Demais estados | Siconfi (execução financeira) | Metas físicas via scraping do DOE estadual |

---

---

### DataJud — CNJ
| Campo | Valor |
|---|---|
| source_id | `datajud` |
| Órgão | Conselho Nacional de Justiça (CNJ) |
| URL base | `api-publica.datajud.cnj.jus.br` |
| Categoria | Judicial |
| Escopo | **Todos os tribunais do país** — incluindo Justiça Eleitoral |
| Formato | JSON — API pública |
| Autenticação | Pública |
| Fase | Fase 2 — ficha limpa, cassação, processos eleitorais |

**Por que é estratégico:**
Centraliza metadados processuais de **todo o Judiciário brasileiro** em uma única API. Para monitorar processos que podem levar à cassação de um político eleito, é superior à consulta individual a cada TRE.

**Dados disponíveis:**
- Histórico de processos de qualquer político em qualquer tribunal
- Número Único do Processo (NUP) — chave universal para cruzamento
- Metadados: tipo de ação, partes, situação, movimentações
- Cobertura: Justiça Eleitoral, Justiça Federal, TJs estaduais

**Uso no projeto:**
Buscar processos pelo CPF ou nome do político → exibir no perfil: "possui X processos em andamento na Justiça Eleitoral". Para peças processuais detalhadas, referenciar os webservices PJe dos TREs específicos.

**Limitação:** metadados processuais — não retorna o conteúdo das peças.

---

### TREs — Tribunais Regionais Eleitorais

> **Conclusão técnica:** integração individual com os 27 TREs é **desnecessária** para dados de candidatos e resultados. O TSE federal já cobre 100% com granularidade máxima (nível de seção).

**URL padrão:** `tre-{uf}.jus.br` (ex: `tre-sp.jus.br`, `tre-mg.jus.br`)

**Quando os TREs agregam valor real:**

| Cenário | Quais TREs | Como usar |
|---|---|---|
| **Geolocalização** — coordenadas GPS exatas de locais de votação (lacuna no dataset consolidado do TSE) | TRE-SC · TRE-ES · TRE-SP | CSV/JSON com lat/lng das seções — mapas de calor de votação |
| **Monitoramento judicial em tempo real** — decisões de plenário e liminares de cassação antes da publicação nacional | TRE-SE (iPleno) · TRE-BA · TRE-RR | Webservices PJe + sistema iPleno |
| **Serviços ao cidadão** — contatos de zonas eleitorais, validação de títulos | Qualquer TRE | RSS + endpoints de certidão |

**Para os outros 24 TREs:** delegam inteligência de dados eleitorais ao TSE. Portais focam em transparência administrativa (licitações de urnas, servidores, orçamento do tribunal).

**Recomendação para o MVP e Fase 2:** ignorar os TREs. Usar TSE + DataJud. Retomar TRE-SC e TRE-ES apenas se implementar mapa de calor de votação.

---

### DOU — Diário Oficial da União

| Campo | Valor |
|---|---|
| source_id | `dou` |
| Órgão | Imprensa Nacional (SEGES/MGI) |
| Portal | `www.in.gov.br` |
| Portal dados abertos | `inlabs.seges.gov.br` |
| Formato | XML + PDF por data/seção |
| Autenticação | Cadastro gratuito (e-mail ou gov.br) — sem cobrança |
| API REST de busca | ❌ **Não existe** — sem endpoint de query por termo |
| Rate limit | Não documentado — uso moderado |
| Cobertura histórica | Arquivo digital desde 1990 · XML aberto desde 2020 |
| Frequência | Diária (seg–sáb) · disponível ~10h para a edição do dia anterior |
| Fase | Fase 2 — atos presidenciais e ministeriais |

---

#### As 3 seções do DOU

| Seção | Conteúdo | Relevância para a plataforma |
|---|---|---|
| **Seção 1** | Decretos, MPs, leis, portarias normativas | ✅ Alta — atos do Presidente e Ministros |
| **Seção 2** | Nomeações, exonerações, promoções, aposentadorias | ✅ Alta — quando político assume ou deixa cargo |
| **Seção 3** | Contratos, editais, licitações, avisos | ⚠️ Baixa — gestão administrativa |

**Para perfis de políticos:** monitorar **Seção 1** (atos normativos) + **Seção 2** (atos de pessoal). Ignorar Seção 3.

---

#### Atos relevantes por tipo

| Tipo de ato | Seção | Como identificar no XML |
|---|---|---|
| Decretos presidenciais | Seção 1 | Campo órgão = `Presidência da República` + tipo = `Decreto` |
| Medidas Provisórias | Seção 1 | Tipo = `Medida Provisória` · também rastreável via Câmara/Senado |
| Nomeação de ministro | Seção 2 | Tipo = `Portaria` ou `Ato de Nomeação` + nome do político |
| Exoneração de ministro | Seção 2 | Tipo = `Exoneração` + nome do político |
| Deputado nomeado para cargo Executivo | Seção 2 | Nome do deputado em Seção 2 |

---

#### Estratégia de ingestão — sem API de busca

O INLABS não tem endpoint de query. O fluxo correto é:

```
1. Diariamente às 10h30:
   → baixar XML da data de ontem, Seção 1 + Seção 2
   → URL padrão: inlabs.seges.gov.br/{ano}/{mes}/{dia}/do{secao}-{data}.xml
   
2. Processar o XML localmente:
   → extrair campos: órgão, tipo de ato, número, data, texto
   → filtrar por nomes dos políticos monitorados (tabela politicos.nome_civil)
   → NER para desambiguação quando necessário
   
3. Inserir matches em feed_eventos com source_id = 'dou'
```

**Delta strategy:** baixar apenas a data do dia. Nunca reprocessar anos inteiros.

---

#### Ro-DOU — não é API pública

O Ro-DOU (SEGES/MGI) é uma ferramenta open source baseada em **Apache Airflow** que faz clipping do DOU com notificações por e-mail/Slack. **Não tem endpoint REST público** — é uma aplicação que você instala. Útil como referência de arquitetura para construir o monitor próprio da plataforma.

**Referência:** [github.com/gestaogovbr/Ro-dou](https://github.com/gestaogovbr/Ro-dou)

---

---

### PNCP — Portal Nacional de Contratações Públicas
| Campo | Valor |
|---|---|
| source_id | `pncp` |
| Órgão | Ministério da Gestão e Inovação (MGI) |
| URL base | `pncp.gov.br/api/pncp/v1` |
| Categoria | Contratos e Licitações |
| Escopo | **Todos os entes federativos** — União, estados e municípios |
| Oficial | Sim — obrigatório por Lei 14.133/2021 |
| Formato | JSON — API REST |
| Autenticação | Pública |
| Fase | Fase 2 — governadores + perfil de políticos |

**Por que é estratégico:**
Substitui a necessidade de integrar **27 portais de compras estaduais** separados. Toda licitação e contrato estadual publicado a partir de 2021 está centralizado aqui em uma única API padronizada.

**Dados disponíveis:**
- Editais e contratos de todos os estados e municípios
- Planos de contratação anuais por secretaria
- Atas de registro de preços
- Contratos vigentes por órgão/secretaria

**Uso no projeto:**
Filtrar por CNPJ do órgão estadual (ex: `Secretaria de Educação — SP`) para mostrar contratos celebrados por uma gestão. Cruzar com empresas ligadas a políticos.

---

### Siconfi — Sistema de Informações Contábeis e Fiscais
| Campo | Valor |
|---|---|
| source_id | `siconfi` |
| Órgão | Tesouro Nacional |
| URL base | `siconfi.tesouro.gov.br` |
| Categoria | Contabilidade Fiscal |
| Escopo | **Todos os entes federativos** — União, estados e municípios |
| Oficial | Sim — prestação de contas obrigatória |
| Formato | CSV / API |
| Fase | Fase 2 — perfil do governador / execução orçamentária |

**Por que é estratégico:**
Centraliza a **LOA e a execução orçamentária de todos os 27 estados** em um único sistema. Códigos de função e subfunção são padronizados pelo Tesouro Nacional — facilita comparação entre estados.

**Dados disponíveis:**
- LOA estadual por função/subfunção (Educação, Saúde, Segurança)
- Dotação inicial vs. gasto efetivo por secretaria
- Ranking de qualidade das informações contábeis (validador de confiabilidade)
- Receitas e despesas consolidadas por estado

**Uso no projeto:**
Mostrar no perfil do governador: "quanto o estado gastou em Saúde vs. o previsto na LOA". Comparar execução orçamentária entre estados na mesma função.

---

| Fonte | Dados | Complexidade | Fase |
|---|---|---|---|
| STF | Ações, decisões, processos | Alta — jurídico sensível | 3 |
| STJ | Processos | Alta | 3 |
| TCU | Condenações, irregularidades, auditorias | Alta | 3 |
| Assembleias Estaduais | Dep. estaduais, votações | Muito alta — 27 sistemas diferentes | 3 |
| Governos Estaduais | Governadores, execução orçamentária, contratos | Alta — 27 sistemas, qualidade variável | 3 |
| Câmaras Municipais | Vereadores | Extrema — 5.570 sistemas | 4 |
| Prefeituras | Prefeitos, execução orçamentária municipal | Extrema — 5.570 sistemas | 4 |
| Diários Oficiais Municipais | Nomeações, exonerações, contratos | Extrema — OCR · Querido Diário | 4+ |

---

### ⏳ Fase 4 — Câmaras Municipais e Prefeituras

> **Levantamento pendente.** Usar o prompt abaixo no Gemini Deep Research quando chegar a hora.

**Contexto antes de pesquisar:**
- TSE já cobre candidatos e resultados de vereadores — não precisa das câmaras para isso
- O que falta: **atividade legislativa** (votações, projetos de lei, gastos de gabinete) e **execução orçamentária das prefeituras**
- Escopo: 5.570 municípios — impossível integrar todos · estratégia será priorizar capitais + municípios com população > 500k

---

**📋 Prompt modelo — Gemini Deep Research:**

```
Estou construindo uma plataforma brasileira de transparência política
chamada Meus Políticos (meuspoliticos.com). Preciso de um levantamento
técnico sobre fontes de dados de câmaras municipais e prefeituras
brasileiras para integração via Python.

Contexto:
- Já tenho integração federal (Câmara, Senado, TSE, Portal da
  Transparência) e estadual (assembleias + governos)
- Para dados eleitorais (candidatos, resultados, bens) de vereadores
  e prefeitos, o TSE já cobre tudo — não preciso das câmaras para isso
- O que falta: atividade legislativa local e execução orçamentária
  das prefeituras
- Estratégia de priorização: capitais (26 + DF) primeiro, depois
  municípios com população acima de 500k

Pesquise e documente:

1. Câmaras Municipais — atividade legislativa:
   - Existe algum sistema nacional padronizado para câmaras municipais
     (similar ao SAPL das assembleias estaduais)?
   - Quais câmaras das capitais têm API REST ou portal de dados abertos?
   - Tabela: Capital | URL da câmara | Tem API | Dados disponíveis
     (votações, projetos, gastos, presença)
   - O Interlegis/SAPL é usado por câmaras municipais? Em que escala?

2. Prefeituras — execução orçamentária:
   - Existe sistema nacional centralizado de transparência municipal
     (similar ao Siconfi para estados)?
   - O PNCP cobre contratos municipais? Com qual completude?
   - Quais prefeituras das capitais têm portal de dados abertos com API?
   - Tabela: Capital | URL portal | Tem API | Dados disponíveis

3. Querido Diário (OKBr):
   - Cobertura atual: quais municípios/capitais já estão no projeto?
   - Tem API para consulta dos diários processados?
   - Como integrar com a plataforma?

4. Siconfi municipal:
   - O Siconfi do Tesouro Nacional cobre municípios além dos estados?
   - Quais dados financeiros municipais estão disponíveis centralmente?
   - Como filtrar por município específico?

5. Estratégia de priorização:
   - Quais das 26 capitais têm os dados mais ricos e estruturados?
   - Existe alguma iniciativa de padronização nacional para câmaras
     municipais em andamento?
   - O que é possível fazer via PNCP + Siconfi + TSE sem precisar
     integrar câmaras individualmente?

Formato esperado: tabelas com URLs, status de API e dados disponíveis
para cada capital. Resposta objetiva — se não há dados estruturados
para câmaras municipais, confirmar isso explicitamente.
```

---

> Padrão de URL: `transparencia.{uf}.gov.br`
> Perfil do governador = **TSE** (foto, partido, mandato) + **portal estadual** (gastos) + **PNCP** (contratos) + **Siconfi** (orçamento)
> Gastos do gabinete: filtrar execução orçamentária pela **Unidade Gestora** = `Casa Civil` / `Gabinete do Governador`

#### Tabela completa — 27 estados (Executivo)

| Estado | Sigla | URL | Tem API | Dados do governador | Dados orçamentários |
|---|---|---|---|---|---|
| Acre | AC | `transparencia.ac.gov.br` | ❌ | HTML / Estático | CSV e PDF |
| Alagoas | AL | `transparencia.al.gov.br` | ✅ | Estruturado | API e CSV |
| Amapá | AP | `transparencia.ap.gov.br` | ❌ | Opaco | PDF / CSV |
| Amazonas | AM | `transparencia.am.gov.br` | ✅ | HTML | API e CSV |
| Bahia | BA | `transparencia.ba.gov.br` | ⚠️ Parcial | HTML | CSV e JSON |
| Ceará | CE | `cearatransparente.ce.gov.br` | ✅ | Estruturado | API / JSON / CSV |
| Distrito Federal | DF | `transparencia.df.gov.br` | ✅ | Estruturado | API e CSV |
| Espírito Santo | ES | `transparencia.es.gov.br` | ✅ | Estruturado | API / JSON / CSV |
| Goiás | GO | `transparencia.go.gov.br` | ✅ | Estruturado | API e CSV |
| Maranhão | MA | `transparencia.ma.gov.br` | ❌ | HTML | CSV |
| Mato Grosso | MT | `transparencia.mt.gov.br` | ✅ | HTML | API e CSV |
| Mato Grosso do Sul | MS | `transparencia.ms.gov.br` | ✅ | HTML | API e CSV |
| Minas Gerais | MG | `transparencia.mg.gov.br` | ✅ CKAN | Estruturado | API / JSON / CSV |
| Pará | PA | `transparencia.pa.gov.br` | ❌ | HTML | PDF / CSV |
| Paraíba | PB | `transparencia.pb.gov.br` | ❌ | HTML | CSV |
| Paraná | PR | `transparencia.pr.gov.br` | ✅ | Estruturado | API e CSV |
| Pernambuco | PE | `transparencia.pe.gov.br` | ✅ CKAN | Estruturado | API / JSON / CSV |
| Piauí | PI | `transparencia.pi.gov.br` | ❌ | HTML | PDF / CSV |
| Rio de Janeiro | RJ | `transparencia.rj.gov.br` | ✅ | HTML | API e CSV |
| Rio G. do Norte | RN | `transparencia.rn.gov.br` | ❌ | HTML | CSV |
| Rio G. do Sul | RS | `transparencia.rs.gov.br` | ✅ | Estruturado | API / CSV / JSON |
| Rondônia | RO | `transparencia.ro.gov.br` | ❌ | HTML | CSV |
| Roraima | RR | `transparencia.rr.gov.br` | ❌ | Opaco | PDF |
| Santa Catarina | SC | `transparencia.sc.gov.br` | ✅ | HTML | CSV e JSON |
| São Paulo | SP | `transparencia.sp.gov.br` | ✅ CKAN | Estruturado | API / JSON / CSV |
| Sergipe | SE | `transparencia.se.gov.br` | ❌ | HTML | CSV |
| Tocantins | TO | `transparencia.to.gov.br` | ❌ | HTML | PDF / CSV |

---

#### Prioridade de integração — Executivo estadual

**Tier 1 — Integrar primeiro (API + dados ricos):**

| Estado | Por quê |
|---|---|
| **Espírito Santo** | Lidera rankings CGU e TI — diárias, viagens e execução orçamentária granulares por UG |
| **Goiás** | Plataforma moderna — contratos e licitações rastreáveis de forma granular |
| **Minas Gerais** | CKAN com metadados Frictionless Data — despesas empenhadas/liquidadas/pagas, convênios |
| **Ceará** | Referência nacional — orçamento até participação social estruturados |
| **São Paulo** | CKAN + compras integradas ao PNCP — análise profunda da gestão |
| **Paraná** + **Rio G. do Sul** | APIs estáveis, painéis específicos de diárias e transferências municipais |

**Tier 2 — Possível com esforço moderado:** AL, AM, DF, MT, MS, PE, RJ, SC

**Tier 3 — Alto custo / scraping obrigatório:**

| Estado | Problema |
|---|---|
| **Amapá** | Pior pontuação ITGP 2025 — falhas graves em despesas e diárias |
| **Roraima** | Transparência passiva — execução orçamentária do gabinete indisponível |
| **Acre** + **Piauí** | Portais truncados, download intermitente, exige scraper de alta manutenção |

---

#### Estratégia do perfil do governador

| Dado | Fonte | Método |
|---|---|---|
| Foto, partido, mandato, histórico | **TSE** | API CKAN — mesma integração dos deputados |
| Gastos do gabinete e diárias | Portal estadual (Tier 1) | Filtro por UG: `Casa Civil` / `Gabinete do Governador` |
| Viagens pagas pelo estado | Portal estadual | Busca por CPF do governador em despesas por favorecido |
| Contratos das secretarias | **PNCP** | API centralizada — sem precisar acessar 27 portais |
| LOA previsto vs. executado | **Siconfi** | API federal — funções padronizadas pelo Tesouro Nacional |
| Decretos e atos oficiais | DOE via scraping | Scrapy + Tesseract + LLM (Fase 3+) |

---

#### Diários Oficiais Estaduais (DOE)

**Situação atual:** maioria em PDF sem OCR — API REST para DOE estadual é raridade. RS e PR têm busca por palavras-chave nas imprensas oficiais.

**Querido Diário (OKBr):** foco em municípios — cobertura estadual parcial e indireta. Não cobre DOEs estaduais de forma sistemática.

**Estratégia de extração — Fase 3+:**
```
1. Spider (Scrapy / Selenium)
   → navegar na imprensa oficial · baixar edições diárias

2. OCR (Tesseract)
   → extrair texto de PDFs sem camada de texto

3. NLP / LLM (modelo Ro-DOU)
   → identificar: autoridade · tipo de ato (Decreto, Nomeação, Exoneração)
   → gerar registro estruturado para o perfil do governador
```

Priorizar estados Tier 1 primeiro — maior relevância política e maior probabilidade de PDF com OCR já embutido.

---

> Não existe uma "API única dos estados". Cada assembleia opera sistema próprio.
> Padrão mais comum: **SAPL** (Interlegis/Senado) — tem API REST nas versões 3.1+
> Domínio padrão: `al.{uf}.leg.br`

#### Tabela completa — 27 estados

| Estado | Sigla | URL | Tem API | Dados políticos disponíveis |
|---|---|---|---|---|
| Acre | AC | `app.al.ac.leg.br/dados-abertos` | ✅ SAPL | Proposições, votações, presença, gastos |
| Alagoas | AL | `al.al.leg.br/transparencia` | ❌ CSV/XLS | Salários, servidores, despesas |
| Amapá | AP | `al.ap.gov.br/transparencia` | ⚠️ Parcial | Leis, despesas, presença |
| Amazonas | AM | `sapl.al.am.leg.br` | ✅ SAPL | Parlamentares, votações, tramitação |
| Bahia | BA | `al.ba.gov.br/transparencia` | ❌ Files | Verbas indenizatórias, frequência, emendas |
| Ceará | CE | `transparencia.al.ce.gov.br` | ⚠️ Parcial | Gastos, projetos, presença, remunerações |
| Distrito Federal | DF | `dados.df.gov.br` | ✅ CKAN | Emendas, diárias, passagens |
| Espírito Santo | ES | `dados.es.gov.br` | ❌ CSV | Gastos, servidores, contratos |
| Goiás | GO | `portal.al.go.leg.br/transparencia` | ⚠️ Parcial | Gastos parlamentares, diárias, licitações |
| Maranhão | MA | `al.ma.leg.br/transparencia` | ❌ | Gastos, diárias, projetos, servidores |
| Mato Grosso | MT | `api.al.mt.gov.br` | ✅ API REST | Proposições, votações, orçamento, pessoal |
| Mato Grosso do Sul | MS | `transparencia.al.ms.gov.br` | ❌ | Gastos parlamentares, pessoal, diárias |
| Minas Gerais | MG | `dadosabertos.almg.gov.br` | ✅ API v2 | Parlamentares, projetos, votações, orçamento |
| Pará | PA | `alepa.pa.gov.br/transparencia` | ❌ | Gastos, salários, convênios |
| Paraíba | PB | `al.pb.leg.br/transparencia` | ❌ Files | Projetos, despesas, servidores |
| Paraná | PR | `transparencia.assembleia.pr.leg.br` | ✅ API | Gastos, votações, presenças |
| Pernambuco | PE | `dadosabertos.alepe.pe.gov.br` | ✅ API | Atividade parlamentar, despesas, pessoal |
| Piauí | PI | `sapl.al.pi.leg.br` | ✅ SAPL | Matérias legislativas, presença, votação |
| Rio de Janeiro | RJ | `alerj.rj.gov.br/transparencia` | ❌ PDF/HTML | Gastos parlamentares, salários (opacos) |
| Rio G. do Norte | RN | `dadosabertos.al.rn.leg.br` | ❌ Files | Projetos, despesas, parlamentares |
| Rio G. do Sul | RS | `al.rs.gov.br/transparencia` | ❌ | Gastos, diárias, presença, servidores |
| Rondônia | RO | `sapl.al.ro.leg.br` | ✅ SAPL | Matérias legislativas, votações, presença |
| Roraima | RR | `al.rr.leg.br/transparencia` | ❌ | Gastos, salários, projetos |
| Santa Catarina | SC | `transparencia.alesc.sc.gov.br` | ❌ | Gastos parlamentares, servidores, diárias |
| São Paulo | SP | `al.sp.gov.br/transparencia` | ⚠️ XML | Deputados, gastos, presença, projetos |
| Sergipe | SE | `al.se.leg.br/transparencia` | ❌ | Despesas parlamentares, pessoal, diárias |
| Tocantins | TO | `al.to.leg.br/transparencia` | ❌ | Gastos parlamentares, salários |

---

#### Prioridade de integração

**Fase 3 — Integrar primeiro (APIs estruturadas):**

| Estado | Por quê |
|---|---|
| **Minas Gerais** (ALMG) | Referência nacional — API v2 modular, JSON+XML, documentada, estável |
| **Mato Grosso** (ALMT) | API mais robusta do país — votações, orçamento, pessoal, Selo Diamante ATRICON 2024/25 |
| **Pernambuco** (ALEPE) | Catálogo abrangente — despesas de gabinete, atividade parlamentar, cruzamentos complexos |
| **Paraná** (ALEP) | 100% de transparência no PNTP 2025 — votações, presenças, gastos granulares |
| **Distrito Federal** (CLDF) | CKAN nativo, emendas parlamentares, Diamante 98,84% — integração simples |
| **Amazonas** + **Piauí** + **Acre** + **Rondônia** | SAPL 3.1 com API habilitada — endpoints documentados via Swagger |

**Fase 3+ — Alto custo, integração por scraping:**

| Estado | Problema |
|---|---|
| **Rio de Janeiro** | Opacidade histórica — dados de pessoal e gastos em PDF/HTML |
| **Rio Grande do Norte** e **Sergipe** | Fragmentação de sistemas, sem suporte a extração automatizada |
| **Roraima** e **Maranhão** | Ausência de dados estruturados, atualização irregular |

---

#### SAPL — Sistema de Apoio ao Processo Legislativo

Desenvolvido pelo **Programa Interlegis do Senado Federal**. Versões 3.1+ expõem API REST documentada via Swagger.

Estados que usam SAPL (API disponível): AC, AM, PI, RO — e possivelmente outros não identificados.

Endpoint padrão: `sapl.al.{uf}.leg.br/api/`

Dados disponíveis via SAPL:
- Votações nominais por parlamentar
- Presença em sessões plenárias e ordem do dia
- Proposições com ementa, autor e tramitação completa

---

#### Desafios específicos da camada estadual

**Sem ID nacional para deputados estaduais:**
Não existe equivalente do `id_camara` para deputados estaduais. Estratégia de identificação:
1. CPF (quando disponível na fonte) — chave primária ideal
2. Nome + UF cruzado com base do TSE — fallback confiável
3. Chave composta `nome_normalizado + uf + partido + ano_eleicao` — último recurso

**Cota parlamentar estadual ("Verba Indenizatória"):**
Cada assembleia define suas próprias categorias de despesa — não há padronização nacional. Muitos estados publicam apenas comprovantes em PDF ou consolidam mensalmente. Requer normalização manual das categorias por estado.

**Agenda e decretos do governador:**
Raramente disponível em API. Geralmente em HTML institucional ou Diário Oficial do Estado (DOE). Alternativa: **Querido Diário** (Open Knowledge Brasil) — extrai dados de diários oficiais municipais, cobertura estadual crescente.

---

#### Iniciativas de unificação relevantes

| Iniciativa | O que é | Utilidade |
|---|---|---|
| **UNALE** | Repositório de proposições das 27 casas · 29k+ proposições · atualização semanal | Busca transversal por tema/estado — sem API profunda |
| **Interlegis / .leg.br** | Domínio padronizado + SAPL para casas com menor orçamento | Permite rastrear portais por `al.{uf}.leg.br` |
| **CKAN** | Adotado por DF e ES seguindo diretriz da INDA federal | API nativa JSON para busca e download |
| **Querido Diário** (OKBr) | OCR e extração de diários oficiais | Decretos e atos do governador — cobertura estadual em expansão |

---

## 4b. Fontes de Notícias — "Na imprensa" + Feed + Resumos de IA

> **Princípio:** a plataforma nunca editorializa — agrega e linka. Exibir apenas título + fonte + snippet + link. Nunca reproduzir o artigo integral.
>
> **Estratégia híbrida:** RSS para ingestão contínua de fontes brasileiras · APIs para busca reativa por nome de político

---

### Agências oficiais brasileiras

| Fonte | source_id | Tipo | Uso | Reprodução |
|---|---|---|---|---|
| **Agência Brasil (EBC)** | `agencia_brasil` | RSS + reprodução livre | AI summaries — sem risco de copyright | ✅ Livre com citação |
| **Agência Câmara** | `agencia_camara` | 21 feeds RSS por tema | Contextualizar votações e audiências | Snippets + link |
| **Agência Senado** | `agencia_senado` | Swagger API (discursos + proposições) | Cobertura institucional do Senado | Snippets + link |

**Agência Brasil** é a fonte prioritária para AI summaries — reprodução integral permitida com atribuição, mitigando riscos legais de LLM processing.

**Agência Câmara** — feeds RSS organizados por editoria (Administração Pública, Economia, Direito e Justiça etc.). Não tem endpoint de "notícias" na API de dados abertos — usar RSS.

---

### Grandes portais brasileiros — RSS

Todos os portais abaixo têm RSS público. Nenhum tem API REST para desenvolvedores.

| Portal | Feeds disponíveis | Observação |
|---|---|---|
| **G1** | Por editoria + por estado | Maior portal gratuito do Brasil — cobertura regional útil para base eleitoral |
| **Folha de S.Paulo** | Editorias + colunas de opinião | Útil para análise de espectro editorial |
| **O Estado de S.Paulo** | Editorias + colunas | Idem |
| **UOL Notícias** | Editorias gerais | Ampla cobertura |
| **O Globo** | Editorias | Relevante para cobertura federal/RJ |
| **Valor Econômico** | Economia + política | Relevante para emendas e orçamento |

**Vantagem do RSS sobre scraping:** formato XML estável, detecção rápida de novos artigos, sem risco de bloqueio anti-bot.

---

### APIs de agregadores internacionais

#### Bing News Search API v7 ← recomendado
| Campo | Valor |
|---|---|
| source_id | `bing_news` |
| URL | `api.bing.microsoft.com/v7.0/news/search` |
| Filtros | `mkt=pt-BR` · `cc=BR` · busca por nome do político |
| Rate limit | 250 TPS (S1) · 1 TPS gratuito (1.000/mês) |
| Custo | ~US$ 0,28 por 1k transações (S1) |
| Vantagem | Alta escalabilidade para picos · filtro regional nativo |

#### NewsAPI.org
| Campo | Valor |
|---|---|
| source_id | `newsapi` |
| Endpoint | `/v2/everything?q={nome}&language=pt&country=br` |
| Cobertura | 150k+ fontes globais · filtro por idioma e país |
| Ordenação | `relevancy` / `popularity` / `publishedAt` |
| Uso | Busca reativa por nome do político no perfil |

#### NewsData.io ← melhor para AI summaries
| Campo | Valor |
|---|---|
| source_id | `newsdata` |
| Diferencial | Metadados de IA: categorias, sentimento, NER de organizações/regiões |
| Arquivo histórico | Até 8 anos — trajetória de parlamentares veteranos |
| Uso | Enriquecer resumos de IA com contexto histórico |

#### GDELT Project ← monitoramento de tom
| Campo | Valor |
|---|---|
| source_id | `gdelt` |
| Acesso | Google BigQuery (gratuito com cota) |
| Atualização | A cada 15 minutos |
| Diferencial | Métrica de "Tone" — sentimento global da cobertura de um político |
| Feature única | Detecta edições silenciosas em notícias após publicação |
| Uso | Calibrar disclaimer de neutralidade nos resumos de IA |

#### ⚠️ Google Custom Search — não usar
Descontinuado para novos clientes · encerramento definitivo em **1º de janeiro de 2027**. Substituto oficial: Vertex AI Search.

---

### Custo estimado para monitorar ~600 políticos

| Estratégia | Custo/mês | Observação |
|---|---|---|
| RSS only (agências + portais) | R$ 0 | Cobre bem fontes brasileiras — sem busca por nome |
| RSS + Bing News S1 (4x/dia por político) | ~US$ 200–400 | 600 políticos × 4 buscas × 30 dias = ~72k transações |
| RSS + NewsAPI Developer | ~US$ 449 | Plano developer · 250k req/mês |
| GDELT (BigQuery) | ~US$ 0–30 | Depende do volume de queries |

---

### NER — Identificação e desambiguação de políticos

O maior desafio técnico: identificar "Deputado João da Silva" em texto que menciona só "João da Silva".

**Stack recomendado:**

| Componente | Tecnologia | Por quê |
|---|---|---|
| Modelo base | **BERTimbau** (BERT em português) | Pré-treinado em português brasileiro |
| Dataset de ajuste fino | **LeNER-Br** | Documentos legislativos e jurídicos anotados manualmente |
| Dataset complementar | **UlyssesNER-Br** | Foco em textos parlamentares brasileiros |
| Performance esperada | F1 ~90% em textos legislativos | Alta precisão para o domínio político |

**Fluxo de desambiguação:**
```
Texto da notícia
  → BERTimbau NER → extrai "João da Silva" como PESSOA
  → cruzar com tabela politicos (nome_civil, nome_urna, UF, partido)
  → match_confidence ≥ 0.85 → vincular ao politico_id
  → abaixo de 0.85 → fila de revisão manual
```

---

### Deduplicação de notícias

Mesma notícia publicada por 10 veículos = 1 card no feed.

**Algoritmo: MinHash LSH** (biblioteca Python `datasketch`)

```python
from datasketch import MinHash, MinHashLSH

# Fluxo de deduplicação
def deduplicar_noticias(textos):
    lsh = MinHashLSH(threshold=0.8, num_perm=128)
    # 1. Normalizar (minúsculas, sem pontuação, sem stopwords)
    # 2. Shingle (tokens de 3 palavras)
    # 3. Gerar assinatura MinHash por notícia
    # 4. Agrupar similares em "baldes" (buckets)
    # → exibir apenas 1 por grupo, com link para os demais
```

Threshold 0.8 = agrupa notícias com 80%+ de similaridade Jaccard.

---

### Neutralidade e qualidade editorial

**Categorias de fonte por nível de neutralidade:**

| Categoria | Exemplos | Rigor |
|---|---|---|
| Agência oficial | Agência Câmara, Agência Senado | Máximo — institucional |
| Agência pública | Agência Brasil (EBC) | Alto — serviço público |
| Mídia convencional | G1, Folha, Estadão, UOL | Variável — analisar valência |
| Fact-checking | **Projeto Comprova** (24 veículos: Folha, UOL, SBT, AFP...) | Máximo — verificabilidade |

**Manchetômetro (LEMEP/IESP-UERJ):** metodologia de análise de valência — classifica notícias como Positiva / Negativa / Neutra / Ambivalente. Referência para calibrar os resumos de IA da plataforma.

**Projeto Comprova:** coalizão de 24 veículos brasileiros para verificação de desinformação. Usar como lista de "fontes de referência" no algoritmo de ranqueamento.

---

### Regras de armazenamento e copyright

| O que fazer | O que não fazer |
|---|---|
| Armazenar: título + fonte + snippet + link + data | Reproduzir artigo integral |
| Armazenamento técnico temporário para LLM processing | Publicar conteúdo de terceiros como próprio |
| Reprodução integral apenas da Agência Brasil (EBC) | Ignorar notificações de remoção (Lei 9.610/98) |
| Exibir link direto para o veículo original | Hospedar imagens do veículo sem autorização |

**Precedente STJ (REsp 2.057.908):** plataformas devem suspender exibição de conteúdo protegido após notificação do autor, sem necessidade de ordem judicial.

---

> Regra de ouro: **nunca misturar fontes silenciosamente.** Todo dado armazenado deve ter `source_id` e `collected_at`.

| Campo | Source of truth | Fonte secundária |
|---|---|---|
| `nome` | Câmara (em exercício) / TSE (candidatos) | — |
| `nome_urna` | TSE | — |
| `nome_civil` | TSE | — |
| `partido_atual` | Câmara / Senado (em exercício) | TSE |
| `cargo` | Câmara / Senado | TSE |
| `uf` | Câmara / Senado | TSE |
| `foto_url` | Câmara (deputados) / Senado (senadores) | TSE (candidatos) |
| `mandato_inicio/fim` | Câmara / Senado | — |
| `votacoes` | Câmara / Senado | — |
| `gastos_ceap` | Câmara | — |
| `presenca` | Câmara / Senado | — |
| `emendas` | Portal Transparência | — |
| `candidaturas` | TSE | — |
| `bens_declarados` | TSE | — |
| `proposta_gov` | TSE (PDF) | — |
| `municipios` | IBGE | — |
| `cep_lookup` | ViaCEP | IBGE |

---

## 6. Mapeamento endpoint → tabela (Câmara — MVP)

### Deputados

| Endpoint | Tabela destino | Campos principais |
|---|---|---|
| `GET /deputados` | `politicos` | nome, partido, uf, id_camara, foto_url |
| `GET /deputados/{id}` | `politicos` | todos os campos detalhados |
| `GET /deputados/{id}/votacoes` | `votacoes` | data, voto, proposicao, link_fonte |
| `GET /deputados/{id}/despesas` | `gastos` | ano, mes, valor, categoria, fornecedor |
| `GET /deputados/{id}/eventos` | `presenca` | calcula presença/ausência por mês |
| `GET /deputados/{id}/discursos` | `discursos` | data, resumo, tema, transcricao_url |
| `GET /partidos` | `partidos` | sigla, nome, numero |

### Proposições (fase 2)

| Endpoint | Tabela destino |
|---|---|
| `GET /proposicoes` | `votacoes` (enriquece proposicao_id) |
| `GET /proposicoes/{id}` | enriquece descrição da votação |

---

## 7. Pipeline de ingestão — arquitetura

```
FONTE OFICIAL
     ↓
RAW LANDING (imutável)
     ↓
NORMALIZATION (tipos, datas UTC, encoding)
     ↓
VALIDATION (checks, nulls esperados)
     ↓
ENTITY RESOLUTION (slug, partido_id, tema_id)
     ↓
ENRICHMENT (IA — fase 2)
     ↓
CURATED POSTGRES (schema principal)
     ↓
VIEWS (feed_usuario, resumo_politico)
     ↓
FRONTEND / API PÚBLICA
```

### Camadas de dados

**RAW** — payload original imutável. Nunca alterar. Guardar:
- Payload completo (JSON/CSV original)
- Headers da resposta
- Timestamp da coleta (UTC)
- Checksum MD5/SHA256
- URL de origem

**NORMALIZED** — tipos corretos, datas em UTC, encoding UTF-8, schema unificado

**CURATED** — dados prontos para o produto, validados e enriquecidos

---

## 8. Estratégia de atualização

| Fonte | MVP (cron diário) | Fase 2 (polling) | Horário MVP |
|---|---|---|---|
| Câmara — deputados | Semanal | Semanal | Domingo 3h |
| Câmara — votações | Diário | 5 min durante sessões | 6h |
| Câmara — gastos | Diário | 1h | 6h |
| Câmara — presença | Diário | 15 min | 6h |
| Câmara — discursos | Diário | 15 min | 6h30 |
| Portal Transparência | Diário | Diário | 7h |
| TSE — candidatos | Por lote | Por lote | Quando disponível |
| IBGE — municípios | Mensal | Mensal | 1º do mês 4h |
| ViaCEP | Sob demanda | Sob demanda | Tempo real |

**Para o MVP:** coleta diária às 6h resolve tudo. Polling granular é fase 2 quando "O que está acontecendo agora" precisar de tempo quase real.

### Workers separados — estrutura dos scripts Python

Cada tipo de dado tem seu próprio script independente. Nunca um script monolítico.

```
scripts/
├── load_ibge.py           # carga única — municípios
├── load_partidos.py       # carga única + atualização semanal
├── load_deputados.py      # atualização semanal
├── sync_votacoes.py       # incremental diário
├── sync_despesas.py       # incremental diário
├── sync_presenca.py       # incremental diário
├── sync_discursos.py      # incremental diário (fase 2)
├── process_ia.py          # processa fila ia_processado=false
└── utils/
    ├── api_client.py      # cliente HTTP com retry e circuit breaker
    ├── slug_generator.py  # gera slugs únicos
    └── entity_resolver.py # cruzamento CPF/id entre fontes
```

Cada script registra início, fim, registros e erros em `coletas_log`.

---

## 9. Política de retry e fallback

### Retry

| Tipo de erro | Ação |
|---|---|
| Timeout | Retry imediato (3x), depois exponential backoff |
| 429 Too Many Requests | Exponential backoff — aguardar TTL do header |
| 5xx Server Error | Retry com backoff — marcar como `atrasado` |
| 4xx Client Error | Não retry — logar e investigar |
| Encoding error | Tentar UTF-8, depois ISO-8859-1, logar |

### Fallback por nível

| Nível | Estratégia |
|---|---|
| 1 | Formato alternativo da mesma fonte (ex: XML se JSON falhar) |
| 2 | Snapshot interno do dia anterior |
| 3 | Cache histórico — marcar dado como `atrasado` |
| 4 | Mirror datasets (Brasil.IO para TSE) |
| 5 | Scraping emergencial — último recurso, nunca automático |

---

## 10. Política de histórico

> **Nunca atualizar destrutivamente.** Mudanças são registradas, não sobrescritas.

| Entidade | Estratégia | Tabela |
|---|---|---|
| Partido do político | SCD Type 2 | `politico_partidos` |
| Patrimônio/bens | Imutável por eleição | `candidaturas_historico` |
| Cargos exercidos | SCD Type 2 | `candidaturas_historico` |
| Votações | Imutável | `votacoes` |
| Gastos | Imutável | `gastos` |
| Presença | Imutável | `presenca` |
| Foto do político | Versionar URL + data | `foto_url` + `foto_atualizada_em` |
| Redes sociais | Soft delete + nova linha | `redes_sociais` |

---

## 11. Estados do dado — definição operacional

| Estado | Quando aplicar |
|---|---|
| `oficial` | Dado coletado com sucesso da API oficial, validado |
| `parcial` | API retornou resposta incompleta (campos null inesperados) |
| `atrasado` | Última coleta bem-sucedida há mais de 24h |
| `em_processamento` | Coletado, aguardando normalização ou processamento IA |
| `indisponivel` | Fonte offline ou sem dados para este registro |

**Para MVP:** os 5 estados do schema são suficientes.

**Para escala futura** (seção 9 do ChatGPT), os estados adicionais abaixo podem ser considerados:

| Estado futuro | Quando usar |
|---|---|
| `conflict` | Duas fontes retornam dados divergentes |
| `quarantined` | Dado suspeito aguardando revisão manual |
| `raw` | Coletado mas ainda não normalizado (pipeline raw) |

---

## 12. Campos de lineage — adicionais ao schema

> Todo dado deve saber de onde veio. Adicionar em tabelas críticas:

```sql
source_id          text,   -- 'camara_deputados' | 'tse' | 'portal_transparencia'
source_record_id   text,   -- ID do registro na fonte original
collected_at       timestamptz  -- quando foi coletado
```

**Tabelas que precisam desses campos:**
- `politicos`
- `votacoes`
- `gastos`
- `presenca`
- `candidatos`
- `candidaturas_historico`

**Motivo:** debugging, auditoria, reprocessamento seletivo e rastreabilidade de origem.

---

## 13. Estratégia de IA e GEO

### Separação obrigatória de camadas

| Camada | Conteúdo | Badge na UI |
|---|---|---|
| Oficial | Dados brutos verificáveis da API | Nenhum |
| Computado | Indicadores calculados (%, totais) | "Calculado" |
| IA | Resumos, classificações, interpretações | "IA" âmbar |

### Tabelas de IA — fase 2+

| Tabela | Finalidade |
|---|---|
| `ai_summaries` | Resumos gerados por modelo |
| `ai_claims` | Afirmações factuais extraídas |
| `ai_citations` | Fontes usadas para geração |
| `embeddings` | Vetores para busca semântica |
| `semantic_chunks` | Chunks por entidade + evento |

### Estrutura de chunk ideal

```
[POLÍTICO]
 ├── votação
 ├── discurso
 ├── gasto
 ├── presença
 └── emenda
```

### GEO readiness — cada entidade precisa de

- URL canônica (`/politico/[slug]`)
- Schema.org JSON-LD (`Person`, `Organization`)
- OpenGraph dinâmico via `opengraph-image.tsx`
- `llms.txt` com mapeamento de entidades
- Metadados estruturados e semanticamente densos

---

## 14. Observabilidade e logs

### Logs obrigatórios (MVP — já no schema via `coletas_log`)

| Tipo | Campos |
|---|---|
| Ingestão | fonte, tipo, status, registros, erros, duracao_ms |
| Falha | mensagem, metadata jsonb com detalhes |
| Schema drift | campo que mudou, valor antes/depois |
| IA | item_id, modelo, erro se houver |
| Correção | politico_id, dado_antes, dado_depois, revisado_por |

### Métricas a monitorar

| Métrica | Alerta quando |
|---|---|
| Freshness | dado > 26h sem atualização |
| Ingest latency | coleta > 30 min |
| Source uptime | 3 falhas consecutivas |
| Parse failures | > 5% dos registros |
| IA queue | > 100 itens pendentes |

### Ferramentas recomendadas — escala futura

| Área | Ferramenta |
|---|---|
| Logs | OpenTelemetry |
| Monitoramento | Grafana |
| Filas | BullMQ (Node) ou Celery (Python) |
| Jobs | Temporal (fase 2+) |
| Erros | Sentry |
| Cache | Redis (fase 2+) |

**Para MVP:** GitHub Actions (cron) + `coletas_log` no Supabase resolvem tudo.

---

## 15. Pipeline inicial — ordem de execução

### Etapa 1 — IBGE (base geográfica)
```
GET /localidades/municipios
→ popula tabela municipios
→ ~5.570 registros
→ ~5 min
```

### Etapa 2 — Partidos (entidade base)
```
GET /partidos (API Câmara)
→ popula tabela partidos
→ ~30 partidos ativos
→ ~1 min
```

### Etapa 3 — Deputados federais
```
GET /deputados (lista todos os 513)
→ para cada deputado:
   GET /deputados/{id} (detalhes)
   → slug gerado: 'nikolas-ferreira-dep-federal-mg'
   → partido_id resolvido via partidos.sigla
   → foto_url da Câmara
→ popula tabela politicos
→ ~513 registros
→ ~30 min (rate limit conservador)
```

### Etapa 4 — Votações
```
GET /deputados/{id}/votacoes
→ para cada deputado
→ ~500 votações/deputado médio
→ ~256.500 registros iniciais
→ fila IA: ia_processado = false
→ ~2–4 horas
```

### Etapa 5 — Gastos (CEAP)
```
GET /deputados/{id}/despesas
→ por ano (2023, 2024, 2025)
→ ~200–400 registros/deputado/ano
→ ~300k–600k registros
→ ~3–5 horas
```

### Etapa 6 — Presença
```
GET /deputados/{id}/eventos
→ calcular presença por mês
→ ~513 × 36 meses = ~18k registros
→ ~1–2 horas
```

### Etapa 7 — Municípios TSE (base para CEP)
```
CSV do TSE ou IBGE
→ já populado na etapa 1
→ verificar códigos IBGE corretos
```

**Tempo total estimado de carga inicial:** 6–12 horas
**Rodar uma vez, fora do horário comercial**

---

## 16. Arquitetura macro — visão completa

```
┌─────────────────────────────────────┐
│         FONTES OFICIAIS             │
│  Câmara · TSE · IBGE · Transparência│
└──────────────┬──────────────────────┘
               │
        INGEST WORKERS
        (GitHub Actions cron)
               │
┌──────────────▼──────────────────────┐
│         RAW LANDING                 │
│  payload original + checksum + ts   │
│  (imutável — nunca alterar)         │
└──────────────┬──────────────────────┘
               │
        NORMALIZATION
        (tipos, UTC, encoding)
               │
        VALIDATION
        (checks, nulls, ranges)
               │
        ENTITY RESOLUTION
        (slug, partido_id, tema_id)
               │
┌──────────────▼──────────────────────┐
│       CURATED POSTGRES              │
│       (Supabase — schema v2.3)      │
└──────┬───────────────────┬──────────┘
       │                   │
    VIEWS                ADMIN
 feed_usuario           /admin
 resumo_politico        coletas_log
 fila_ia               correções
       │
┌──────▼──────────────────────────────┐
│         FRONTEND                    │
│         Next.js — Vercel            │
│  SEO · OG Cards · Structured Data   │
└─────────────────────────────────────┘
```

---

## 17. Riscos operacionais conhecidos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| API Câmara instável | Baixa | Alto | Retry + snapshot D-1 |
| TSE muda schema CSV | Alta | Médio | Parser com tolerância a colunas extras |
| Rate limit Portal Transparência | Média | Médio | Coleta na madrugada (700 req/min) |
| Campo null inesperado | Alta | Baixo | Validação com fallback gracioso |
| Encoding CSV TSE | Alta | Baixo | Testar UTF-8 e ISO-8859-1 |
| Deputado muda de partido | Média | Médio | `politico_partidos` + trigger |
| Candidato indeferido após registro | Média | Médio | Soft delete + recoleta semanal |
| IA gera resumo impreciso | Alta | Alto | Badge "IA" + link fonte obrigatório |

---

## 18. Decisões a tomar antes dos scripts

| Decisão | Opções | Recomendação |
|---|---|---|
| Onde rodar os scripts | GitHub Actions / VPS / local | GitHub Actions (grátis, auditável) |
| Linguagem dos scripts | Python / TypeScript | Python (pandas, requests — padrão para ETL) |
| Armazenar RAW | Supabase Storage / S3 / ignorar | Supabase Storage para MVP (evitar perda) |
| Geração de slug | Automática no script / trigger | Script Python (mais controle) |
| Deduplicação | Por id_camara / hash | Por id_camara (único e estável) |
| Ordem de carga | IBGE → Partidos → Deputados → Dados | Conforme etapas desta seção |

---

## 19. Medallion Architecture — camadas de dados

Nomenclatura formal para o pipeline de transformação. Todo dev que entrar no projeto deve conhecer esses termos.

```
BRONZE → SILVER → GOLD
```

### Bronze — Raw (imutável)
Dado exatamente como veio da fonte. **Nunca alterar.**

O que guardar por registro:
- Payload JSON completo original
- `source_id` — qual fonte gerou
- `ingestion_timestamp` UTC
- Checksum SHA256 do payload
- URL completa da requisição
- HTTP status code e headers relevantes

Se a fonte corrigir um dado, **nova entrada Bronze** é criada — o registro original permanece intacto.

### Silver — Cleaned & Standardized
Transformação sem distorção da realidade:
- Tipos corretos (strings → decimais, datas UTC, booleanos)
- Encoding normalizado (UTF-8 universal)
- Nomes normalizados (sem caracteres especiais inesperados)
- Schema enforcement — registro com valor negativo ou data futura vai para `correcoes`, não para produção
- Entity resolution — `id_camara` vinculado ao `id_tse` via CPF

### Gold — Analytics-Ready
Dados prontos para o produto:
- Views e tabelas denormalizadas para queries rápidas
- Dados agregados materializados (total gasto/mês, média presença/partido)
- Feed de eventos gerado por triggers do Postgres
- Cache de estatísticas para o resumo_politico

---

## 20. Linkage strategy — cruzamento entre fontes

**O problema:** um mesmo político existe com IDs diferentes na Câmara, no Senado e no TSE. Sem cruzamento explícito, o mesmo Nikolas Ferreira pode aparecer como três entidades distintas.

**A solução:** usar CPF como âncora universal de unificação.

### Fluxo de entity resolution

```
Câmara:  id_camara=204554  nome="Nikolas Ferreira"
TSE:     id_tse="081234"   cpf="123.456.789-00"
                    ↕
         MATCH por CPF + nome_civil
                    ↕
         politicos.id = uuid interno único
         politicos.id_camara = 204554
         politicos.id_tse = "081234"
```

### Regras de matching

| Cenário | Ação |
|---|---|
| CPF + nome batem exato | Match automático — vincular IDs |
| CPF bate, nome diverge ligeiramente | Match com flag de revisão |
| CPF não disponível (candidato menor) | Match por nome_civil + data_nascimento + UF |
| Nenhum match encontrado | Criar registro separado — revisar manualmente |

### Campos de linkage no schema

```sql
-- Em politicos:
id_camara      integer unique  -- ID Câmara
id_senado      integer unique  -- ID Senado
id_tse         text            -- ID TSE
-- CPF não é armazenado publicamente — usado apenas durante o ETL
```

### Confiabilidade do CPF por fonte

| Fonte | CPF disponível | Confiabilidade |
|---|---|---|
| TSE (candidatos) | Sim — obrigatório | Alta |
| Câmara | Parcialmente | Média |
| Senado | Parcialmente | Média |
| Portal Transparência | Via Receita Federal | Alta |

---

## 21. JSON Schema validation — contratos por endpoint

Antes de salvar qualquer dado, validar o payload contra o schema esperado. Se a API mudar sem aviso, o pipeline **para** em vez de salvar lixo silenciosamente.

### Exemplo — contrato do endpoint `/deputados/{id}`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "required": ["dados"],
  "properties": {
    "dados": {
      "required": ["id", "nome", "siglaPartido", "siglaUf", "uri"],
      "properties": {
        "id":           { "type": "integer" },
        "nome":         { "type": "string" },
        "siglaPartido": { "type": "string" },
        "siglaUf":      { "type": "string", "maxLength": 2 },
        "urlFoto":      { "type": "string", "format": "uri" }
      }
    }
  }
}
```

### Comportamento quando validação falha

| Tipo de falha | Ação |
|---|---|
| Campo obrigatório ausente | Para pipeline — log `schema_drift` no coletas_log |
| Tipo errado | Para pipeline — log e alerta |
| Campo novo inesperado | Continua — log aviso (pode ser nova feature da API) |
| Valor fora do range | Marca registro como `parcial` — não para |

### Schema drift — o maior risco operacional

O governo muda APIs sem versionamento ou aviso. O DSM deve ser atualizado toda vez que um schema drift for detectado e resolvido. Registrar em `coletas_log.metadata`:

```json
{
  "schema_drift": true,
  "campo_novo": "siglaFederacao",
  "valor_exemplo": "FEDERAÇÃO BRASIL DA ESPERANÇA",
  "detectado_em": "2026-05-12T06:04:33Z"
}
```

---

## 22. Circuit Breaker — proteção contra falhas em cascata

Diferente do retry simples, o circuit breaker **suspende completamente** a coleta de uma fonte após falhas consecutivas, evitando banimento de IP e desperdício de processamento.

### Estados do circuit breaker

```
CLOSED (normal)
    ↓ N falhas consecutivas
OPEN (suspenso por T minutos)
    ↓ Após T minutos
HALF-OPEN (teste)
    ↓ Sucesso → CLOSED
    ↓ Falha → OPEN novamente
```

### Configuração recomendada por fonte

| Fonte | Falhas para abrir | Tempo suspenso | Teste |
|---|---|---|---|
| Câmara | 5 consecutivas | 60 min | 1 requisição |
| Senado | 3 consecutivas | 60 min | 1 requisição |
| Portal Transparência | 3 consecutivas | 120 min | 1 requisição |
| TSE | 2 consecutivas | 240 min | 1 requisição |
| IBGE | 5 consecutivas | 30 min | 1 requisição |

### Implementação no MVP

Para o MVP com GitHub Actions, o circuit breaker é implementado via flag no banco:

```sql
-- Em coletas_log ou feature_flags:
-- Se status = 'falhou' nas últimas N coletas para a mesma fonte,
-- o script verifica antes de executar e pula se ainda no período de suspensão.
```

---

## 23. SWR — Stale-While-Revalidate

Padrão de cache que entrega o dado existente imediatamente e atualiza em background. Garante que o usuário nunca veja tela de loading por causa de uma API governamental lenta.

### Camadas de cache

| Camada | TTL | Tecnologia |
|---|---|---|
| Supabase (banco) | Fonte primária | Sempre atualizado pelo cron |
| Next.js ISR | 60–300 seg | `revalidate` por página |
| Vercel Edge Cache | 60 seg | Automático |
| Redis (fase 2) | Configurável | Queries frequentes |

### TTL recomendado por tipo de dado

| Dado | TTL | Justificativa |
|---|---|---|
| Perfil do político | 1h | Muda raramente |
| Votações | 5 min | Muda durante sessões |
| Gastos | 1h | Atualização diária |
| Presença | 1h | Atualização diária |
| Feature flags | 30 seg | Admin precisa de resposta rápida |
| Candidatos 2026 | 6h | Atualização por lote |

### Comportamento quando fonte está offline

1. Next.js entrega página com dado do cache (ISR)
2. Banner no frontend: "Dados atualizados em [timestamp]"
3. `dado_estado = 'atrasado'` visível no badge do dado
4. Cron tenta novamente na próxima janela

---

## 24. Data Quality Gates — alertas de qualidade

Detectar falhas silenciosas onde a API responde 200 mas retorna menos dados que o esperado. Mais perigoso que uma falha explícita.

### Gates obrigatórios no MVP

| Gate | Regra | Ação quando falha |
|---|---|---|
| Volume de gastos | Hoje < 20% da média histórica | Alerta + marcar como `parcial` |
| Volume de votações | Hoje = 0 em dia de sessão | Alerta — verificar se há sessão |
| Deputados ativos | Contagem < 500 | Alerta crítico — possível problema de autenticação |
| Percentual de presença | Valor > 100% | Bloquear registro — erro de cálculo |
| Valor de gasto | Negativo ou > R$ 100k por item | Marcar como `parcial` — revisar |

### Implementação simples no MVP

Ao final de cada coleta, o script Python executa validações e registra em `coletas_log.metadata`:

```python
quality_gates = {
    "registros_esperados_min": 400,
    "registros_coletados": len(registros),
    "gate_passou": len(registros) >= 400,
    "alertas": []
}
```

---

## 25. Legislatura como unidade histórica

Votações e atividade parlamentar são organizadas por **legislatura**, não apenas por ano. Isso é a unidade natural da política brasileira.

| Legislatura | Período | Câmara | Senado |
|---|---|---|---|
| 55ª | 2015–2019 | Disponível | Disponível |
| 56ª | 2019–2023 | Disponível | Disponível |
| **57ª** | **2023–2027** | **Atual — MVP** | **Atual** |

### Impacto no schema

Campo `legislatura` em `votacoes`:

```sql
legislatura    integer,  -- ex: 57
```

Permite queries como:
- "Todas as votações do deputado X na 57ª legislatura"
- "Comparar presença na 56ª vs 57ª"
- "Projetos apresentados por legislatura"

### Impacto no pipeline

O `initial_load.py` coleta a 57ª legislatura completa primeiro. Histórico das 55ª e 56ª pode ser carregado em background como enriquecimento.

---

## 26. API da Câmara — mapeamento completo e real

> Baseado na documentação oficial v0.4.339 (fev/2026)
> Base URL: `https://dadosabertos.camara.leg.br/api/v2/`

### Comportamentos globais da API

| Comportamento | Valor |
|---|---|
| Itens por página (padrão) | 15 |
| Itens por página (máximo) | 100 |
| Paginação | `?pagina=N&itens=100` |
| Sem autenticação | Sim — acesso livre |
| Formatos | JSON (`Accept: application/json`) ou XML |
| Links de paginação | Retornados no campo `links[]` com `rel: "next"`, `"prev"`, `"last"` |
| Parâmetros de data | Formato `AAAA-MM-DD` |
| Restrição de datas em votações | `dataInicio` e `dataFim` devem ser do **mesmo ano** |

**Comportamento padrão sem parâmetros de tempo:**
- `/deputados` — retorna apenas deputados em exercício agora
- `/deputados/{id}/despesas` — retorna últimos 6 meses
- `/deputados/{id}/discursos` — retorna últimos 7 dias
- `/deputados/{id}/eventos` — retorna 5 dias (2 antes + 2 depois + hoje)
- `/votacoes` — retorna últimos 30 dias

---

### Endpoint 1 — `GET /deputados`
**Uso:** listar todos os 513 deputados em exercício

**Parâmetros úteis:**
```
?idLegislatura=57&itens=100&pagina=1&ordem=ASC&ordenarPor=nome
```

**Resposta — campos relevantes:**
```json
{
  "dados": [{
    "id": 204554,              → politicos.id_camara
    "nome": "Nikolas Ferreira", → politicos.nome
    "siglaPartido": "PL",      → partidos.sigla (para resolver partido_id)
    "siglaUf": "MG",           → politicos.uf
    "idLegislatura": 57,       → politicos.numero_mandato (calculado)
    "urlFoto": "https://...",  → politicos.foto_url
    "email": "...",            → politicos.email
    "uri": "https://..."       → link_fonte
  }]
}
```

**Nota:** este endpoint retorna dados básicos. Para CPF e dados completos, usar `/deputados/{id}`.

**Script:** paginar com `itens=100` até `links` não ter `rel: "next"`. São ~6 páginas para os 513.

---

### Endpoint 2 — `GET /deputados/{id}`
**Uso:** detalhes completos de um deputado — inclui CPF para entity resolution

**Resposta — campos relevantes:**
```json
{
  "dados": {
    "cpf": "123.456.789-00",      → usado APENAS no ETL para cruzamento TSE
    "nomeCivil": "Nikolas...",    → politicos.nome_civil
    "dataNascimento": "1996-...", → politicos.data_nascimento
    "municipioNascimento": "BH",  → politicos.naturalidade
    "escolaridade": "Superior",   → politicos.escolaridade
    "sexo": "M",
    "redeSocial": ["url1", "url2"], → redes_sociais (processar separado)
    "urlWebsite": "https://...",  → redes_sociais (plataforma: site_oficial)
    "ultimoStatus": {
      "siglaPartido": "PL",       → partidos.sigla
      "siglaUf": "MG",
      "situacao": "Exercício",    → politicos.situacao
      "nomeEleitoral": "NIKOLAS", → (nome na urna — não existe em politicos, considerar adicionar)
      "urlFoto": "https://...",   → politicos.foto_url
      "data": "2023-02-01",       → politicos.mandato_inicio
      "condicaoEleitoral": "Titular"
    }
  }
}
```

**Descoberta importante:** `redeSocial` é um array de URLs — precisará de lógica para detectar plataforma por domínio (instagram.com → instagram, twitter.com → twitter_x, etc.)

**`nomeEleitoral`** — equivale ao `nome_urna`. Verificar se deve ser adicionado ao schema de `politicos`.

---

### Endpoint 3 — `GET /deputados/{id}/historico`
**Uso:** histórico de mudanças de partido, situação e nome parlamentar

**Resposta — campos relevantes:**
```json
{
  "dados": [{
    "dataHora": "2024-01-15T...", → politico_partidos.inicio
    "siglaPartido": "Republicanos", → partidos.sigla
    "situacao": "Exercício",
    "nome": "Nome parlamentar",
    "idLegislatura": 57
  }]
}
```

**Este é o endpoint correto para popular `politico_partidos`** — retorna todas as mudanças de partido com timestamp.

---

### Endpoint 4 — `GET /deputados/{id}/mandatosExternos`
**Uso:** outros cargos eletivos (prefeito, vereador, governador) — dados do TSE

**Resposta:**
```json
{
  "dados": [{
    "cargo": "Prefeito",           → candidaturas_historico.cargo
    "municipio": "Belo Horizonte", → candidaturas_historico.municipio_id (resolver)
    "siglaUf": "MG",
    "siglaPartidoEleicao": "PL",   → candidaturas_historico.partido_id
    "anoInicio": "2021",           → candidaturas_historico.eleicao_ano
    "anoFim": "2023"
  }]
}
```

**Este endpoint já entrega o histórico eleitoral externo diretamente da Câmara** — elimina parte do cruzamento com TSE para deputados em exercício.

---

### Endpoint 5 — `GET /deputados/{id}/despesas`
**Uso:** gastos com cota parlamentar (CEAP)

**Parâmetros úteis:**
```
?ano=2025&itens=100&pagina=1&ordenarPor=dataDocumento&ordem=DESC
```

**Comportamento padrão:** últimos 6 meses se nenhum parâmetro de tempo for passado.
**Para carga completa:** iterar por `?ano=2023&ano=2024&ano=2025`

**Resposta — campos relevantes:**
```json
{
  "dados": [{
    "ano": 2025,                → gastos.ano
    "mes": 5,                   → gastos.mes (CHECK 1-12 já no schema)
    "tipoDespesa": "PASSAGENS AÉREAS", → gastos.categoria
    "nomeFornecedor": "TAM",    → gastos.fornecedor
    "cnpjCpfFornecedor": "...", → gastos.cnpj_cpf
    "valorDocumento": 1840.50,  → gastos.valor
    "valorGlosa": 0,            → gastos.valor_glosa
    "valorLiquido": 1840.50,    → campo calculado (não salvar separado)
    "dataDocumento": "2025-05-10", → para auditoria
    "numDocumento": "NF123",    → gastos.source_record_id
    "urlDocumento": "https://...", → gastos.link_fonte
    "codDocumento": "ABC123"    → deduplicação
  }]
}
```

**Deduplicação:** usar `codDocumento` como chave única para evitar duplicatas em reprocessamentos.

---

### Endpoint 6 — `GET /deputados/{id}/eventos`
**Uso:** calcular presença em sessões plenárias

**IMPORTANTE:** este endpoint retorna **todos os eventos** (sessões, audiências, comissões). Presença em plenário deve ser filtrada por tipo de órgão (plenário = `siglaOrgao: "PLEN"`).

**Parâmetros úteis:**
```
?dataInicio=2025-01-01&dataFim=2025-12-31&itens=100&pagina=1
```

**Resposta — campos relevantes:**
```json
{
  "dados": [{
    "id": 12345,
    "dataHoraInicio": "2025-05-12T14:00",
    "dataHoraFim": "2025-05-12T18:30",
    "descricaoTipo": "Sessão Deliberativa Ordinária",
    "situacao": "Encerrado",     → filtramos apenas "Encerrado"
    "orgaos": [{
      "sigla": "PLEN",           → filtramos apenas PLEN para presença
      "nome": "Plenário"
    }]
  }]
}
```

**Lógica de cálculo de presença:**
1. Buscar todos os eventos `situacao = "Encerrado"` com `orgaos[].sigla = "PLEN"` → `total_sessoes`
2. Verificar presença do deputado via `/eventos/{id}/deputados` → `presencas`
3. Calcular `ausencias = total_sessoes - presencas`

**Alternativa mais eficiente:** usar `/votacoes` filtrado por período — cada votação nominal já indica quem votou (presença implícita).

---

### Endpoint 7 — `GET /votacoes`
**Uso:** listar todas as votações nominais da Câmara por período

**Parâmetros úteis:**
```
?dataInicio=2025-01-01&dataFim=2025-12-31&itens=100&pagina=1
```

**RESTRIÇÃO CRÍTICA:** `dataInicio` e `dataFim` devem ser do mesmo ano. Para múltiplos anos, fazer uma requisição por ano.

**Resposta:**
```json
{
  "dados": [{
    "id": "2025052400001-PLEN",  → votacoes.proposicao_id (source_record_id)
    "data": "2025-05-24",       → votacoes.data
    "dataHoraRegistro": "...",  → votacoes.hora (extrair)
    "descricao": "Aprovação do PL...", → votacoes.descricao
    "proposicaoObjeto": "PL 1847/2024", → votacoes.proposicao
    "siglaOrgao": "PLEN",       → apenas PLEN para votações nominais
    "aprovacao": 1              → 1=aprovado, 0=rejeitado (metadado útil)
  }]
}
```

**Para obter votos individuais de cada deputado:** necessário chamar `/votacoes/{id}/votos` para cada votação.

---

### Endpoint 8 — `GET /votacoes/{id}/votos`
**Uso:** votos individuais de cada deputado em uma votação nominal

**Resposta — campos relevantes:**
```json
{
  "dados": [{
    "tipoVoto": "Sim",          → votacoes.voto (mapear para enum)
    "dataRegistroVoto": "...",
    "deputado_": {
      "id": 204554,             → politicos.id_camara (resolver politico_id)
      "nome": "Nikolas Ferreira",
      "siglaPartido": "PL",
      "siglaUf": "MG"
    }
  }]
}
```

**Mapeamento de `tipoVoto` para o enum `voto_tipo`:**
```
"Sim"        → 'sim'
"Não"        → 'nao'
"Abstenção"  → 'abstencao'
"Obstrução"  → 'obstrucao'
"Artigo 17"  → 'artigo_17'
```

**IMPORTANTE:** deputados **ausentes não aparecem** nesta lista. Para calcular ausências, é necessário cruzar com a lista total de deputados ativos.

**VOTAÇÕES SIMBÓLICAS:** se a chamada a `/votacoes/{id}/votos` retornar lista vazia, a votação foi simbólica — não salvar votos individuais, apenas registrar a votação com `voto = null` e flag de simbólica.

---

### Endpoint 9 — `GET /votacoes/{id}/orientacoes`
**Uso:** orientação de voto dos partidos — útil para análise de bancada (fase 2)

**Resposta:**
```json
{
  "dados": [{
    "siglaPartidoBloco": "PL",
    "orientacaoVoto": "Sim",    → orientação da bancada
    "codTipoLideranca": "1"     → tipo de liderança
  }]
}
```

---

### Endpoint 10 — `GET /deputados/{id}/discursos`
**Uso:** discursos em plenário e comissões (fase 2)

**Parâmetros úteis:**
```
?idLegislatura=57&itens=100&pagina=1&ordem=DESC
```

**Resposta — campos relevantes:**
```json
{
  "dados": [{
    "dataHoraInicio": "2025-05-12T14:30",  → discursos.data + hora
    "dataHoraFim": "...",
    "sumario": "Discurso sobre saúde...",  → discursos.resumo (ou entrada para IA)
    "keywords": "saúde, SUS, UTI",         → apoio para classificação de tema
    "tipoDiscurso": "Discurso",            → discursos.tipo
    "transcricao": "Texto completo...",    → discursos.transcricao_url (ou texto)
    "urlTexto": "https://...",             → discursos.link_fonte
    "urlAudio": "https://...",
    "urlVideo": "https://...",
    "faseEvento": {
      "titulo": "Ordem do Dia"             → discursos.fase_sessao
    }
  }]
}
```

---

### Endpoint 11 — `GET /partidos`
**Uso:** popular tabela `partidos`

**Parâmetros úteis:**
```
?idLegislatura=57&itens=100
```

**Resposta:**
```json
{
  "dados": [{
    "id": 36769,               → referência interna Câmara (não usar como PK)
    "sigla": "PL",             → partidos.sigla (chave de negócio)
    "nome": "Partido Liberal", → partidos.nome
    "uri": "https://..."
  }]
}
```

**Para número eleitoral e logo:** chamar `/partidos/{id}`:
```json
{
  "dados": {
    "numeroEleitoral": 22,     → partidos.numero
    "urlLogo": "https://...",  → partidos.logo_url
    "urlWebSite": "https://..."
  }
}
```

---

### Endpoint 12 — `GET /deputados/{id}/orgaos`
**Uso:** comissões em que o deputado participa (atuação parlamentar — fase 2)

**Resposta:**
```json
{
  "dados": [{
    "idOrgao": 2150,
    "siglaOrgao": "CCJC",
    "nomeOrgao": "Comissão de Constituição...",
    "titulo": "Titular",        → cargo na comissão
    "dataInicio": "2023-03-01",
    "dataFim": null             → null = atual
  }]
}
```

---

### Endpoint 13 — `GET /proposicoes`
**Uso:** projetos de lei apresentados por um deputado (fase 2 — atuação)

**Parâmetros úteis:**
```
?idDeputadoAutor=204554&dataApresentacaoInicio=2023-01-01&itens=100
```

**Resposta:**
```json
{
  "dados": [{
    "id": 123456,
    "siglaTipo": "PL",          → tipo do projeto
    "numero": 1234,
    "ano": 2025,
    "ementa": "Institui...",    → texto para IA
    "dataApresentacao": "2025-04-10"
  }]
}
```

---

### Mapeamento campo a campo — Câmara → Schema

| Campo API Câmara | Tabela.campo | Notas |
|---|---|---|
| `deputados[].id` | `politicos.id_camara` | Chave de cruzamento |
| `deputados[].nome` | `politicos.nome` | Nome parlamentar |
| `deputados/{id}.nomeCivil` | `politicos.nome_civil` | Para entity resolution com TSE |
| `deputados/{id}.cpf` | ETL only | Não salvar no banco público |
| `deputados/{id}.ultimoStatus.nomeEleitoral` | `politicos.nome` ou campo novo | Ver nota abaixo |
| `deputados[].siglaPartido` | `partidos.sigla` → `politicos.partido_id` | Via lookup |
| `deputados[].siglaUf` | `politicos.uf` | |
| `deputados[].urlFoto` | `politicos.foto_url` | URL direta da Câmara |
| `deputados/{id}.ultimoStatus.situacao` | `politicos.situacao` | Mapear para enum |
| `deputados/{id}.ultimoStatus.data` | `politicos.mandato_inicio` | |
| `deputados/{id}.redeSocial[]` | `redes_sociais` | Detectar plataforma por domínio |
| `despesas[].tipoDespesa` | `gastos.categoria` | |
| `despesas[].valorDocumento` | `gastos.valor` | |
| `despesas[].valorGlosa` | `gastos.valor_glosa` | |
| `despesas[].nomeFornecedor` | `gastos.fornecedor` | |
| `despesas[].cnpjCpfFornecedor` | `gastos.cnpj_cpf` | |
| `despesas[].urlDocumento` | `gastos.link_fonte` | |
| `despesas[].codDocumento` | `gastos.source_record_id` | Deduplicação |
| `votacoes[].id` | `votacoes.source_record_id` | ID alfanumérico da votação |
| `votacoes[].data` | `votacoes.data` | |
| `votacoes[].descricao` | `votacoes.descricao` | Entrada para IA |
| `votacoes[].proposicaoObjeto` | `votacoes.proposicao` | ex: "PL 1847/2024" |
| `votos[].tipoVoto` | `votacoes.voto` | Mapear para enum |
| `votos[].deputado_.id` | Resolver via `id_camara` | |
| `historico[].siglaPartido` | `politico_partidos.partido_id` | Via lookup |
| `historico[].dataHora` | `politico_partidos.inicio` | |
| `discursos[].dataHoraInicio` | `discursos.data` + `hora` | |
| `discursos[].sumario` | `discursos.resumo` | Ou entrada para IA |
| `discursos[].tipoDiscurso` | `discursos.tipo` | |
| `discursos[].urlTexto` | `discursos.link_fonte` | |
| `partidos[].sigla` | `partidos.sigla` | |
| `partidos/{id}.numeroEleitoral` | `partidos.numero` | |
| `partidos/{id}.urlLogo` | `partidos.logo_url` | |

---

### Descobertas importantes da documentação

**1. `nomeEleitoral` vs `nome`**
O campo `ultimoStatus.nomeEleitoral` (ex: "NIKOLAS") é o nome que aparece na urna — diferente do nome parlamentar completo. Considerar adicionar `nome_eleitoral` na tabela `politicos` ou usar como `nome_urna`.

**2. Votações simbólicas**
`/votacoes/{id}/votos` retorna lista vazia para votações simbólicas. A documentação confirma: "O resultado é uma lista vazia se {id} foi uma votação simbólica". Tratar explicitamente no script.

**3. Histórico de partidos já disponível**
`/deputados/{id}/historico` entrega todas as mudanças de partido com timestamp — popula diretamente `politico_partidos` sem necessidade de cruzamento externo.

**4. Mandatos externos via Câmara**
`/deputados/{id}/mandatosExternos` já entrega histórico de outros cargos eletivos diretamente, via dados do TSE que a Câmara já integrou.

**5. CPF disponível**
`/deputados/{id}` retorna `cpf` — essencial para entity resolution com TSE. Usar apenas no ETL, nunca persistir no banco público.

**6. Restrição de datas em votações**
`/votacoes?dataInicio=...&dataFim=...` exige que ambas as datas sejam do mesmo ano. Para coletar múltiplos anos, fazer uma requisição por ano.

**7. Blocos e federações**
`/blocos` tem campo `federacao: true` para federações partidárias (como a Federação Brasil da Esperança). Considerar no futuro para análises de bancada.

---

## 10. Fontes avançadas — cruzamento via CPF (Fase 2/3/4)

> *Todas baseadas em dados públicos por lei (LAI + LGPD Art. 7º II e III + Decreto 8.777/2016). CPF é âncora universal — nunca exibido publicamente, usado apenas no ETL.*

---

### Fonte A — Receita Federal: QSA / CNPJ bulk

| Campo | Valor |
|---|---|
| source_id | `receita_qsa` |
| URL | `gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/consultas/dados-publicos-cnpj` |
| Formato | CSV compactado (ZIP) · layout de colunas fixo · encoding LATIN1 |
| Volume | +20 GB compactado · +100 GB descompactado |
| Frequência | Mensal |
| Autenticação | Nenhuma |
| Fase | Fase 2 |

**Schema da tabela de sócios (QSA):**

| Campo | Tipo | Descrição |
|---|---|---|
| `cnpj_basico` | char(8) | Raiz do CNPJ da empresa |
| `identificador_socio` | int | 1=PJ · 2=PF · 3=Estrangeiro |
| `nome_socio_razao_social` | text | Nome completo |
| `cpf_cnpj_socio` | char(14) | **CPF mascarado:** `***.456.789-**` |
| `qualificacao_socio` | int | 10=Sócio · 05=Administrador |
| `data_entrada_sociedade` | date | Data de entrada na sociedade |
| `representante_legal` | text | CPF do representante |

**CPF mascarado — strategy de entity resolution:**
```
CPF completo (TSE): 123.456.789-00
CPF mascarado (RFB): ***.456.789-**
                          ↑↑↑↑↑↑
                     6 dígitos centrais visíveis

1. Filtro determinístico: match nos 6 dígitos centrais
2. Validação por nome: Levenshtein/Jaro-Winkler ≥ 0.85
3. Contexto geográfico: UF da empresa vs base eleitoral do político
4. Score de confiança: alto/médio/baixo → badge na UI
```

**Ingestão em PostgreSQL:**
```sql
-- Staging table (UNLOGGED = sem WAL = muito mais rápido)
CREATE UNLOGGED TABLE staging_qsa (
    cnpj_basico      CHAR(8),
    identificador_socio INT,
    nome_socio       TEXT,
    cpf_cnpj_socio   TEXT,
    qualificacao_socio INT,
    data_entrada     DATE
);
-- COPY via Python: psycopg2 + COPY FROM stdin
-- Depois: INSERT INTO vinculos_empresariais SELECT ... FROM staging_qsa JOIN politicos
```

**⚠️ Mudança em jul/2026:** CNPJ passa a ter formato alfanumérico. Atualizar validações.

**e-BEF (IN RFB nº 2.290/2025 — vigente jan/2026):**
Declaração mensal obrigatória do **beneficiário final** — pessoa física que controla a empresa em última instância, mesmo através de holdings em cascata. Acaba com o "laranja" estrutural. Os dados públicos do e-BEF estarão disponíveis via mesmo repositório bulk da RFB.

---

### Fonte B — DataJud (CNJ)

| Campo | Valor |
|---|---|
| source_id | `datajud` |
| URL base | `api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search` |
| Autenticação | API Key pública (sem cadastro individual) |
| API Key pública | `cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==` |
| Arquitetura | Elasticsearch |
| Fase | Fase 2 |

**Schema de resposta:**

| Campo | Descrição |
|---|---|
| `numeroProcesso` | Número único CNJ |
| `classe.codigo` | Classe processual (ex: Ação Penal) |
| `assunto` | Códigos TPU (ex: Corrupção Passiva) |
| `tribunal` | Tribunal de origem |
| `dataAjuizamento` | Data de início |
| `grau` | Instância (G1, G2, Superior) |

**Busca por CPF — Python:**
```python
def buscar_datajud(cpf, tribunal="tse"):
    url = f"https://api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search"
    headers = {"Authorization": "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="}
    query = {
        "size": 20,
        "query": {"match": {"partes.documento": cpf}}
    }
    return requests.post(url, json=query, headers=headers).json()

# Tribunais prioritários: tse, tre-sp, tre-mg, tre-rj, tjsp, tjmg, trf1, trf3
```

**LGPD:** processos em segredo de justiça não retornam pela API pública. Metadados (quem, o quê, valor, tribunal) são sempre públicos.

---

### Fonte C — PNCP (Portal Nacional de Contratações Públicas)

| Campo | Valor |
|---|---|
| source_id | `pncp` |
| URL base | `pncp.gov.br/api/consulta` |
| Endpoint contratos | `/v1/contratos?cnpjFornecedor={cnpj}&dataInicial={data}` |
| Autenticação | Nenhuma |
| Cobertura | Federal + Estadual + Municipal |
| Histórico | A partir de 2021/2022 |
| Fase | Fase 2 |

**Schema de resposta:**

| Campo | Descrição |
|---|---|
| `valorTotalEstimado` | Valor do contrato |
| `orgaoEntidade.razaoSocial` | Nome do órgão contratante |
| `objetoContrato` | Descrição do objeto |
| `dataAssinatura` | Data de assinatura |
| `unidadeOrgao.municipio` | Localização do contratante |

**Fluxo ROI político:**
```
1. Extrair doadores de campanha (TSE) do político X
2. Para cada doador PJ → buscar no PNCP por CNPJ
3. Para cada doador PF → buscar no QSA (Receita) → empresas dele → PNCP
4. Calcular: soma de contratos durante mandato / total doado na campanha
5. Exibir na UI: "Empresas ligadas a doadores receberam R$ X em contratos"
```

---

### Fonte D — IBAMA: embargos e autos de infração

| Campo | Valor |
|---|---|
| source_id | `ibama_embargos` |
| URL | `servicos.ibama.gov.br/ctf/publico/areasembargadas/` |
| Formato | CSV · SHP (GIS) · XML |
| Frequência | Diária |
| Autenticação | Nenhuma |
| Fase | Fase 3 |

**Cruzamento:** CPF pessoal do político + CNPJs das empresas (Fonte A) → detectar propriedades com embargos ativos por desmatamento. Conectar com votações do político em projetos ambientais.

---

### Fonte E — CAR (Cadastro Ambiental Rural / SICAR)

| Campo | Valor |
|---|---|
| source_id | `sicar` |
| API (G2G) | `apigateway.conectagov.estaleiro.serpro.gov.br/api-sicar-cpfcnpj/v1/{cpfCnpj}` |
| Download bulk | Por estado via SICAR |
| Fase | Fase 3 |

**Campos:** área total, bioma, município, situação (ativo/pendente/cancelado), coordenadas geográficas.

**Feature:** sobrepor coordenadas com polígonos de biomas sensíveis → **"Alerta de Conflito Ambiental"** quando parlamentar com terras em área sensível for relator de PL ambiental.

---

### Fonte F — RAIS / CAGED (vínculos empregatícios)

| Campo | Valor |
|---|---|
| source_id | `rais_caged` |
| LGPD | Dados identificados com CPF **não são públicos** — exigem ACT (Acordo de Cooperação Técnica) |
| Alternativa | Transparência ativa da Câmara/Senado já publica assessores com nome e cargo |
| Fase | Fase 3 |

**Estratégia para a plataforma:**
1. Assessores → via API da Câmara (já integrada) + scraping do portal de transparência
2. Cruzar nome dos assessores com QSA da Receita → detectar se assessor é sócio de empresa que recebe emendas do político
3. Detectar nepotismo cruzado: assessor do político A = familiar do político B

---

### Fonte G — CVM (Comissão de Valores Mobiliários)

| Campo | Valor |
|---|---|
| source_id | `cvm` |
| Plataforma | CKAN |
| URL | `dados.cvm.gov.br/dataset/cia_aberta-doc-fre` |
| Formato | CSV semanal |
| Autenticação | Nenhuma |
| Fase | Fase 3 |

**Arquivos relevantes:**
- `fre_cia_aberta_administrador_membro_conselho_fiscal` — CPF (parcial) de diretores e conselheiros
- `fre_cia_aberta_posicao_acionaria` — acionistas com participação >5%

**Feature:** detectar se político é conselheiro ou acionista relevante em empresa listada que atua em setor que ele regula/legisla → **"Conflito de interesse em empresa de capital aberto"**

---

### Fonte H — SeCI (CGU — Sistema de Prevenção de Conflito de Interesses)

| Campo | Valor |
|---|---|
| source_id | `seci_cgu` |
| URL | `dadosabertos-download.cgu.gov.br/SeCI/SeCI.csv` |
| Formato | CSV |
| Autenticação | Nenhuma |
| Fase | Fase 3 |

**Dados:** pedidos de autorização para exercer atividade privada, órgão do solicitante, resposta (autorizado/negado por risco de conflito).

---

### Fonte I — ICIJ Offshore Leaks Database

| Campo | Valor |
|---|---|
| source_id | `icij_offshore` |
| URL API | `offshoreleaks.icij.org/api/v1/reconcile` |
| Busca | Por nome + país (sem CPF) |
| Bases | Panama Papers · Paradise Papers · Pandora Papers · Offshore Leaks |
| Autenticação | Nenhuma |
| Fase | Fase 4 |

**Tratamento de falsos positivos:** filtrar por nationalidade=BR + data de nascimento aproximada. Para nomes comuns, exibir score de confiança.

**⚠️ Disclaimer obrigatório na UI:** "Estes dados provêm de vazamentos jornalísticos. A posse de offshore não é ilegal se declarada."

---

### Infraestrutura mínima para cruzamento em escala

Para processar 600 políticos mensalmente contra bases de terabytes:

| Componente | Mínimo | Recomendado |
|---|---|---|
| RAM | 32 GB | 64 GB |
| Storage | 500 GB SSD NVMe | 1 TB |
| PostgreSQL | Supabase Pro | Instância dedicada |
| Grafo | Apache AGE (extensão PostgreSQL) | Neo4j separado |

**Apache AGE vs Neo4j:**
> **Recomendação: Apache AGE** — estende o PostgreSQL com Cypher queries sem duplicar dados. Reduz complexidade operacional e permite JOINs nativos entre o grafo e as tabelas SQL existentes. Neo4j só vale se o projeto crescer para análises de centralidade (PageRank) em grafos muito grandes.

---

### Priorização de implementação

| Prioridade | Fontes | Impacto | Complexidade |
|---|---|---|---|
| **1ª** | QSA Receita + PNCP | Fluxo de dinheiro público → empresas de políticos | Média |
| **2ª** | DataJud + SeCI | Ficha limpa + ética do agente | Baixa |
| **3ª** | CAR + IBAMA | Conflito ambiental — bancada ruralista | Alta |
| **4ª** | CVM + ICIJ | Ativos financeiros + offshores | Alta |

---
