# Meus Políticos

> **"Transparência para decidir melhor."**
> O Google da política brasileira.

[![Status](https://img.shields.io/badge/status-pré--lançamento-orange)](https://meuspoliticos.com)
[![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20Supabase-blue)](https://meuspoliticos.com)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](LICENSE)

Plataforma brasileira de transparência política e inteligência cívica.

Centralizamos dados públicos sobre políticos brasileiros — do presidente ao vereador — em um só lugar, com linguagem acessível, sem editoriais, sem opinião. Mostramos dados. O usuário conclui sozinho.

---

## Governança documental

Para crescimento organizado e sem duplicação de regras, use estes documentos como fonte oficial:

- Contrato de dados de perfil (back office -> frontend): [docs/BACKOFFICE_DATA_CONTRACT.md](docs/BACKOFFICE_DATA_CONTRACT.md)
- Metodologia de scores e regras de exibição: [docs/METRICS.md](docs/METRICS.md)
- Fontes, ingestão e arquitetura de dados: [docs/data_source_master.md](docs/data_source_master.md)
- Navegação geral do projeto (master doc): [docs/meuspoliticos_master.md](docs/meuspoliticos_master.md)

Regra de organização:
- README e master doc descrevem visão e navegação.
- Regras operacionais detalhadas ficam somente nos documentos especializados acima.

---

## O que é

O cidadão pesquisa qualquer político e vê, em segundos:

- O que votou
- Como gastou dinheiro público
- Com que frequência compareceu
- Quem financiou sua campanha

Tudo com rastreabilidade completa: cada dado tem link para a fonte oficial.

**O projeto não recomenda candidatos, não ranqueia ideologicamente e não editorializa. Neutralidade é o produto.**

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js + TypeScript |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Backend / API | Supabase Edge Functions |
| Coleta de dados | Python + GitHub Actions |
| Deploy | Vercel |
| IA (fase 2) | OpenAI API |

**Custo de infraestrutura no MVP: R$ 0/mês**

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- Python 3.8+
- PostgreSQL client — `psql` (opcional, para acesso direto ao banco)
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-org/meuspoliticos.git
cd meuspoliticos
```

### 2. Instale as dependências do frontend

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
IA_RESUMO_MAX_GERACOES_DIA=3
```

Notas:
- `OPENAI_API_KEY`: necessária para gerar resumo interpretativo sob demanda.
- `IA_RESUMO_MAX_GERACOES_DIA`: limite diário por político para controlar custo (cache hit não consome).

### 4. Crie o banco de dados

No painel do Supabase, abra o SQL Editor e rode:

```bash
001_schema.sql
```

### 5. Rode o frontend

```bash
npm run dev
```

Acesse em `http://localhost:3000`.

---

## Estrutura do projeto

```
meuspoliticos/
├── app/                        # Next.js App Router
│   ├── (public)/
│   │   ├── page.tsx            # Home — busca + CEP
│   │   ├── politico/[slug]/    # Perfil do político
│   │   ├── busca/              # Resultados de busca
│   │   └── meu-estado/        # Quem me representa
│   ├── (auth)/
│   │   ├── meus-politicos/     # Painel do usuário
│   │   └── feed/               # Feed de atividades
│   └── admin/                  # Painel interno
├── components/                 # Componentes reutilizáveis
├── lib/                        # Utilitários e integrações
├── etl/                        # Scripts Python de coleta
│   ├── camara/                 # Deputados, votações, gastos
│   ├── senado/                 # (fase 2)
│   └── tse/                    # (fase 2+)
├── supabase/
│   └── 001_schema.sql          # Schema principal
└── public/
    └── llms.txt                # AI SEO
```

---

## Coleta de dados

Os scripts Python rodam via **GitHub Actions** em cron jobs e alimentam o banco via Supabase.

> **Atenção:** o ETL usa conexão direta ao PostgreSQL via `psycopg2` — variáveis de ambiente **diferentes** das do frontend Next.js.

### Configuração do ETL (`.env` na raiz de `etl/`)

```env
# Banco de dados
SUPABASE_DB_HOST=your-supabase-host
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password

# Controle de execução
ETAPAS_TO_RUN=1,2,3,7,10,11   # quais ETAPAs rodar (padrão: todas)
DRY_RUN=false                   # true = busca dados mas não insere (útil para testar)
MAX_RECORDS=0                   # 0 = ilimitado; use ex: 100 para dev/debug
```

### Câmara dos Deputados (MVP)

```bash
cd etl/camara
pip install -r requirements.txt
python collect_deputados.py
```

### Senado Federal (Fase 2 ✅)

```bash
cd etl/senado
pip install -r requirements.txt
python load_senado.py
```

Dependências do ETL (`requirements.txt`):
```
psycopg2-binary==2.9.9
requests==2.31.0
python-dateutil==2.8.2
```

Output esperado:

```
============================================================
LOAD_SENADO.PY — Ingestão Senado Federal (Phase 2)
============================================================

ETAPA 1: Senadores
  ✓ 81 senadores carregados
  ✓ 81 senadores inseridos

ETAPA 7: Raw Bronze Layer
  ✓ Raw record ID 1 inserido

ETAPA 10: Entity Resolution Validation
  ✓ 45 linkagens confirmadas (confidence >= 0.90)

ETAPA 11: Cross-linking
  ✓ 12 políticos identificados em ambas as casas

============================================================
✓ Ingestão concluída com sucesso
============================================================
```

Tempo de carga inicial: ~3s · Carga completa de produção (50M+ registros): ~2–4h

### Fontes de dados

| Fonte | Dados | Fase |
|---|---|---|
| [API Câmara](https://dadosabertos.camara.leg.br/api/v2) | 513 deputados, votações, gastos, presença | MVP |
| [ViaCEP](https://viacep.com.br) | CEP → estado → representantes | MVP |
| [IBGE](https://servicodados.ibge.gov.br/api/v1/localidades) | Municípios e geografias | MVP |
| [API Senado](https://legis.senado.leg.br/dadosabertos) | 81 senadores | Fase 2 |
| [Portal da Transparência](https://portaldatransparencia.gov.br/api-de-dados) | Dados federais | Fase 2 |
| [TSE](https://dadosabertos.tse.jus.br) | Candidaturas, eleitos, doações | Fase 2+ |

### Rastreabilidade — regra de ouro

Todo dado inserido no banco precisa ter:

```sql
source_id         -- identificador da fonte
source_record_id  -- ID do registro na fonte original
collected_at      -- timestamp da coleta
```

---

## Schema do banco

Arquivo: [`supabase/001_schema.sql`](supabase/001_schema.sql) — versão 2.8

Tabelas principais:

| Tabela | Descrição |
|---|---|
| `politicos` | Perfis — cargo, partido, estado, foto |
| `partidos` | Partidos políticos com histórico |
| `politico_partidos` | Histórico de migrações partidárias |
| `votacoes` | Votações nominais com voto individual |
| `gastos` | Cota parlamentar mensal |
| `presenca` | Presença em plenário por sessão |
| `senadores` | 81 senadores federais (Fase 2 ✅) |
| `politico_senado_ids` | Entity resolution CPF — Câmara ↔ Senado (Fase 2 ✅) |
| `senado_votacoes` | Votações do Senado (Fase 2 — carga pendente) |
| `senado_materias` | Matérias legislativas (Fase 2 — carga pendente) |
| `senado_comissoes` | Participação em comissões (Fase 2 — carga pendente) |
| `senado_discursos` | Discursos em plenário (Fase 2 — carga pendente) |
| `senado_sessoes` | Sessões do Senado (Fase 2 — carga pendente) |
| `raw_senado` | Bronze layer — XML bruto com SHA-256 (Fase 2 ✅) |
| `candidatos` | Candidatos 2026 com proposta e bens |
| `municipios` | Base geográfica (IBGE) |
| `usuarios` | Usuários logados |
| `feed_eventos` | Eventos para o feed personalizado |
| `coletas_log` | Log de execução dos pipelines |

---

## Roadmap

### MVP — agora
- [ ] Repositório GitHub (monorepo)
- [ ] Schema no Supabase (`001_schema.sql`)
- [ ] Scripts Python — deputados, votações, gastos, presença
- [ ] Frontend Next.js — home, busca, perfil, CEP
- [ ] Painel "Meus Políticos" (usuário logado)
- [ ] `/admin` — controle de ingestão e qualidade
- [ ] Deploy Vercel + Search Console + GA4

### Fase 2
- Senado Federal (81 senadores)
- IA explicativa — tradução de juridiquês
- Candidatos 2026
- Alertas por e-mail
- RSS feeds por político

### Fase 3
- Governadores e assembleias estaduais
- Prefeitos (via TSE)
- Dados municipais

### Fase 4
- Vereadores — câmaras municipais
- Capitais primeiro
- OCR de diários oficiais

---

## Escopo por cargo

| Cargo | Quantidade | Fase |
|---|---|---|
| Deputados federais | 513 | **MVP** |
| Senadores | 81 | Fase 2 |
| Presidente / Governadores | 28 | Fase 2 |
| Deputados estaduais | ~1.000 | Fase 3 |
| Prefeitos | 5.570 | Fase 3 |
| Vereadores | ~57.000 | Fase 4 |

---

## Princípios

### O que fazemos

- Mostramos dados oficiais com rastreabilidade completa
- Tornamos informação pública acessível e compreensível
- Citamos a fonte em cada dado exibido
- Identificamos o estado do dado (`oficial`, `parcial`, `atrasado`)

### O que não fazemos — nunca

- Score político ou "ranking moral"
- Classificação ideológica automatizada (esquerda/direita/centro)
- Comentários de usuários sobre políticos
- Conteúdo patrocinado por partidos ou campanhas
- Qualquer feature que misture dado oficial com opinião

> **Filtro de decisão:** "Isso aumenta transparência ou só aumenta ruído?"
> Se a resposta não for claramente "aumenta transparência", não entra.

---

## Documentação interna

| Arquivo | Conteúdo |
|---|---|
| `meuspoliticos_master.md` | Visão do produto, roadmap, escopo, estratégia |
| `wireframes_meuspoliticos.md` | UX/UI — todas as telas |
| `data_source_master.md` | Arquitetura de dados, pipelines, ETL |
| `001_schema.sql` | Schema PostgreSQL/Supabase |
| `branding_meus_politicos_manifesto_identidade.md` | Identidade visual e tom de voz |

---

## Troubleshooting — ETL Senado

### ❌ "Connection refused"
Verifique o host no `.env` e teste a conexão direta:
```bash
psql -h <your-host> -U postgres -c "SELECT 1"
```

### ❌ "Table does not exist"
O schema ainda não foi rodado. Execute antes do loader:
```bash
psql -h <host> -U postgres < 001_schema.sql
```

### ❌ "Permission denied"
O usuário precisa de privilégio de criação:
```sql
ALTER ROLE postgres CREATEDB;
```

### ❌ Rate limit (erro 429)
Aumente o delay entre requisições em `load_senado.py`:
```python
SENADO_RATE_LIMIT_DELAY = 1.0  # padrão: 0.5s
```

---



1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nome-da-feature`
3. Commit: `git commit -m 'feat: descrição'`
4. Push: `git push origin feature/nome-da-feature`
5. Abra um Pull Request

### Antes de abrir um PR

- Todo dado novo precisa ter `source_id`, `source_record_id` e `collected_at`
- Nenhuma feature que adicione opinião, ranking ou comparação ideológica será aceita
- Testes nos scripts de coleta são obrigatórios

---

## Contato

- Site: [meuspoliticos.com](https://meuspoliticos.com)
- E-mail: contato@meuspoliticos.com

---

*meuspoliticos.com · meuspoliticos.com.br*
*Transparência para decidir melhor.*
