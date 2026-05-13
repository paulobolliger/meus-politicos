-- ============================================================
-- meuspoliticos.com — Schema do banco de dados
-- Supabase / PostgreSQL
-- Versão: 2.10 — maio 2026
-- ============================================================
-- Alterações v2.2 (vs v2.1):
--   + timestamptz em todos os campos de data/hora (UTC-safe)
--   + ON DELETE SET NULL em partido_id e tema_id (resiliência)
--   + CHECK (mes BETWEEN 1 AND 12) em gastos
--   + CHECK (percentual BETWEEN 0 AND 100) em presenca e politicos
--   + trigger set_atualizado_em() em todas as tabelas
-- Alterações v2.3 (vs v2.2):
--   + removido_em como timestamptz (consistência UTC)
--   + proposta_resumo como jsonb (estruturado, IA-friendly)
--   + CHECK (valor >= 0) em gastos, emendas e bens_declarados
-- Alterações v2.4 (vs v2.3):
--   + campos source_id, source_record_id, collected_at em
--     politicos, votacoes, gastos, presenca, candidatos (lineage)
-- Alterações v2.5 (vs v2.4):
--   + campo legislatura em votacoes
-- Alterações v2.6 (vs v2.5):
--   + campo nome_eleitoral em politicos (nomeEleitoral da API Câmara)
--   + tabela partidos (entidade política, GEO, páginas futuras)
--   + tabela politico_partidos (histórico de migrações)
--   + tabela temas (em vez de tema text — flexível e extensível)
--   + campo foto_fonte e foto_atualizada_em em politicos
--   + campo ativo em partidos
--   + campo slug, cor, icone em temas
--   + criado_em padronizado em todas as tabelas
--   + removido_em (soft delete) em politicos, candidatos,
--     redes_sociais, discursos
--   + índices compostos (politico_id, data desc) em
--     votacoes, gastos, discursos
--   + duracao_ms e metadata jsonb em coletas_log
-- Alterações v2.7 (vs v2.6):
--   + tabela politico_ids (entity resolution Câmara v1 ↔ v2)
--   + enum parse_status_tipo (pending/parsed/error) para Bronze layer
-- Alterações v2.8 (vs v2.7):  [Fase 2 — Senado Federal]
--   + tabela senadores (atual + histórico)
--   + tabela senado_votacoes (votações nominais)
--   + tabela senado_materias (PLs, emendas, requerimentos)
--   + tabela senado_comissoes (participação em comissões)
--   + tabela senado_discursos (discursos e apartes)
--   + tabela senado_sessoes (sessões plenárias)
--   + tabela politico_senado_ids (entity resolution Senado ↔ politicos)
--   + tabela raw_senado (Bronze layer — XML bruto + SHA-256)
--   + RLS em todas as tabelas do Senado
--   + 7 triggers set_atualizado_em nas tabelas do Senado
-- Alterações v2.9 (vs v2.8):  [TSE — levantamento de dados]
--   + campo cd_municipio_tse em municipios (cruzamento TSE ↔ IBGE)
--   + campos genero e cor_raca em candidatos (DS_GENERO, DS_COR_RACA)
--   + comentários em sequencial_tse (= SQ_CANDIDATO) e id_tse
--   + campos sq_candidato e cd_municipio_tse em candidaturas_historico
-- Alterações v2.10 (vs v2.9):  [Portal da Transparência — levantamento]
--   + campo codigo_siafi em politicos (identificador CGU/SIAFI para emendas)
-- ============================================================
-- NÃO persistido no banco (gerado dinamicamente no Next.js):
--   - seo_descricao (template server-side)
--   - og_image_url (opengraph-image.tsx)
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE cargo_tipo AS ENUM (
  'presidente', 'vice_presidente',
  'governador', 'vice_governador',
  'senador',
  'deputado_federal',
  'deputado_estadual',
  'prefeito', 'vice_prefeito',
  'vereador'
);

CREATE TYPE situacao_politico AS ENUM (
  'ativo', 'licenciado', 'suplente', 'afastado', 'inativo'
);

CREATE TYPE voto_tipo AS ENUM (
  'sim', 'nao', 'abstencao', 'ausente', 'obstrucao', 'artigo_17'
);

CREATE TYPE impacto_nivel AS ENUM ('1', '2', '3', '4');
-- 1=baixo  2=médio  3=alto  4=crítico
-- 1: gasto cota, discurso, participação comissão
-- 2: votação nominal comum, novo PL, ausência
-- 3: votação relevante, PEC, candidatura 2026
-- 4: cassação, afastamento, troca de partido, votação constitucional

CREATE TYPE dado_estado AS ENUM (
  'oficial', 'parcial', 'atrasado', 'em_processamento', 'indisponivel'
);

CREATE TYPE situacao_candidato AS ENUM (
  'deferido', 'indeferido', 'cassado', 'pendente'
);

CREATE TYPE perfil_candidato AS ENUM (
  'em_exercicio', 'ex_mandatario', 'sem_mandato'
);

CREATE TYPE correcao_status AS ENUM (
  'pendente', 'aprovado', 'rejeitado', 'arquivado'
);

CREATE TYPE coleta_status AS ENUM (
  'ok', 'atrasado', 'falhou', 'em_andamento'
);

CREATE TYPE parse_status_tipo AS ENUM (
  'pending', 'parsed', 'error'
);
-- Ciclo de vida de registros na Bronze layer (raw_senado)
-- pending: XML recebido, aguarda parsing
-- parsed:  parsing concluído, dados na Silver layer
-- error:   parsing falhou — reprocessar sem re-fetch da API


-- ============================================================
-- MUNICÍPIOS (IBGE)
-- Fonte: servicodados.ibge.gov.br/api/v1/localidades/municipios
-- ============================================================

CREATE TABLE municipios (
  id           uuid primary key default gen_random_uuid(),
  codigo_ibge  integer unique not null,
  nome         text not null,
  uf           text not null,
  regiao       text,
  populacao    integer,
  cd_municipio_tse integer unique,
  -- Código interno do TSE — diferente do codigo_ibge
  -- Necessário para cruzar dados do TSE (candidatos, resultados) com municípios IBGE
  -- Fonte: tabela de cruzamento TSE × IBGE disponível no portal dadosabertos.tse.jus.br
  criado_em    timestamptz default now(),
  atualizado_em timestamptz default now()
);

CREATE INDEX idx_municipios_uf     ON municipios(uf);
CREATE INDEX idx_municipios_codigo ON municipios(codigo_ibge);


-- ============================================================
-- PARTIDOS
-- Entidade política — fecha o grafo para GEO e páginas futuras
-- ============================================================

CREATE TABLE partidos (
  id           uuid primary key default gen_random_uuid(),
  sigla        text unique not null,   -- 'PT', 'PL', 'MDB'
  nome         text not null,          -- nome completo oficial
  numero       integer unique,         -- número eleitoral TSE
  cor          text,                   -- cor oficial ex: '#FF0000'
  logo_url     text,
  ativo        boolean default true,
  -- false: partido extinto, fundido ou incorporado
  criado_em    timestamptz default now(),
  atualizado_em timestamptz default now()
);

CREATE INDEX idx_partidos_sigla ON partidos(sigla);
CREATE INDEX idx_partidos_ativo ON partidos(ativo);


-- ============================================================
-- TEMAS
-- Categorias de votações, discursos e projetos
-- Tabela (não enum) para permitir crescimento sem migration
-- ============================================================

CREATE TABLE temas (
  id           uuid primary key default gen_random_uuid(),
  nome         text unique not null,
  -- 'Economia', 'Social', 'Educação', 'Saúde', 'Segurança',
  -- 'Meio Ambiente', 'Política', 'Infraestrutura', 'Institucional'
  slug         text unique not null,
  -- 'economia', 'social', 'educacao', etc — para URLs e filtros
  cor          text,   -- cor do badge na UI ex: '#e8eefb'
  icone        text,   -- nome do ícone Tabler ex: 'ti-chart-bar'
  criado_em    timestamptz default now()
);

-- Seed inicial dos temas
INSERT INTO temas (nome, slug, cor, icone) VALUES
  ('Economia',       'economia',       '#e8eefb', 'ti-chart-bar'),
  ('Social',         'social',         '#e8f5ee', 'ti-users'),
  ('Educação',       'educacao',       '#f0e8ff', 'ti-school'),
  ('Saúde',          'saude',          '#e8f5ee', 'ti-heart'),
  ('Segurança',      'seguranca',      '#fff0e8', 'ti-shield'),
  ('Meio Ambiente',  'meio-ambiente',  '#e8f5ee', 'ti-leaf'),
  ('Política',       'politica',       '#e8eefb', 'ti-building-bank'),
  ('Infraestrutura', 'infraestrutura', '#faeeda', 'ti-road'),
  ('Institucional',  'institucional',  '#f5f6fa', 'ti-file-description');


-- ============================================================
-- POLÍTICOS
-- Fonte MVP:    dadosabertos.camara.leg.br/api/v2/deputados
-- Fonte fase 2: legis.senado.leg.br, dadosabertos.tse.jus.br
-- ============================================================

CREATE TABLE politicos (
  id             uuid primary key default gen_random_uuid(),

  -- Identificação
  nome           text not null,
  nome_civil     text,
  slug           text unique not null,
  -- URL semântica para SEO: 'nikolas-ferreira-dep-federal-mg'
  -- Gerado no import. Usado em /politico/[slug]

  -- Partido atual (FK — histórico em politico_partidos)
  partido_id     uuid references partidos(id) on delete set null,

  uf             text not null,
  cargo          cargo_tipo not null,
  situacao       situacao_politico default 'ativo',

  -- Mandato atual
  mandato_inicio date,
  mandato_fim    date,
  numero_mandato integer default 1,

  -- Dados pessoais/públicos (TSE/Câmara)
  foto_url            text,
  foto_fonte          text,
  -- ex: 'camara.leg.br' | 'senado.leg.br' | 'tse.jus.br'
  foto_atualizada_em  timestamptz,
  email               text,
  nome_eleitoral      text,
  -- Nome na urna — ex: "NIKOLAS" | Fonte: ultimoStatus.nomeEleitoral (Câmara)
  data_nascimento     date,
  naturalidade        text,
  escolaridade        text,
  ocupacao            text,

  -- IDs nas fontes externas
  id_camara      integer unique,
  id_senado      integer unique,
  id_tse         text,
  codigo_siafi   text unique,
  -- Código do autor no SIAFI (CGU/Portal da Transparência)
  -- Presente no campo autor.codigo do endpoint /emendas
  -- Estrutura do codigoEmenda: ano(4) + codigo_siafi(4) + sequencial(4)

  -- Vínculo geográfico
  municipio_id   uuid references municipios(id),

  -- Cache de dados calculados (atualizado diariamente)
  presenca_pct_atual  numeric(5,2) check (presenca_pct_atual between 0 and 100),
  gasto_total_ano     numeric(14,2),
  total_votacoes      integer,

  -- Lineage — rastreabilidade da origem do dado
  source_id          text,            -- 'camara_deputados' | 'senado' | 'tse'
  source_record_id   text,            -- ID do registro na fonte original
  collected_at       timestamptz,     -- quando foi coletado

  -- Estado e controle
  dado_estado    dado_estado default 'oficial',
  removido_em    timestamptz,   -- soft delete
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_politicos_cargo     ON politicos(cargo);
CREATE INDEX idx_politicos_uf        ON politicos(uf);
CREATE INDEX idx_politicos_partido   ON politicos(partido_id);
CREATE INDEX idx_politicos_slug      ON politicos(slug);
CREATE INDEX idx_politicos_id_camara ON politicos(id_camara);
CREATE INDEX idx_politicos_situacao  ON politicos(situacao);
CREATE INDEX idx_politicos_ativos    ON politicos(removido_em) WHERE removido_em IS NULL;


-- ============================================================
-- HISTÓRICO PARTIDÁRIO
-- Migrações: "PSL → PL → União Brasil"
-- Essencial para timeline política e contexto histórico
-- ============================================================

CREATE TABLE politico_partidos (
  id           uuid primary key default gen_random_uuid(),
  politico_id  uuid not null references politicos(id) on delete cascade,
  partido_id   uuid not null references partidos(id),

  inicio       date not null,
  fim          date,        -- null = partido atual
  motivo       text,
  -- ex: 'filiação' | 'fusão' | 'migração' | 'desfiliação'

  criado_em    timestamptz default now()
);

CREATE INDEX idx_pol_partidos_politico ON politico_partidos(politico_id);
CREATE INDEX idx_pol_partidos_partido  ON politico_partidos(partido_id);
CREATE INDEX idx_pol_partidos_atual    ON politico_partidos(fim) WHERE fim IS NULL;


-- ============================================================
-- REDES SOCIAIS DO POLÍTICO
-- Sempre separadas dos dados oficiais (regra de interface)
-- Label: "Canais do político — conteúdo de responsabilidade
--         do parlamentar, não da plataforma"
-- ============================================================

CREATE TABLE redes_sociais (
  id            uuid primary key default gen_random_uuid(),
  politico_id   uuid not null references politicos(id) on delete cascade,

  plataforma    text not null,
  -- 'instagram' | 'twitter_x' | 'tiktok' | 'youtube'
  -- 'facebook' | 'site_oficial' | 'linkedin'
  url           text not null,
  handle        text,

  verificado    boolean default false,
  removido_em   timestamptz,   -- soft delete
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now(),

  unique(politico_id, plataforma)
);

CREATE INDEX idx_redes_politico ON redes_sociais(politico_id);
CREATE INDEX idx_redes_ativas   ON redes_sociais(removido_em) WHERE removido_em IS NULL;


-- ============================================================
-- VOTAÇÕES
-- Fonte: dadosabertos.camara.leg.br/api/v2/deputados/{id}/votacoes
-- ============================================================

CREATE TABLE votacoes (
  id                  uuid primary key default gen_random_uuid(),
  politico_id         uuid not null references politicos(id) on delete cascade,
  tema_id             uuid references temas(id) on delete set null,

  data                date not null,
  hora                time,
  descricao           text,          -- texto original da API
  descricao_simples   text,          -- traduzido por IA
  voto                voto_tipo not null,

  proposicao          text,          -- ex: 'PL 1234/2023'
  proposicao_id       text,
  legislatura         integer,       -- 55 | 56 | 57 (atual) — unidade histórica natural

  -- Hierarquia de impacto (seção 26 do master)
  impacto_nivel       impacto_nivel default '2',

  -- Estado do dado (seção 27)
  dado_estado         dado_estado default 'oficial',

  -- Trilha de auditoria IA (seção 28)
  ia_processado       boolean default false,
  ia_gerado_em        timestamptz,
  ia_modelo           text,
  ia_corrigido_em     timestamptz,
  ia_corrigido_motivo text,

  -- Lineage
  source_id          text,
  source_record_id   text,
  collected_at       timestamptz,

  link_fonte          text not null,
  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now()
);

CREATE INDEX idx_votacoes_politico      ON votacoes(politico_id);
CREATE INDEX idx_votacoes_data          ON votacoes(data desc);
CREATE INDEX idx_votacoes_voto          ON votacoes(voto);
CREATE INDEX idx_votacoes_tema          ON votacoes(tema_id);
CREATE INDEX idx_votacoes_impacto       ON votacoes(impacto_nivel);
CREATE INDEX idx_votacoes_pol_data      ON votacoes(politico_id, data desc);
-- índice composto para query do perfil: "últimas votações de X"
CREATE INDEX idx_votacoes_ia_pendente   ON votacoes(ia_processado) WHERE ia_processado = false;


-- ============================================================
-- GASTOS (CEAP / COTA PARLAMENTAR)
-- Fonte: dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas
-- ============================================================

CREATE TABLE gastos (
  id             uuid primary key default gen_random_uuid(),
  politico_id    uuid not null references politicos(id) on delete cascade,

  ano            integer not null,
  mes            integer not null check (mes between 1 and 12),

  valor          numeric(12,2) not null check (valor >= 0),
  valor_glosa    numeric(12,2) default 0,

  categoria      text,
  descricao      text,
  fornecedor     text,
  cnpj_cpf       text,

  impacto_nivel  impacto_nivel default '1',
  dado_estado    dado_estado default 'oficial',

  -- Lineage
  source_id          text,
  source_record_id   text,
  collected_at       timestamptz,

  link_fonte     text not null,
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_gastos_politico  ON gastos(politico_id);
CREATE INDEX idx_gastos_ano_mes   ON gastos(ano desc, mes desc);
CREATE INDEX idx_gastos_categoria ON gastos(categoria);
CREATE INDEX idx_gastos_pol_ano   ON gastos(politico_id, ano desc, mes desc);
-- índice composto para query do perfil: "gastos de X em 2025"


-- ============================================================
-- PRESENÇA EM SESSÕES
-- Fonte: dadosabertos.camara.leg.br/api/v2/deputados/{id}/eventos
-- ============================================================

CREATE TABLE presenca (
  id             uuid primary key default gen_random_uuid(),
  politico_id    uuid not null references politicos(id) on delete cascade,

  ano            integer not null,
  mes            integer,             -- null = resumo anual

  total_sessoes  integer not null,
  presencas      integer not null,
  ausencias      integer generated always as (total_sessoes - presencas) stored,
  percentual     numeric(5,2) not null check (percentual between 0 and 100),

  dado_estado    dado_estado default 'oficial',

  -- Lineage
  source_id          text,
  source_record_id   text,
  collected_at       timestamptz,

  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now(),

  unique(politico_id, ano, mes)
);

CREATE INDEX idx_presenca_politico ON presenca(politico_id);
CREATE INDEX idx_presenca_ano      ON presenca(ano desc);


-- ============================================================
-- EMENDAS PARLAMENTARES (FASE 2)
-- Fonte: portaldatransparencia.gov.br/api-de-dados/emendas
-- ============================================================

CREATE TABLE emendas (
  id                uuid primary key default gen_random_uuid(),
  politico_id       uuid not null references politicos(id) on delete cascade,

  ano               integer not null,
  valor             numeric(14,2) not null check (valor >= 0),

  municipio_destino text,
  municipio_id      uuid references municipios(id),
  uf_destino        text,
  area              text,
  descricao         text,

  dado_estado       dado_estado default 'oficial',
  link_fonte        text not null,
  criado_em         timestamptz default now(),
  atualizado_em     timestamptz default now()
);

CREATE INDEX idx_emendas_politico ON emendas(politico_id);
CREATE INDEX idx_emendas_ano      ON emendas(ano desc);


-- ============================================================
-- DISCURSOS (FASE 2 — ATUAÇÃO PARLAMENTAR)
-- Fonte: dadosabertos.camara.leg.br/api/v2/deputados/{id}/discursos
-- ============================================================

CREATE TABLE discursos (
  id              uuid primary key default gen_random_uuid(),
  politico_id     uuid not null references politicos(id) on delete cascade,
  tema_id         uuid references temas(id) on delete set null,

  data            date not null,
  hora            time,
  resumo          text,
  tipo            text,
  -- 'discurso' | 'aparte' | 'questao_ordem' | 'explicacao_voto'
  fase_sessao     text,
  transcricao_url text,

  impacto_nivel   impacto_nivel default '1',
  dado_estado     dado_estado default 'oficial',

  ia_processado   boolean default false,
  ia_gerado_em    timestamptz,
  ia_modelo       text,

  link_fonte      text not null,
  removido_em     timestamptz,   -- soft delete
  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now()
);

CREATE INDEX idx_discursos_politico  ON discursos(politico_id);
CREATE INDEX idx_discursos_data      ON discursos(data desc);
CREATE INDEX idx_discursos_tema      ON discursos(tema_id);
CREATE INDEX idx_discursos_pol_data  ON discursos(politico_id, data desc);
-- índice composto para query: "últimos discursos de X"
CREATE INDEX idx_discursos_ativos    ON discursos(removido_em) WHERE removido_em IS NULL;


-- ============================================================
-- ATUAÇÃO PARLAMENTAR — MÉTRICAS AGREGADAS (FASE 2)
-- ============================================================

CREATE TABLE atuacao (
  id                    uuid primary key default gen_random_uuid(),
  politico_id           uuid not null references politicos(id) on delete cascade,

  ano                   integer not null,

  projetos_apresentados integer default 0,
  relatorias            integer default 0,
  pareceres             integer default 0,
  requerimentos         integer default 0,
  comissoes             integer default 0,
  discursos_total       integer default 0,

  -- Médias da câmara para comparativo no perfil
  media_projetos_casa   numeric(6,1),
  media_relatorias_casa numeric(6,1),
  media_presenca_casa   numeric(5,2),

  dado_estado           dado_estado default 'oficial',
  criado_em             timestamptz default now(),
  atualizado_em         timestamptz default now(),

  unique(politico_id, ano)
);

CREATE INDEX idx_atuacao_politico ON atuacao(politico_id);
CREATE INDEX idx_atuacao_ano      ON atuacao(ano desc);


-- ============================================================
-- CANDIDATOS ELEIÇÕES 2026
-- Fonte: dadosabertos.tse.jus.br (CSV) / Brasil.IO (API REST)
-- ============================================================

CREATE TABLE candidatos (
  id              uuid primary key default gen_random_uuid(),

  nome            text not null,
  nome_urna       text,
  slug            text unique not null,
  -- ex: 'joao-bezerra-dep-federal-sp-2026'
  partido_id      uuid references partidos(id) on delete set null,
  numero_urna     integer,
  cargo           cargo_tipo not null,
  uf              text,
  municipio_id    uuid references municipios(id),

  eleicao_ano     integer not null default 2026,
  situacao        situacao_candidato default 'pendente',
  foto_url        text,
  foto_fonte      text,
  foto_atualizada_em timestamptz,

  -- Dados demográficos (TSE — DS_GENERO e DS_COR_RACA)
  genero          text,   -- ex: 'MASCULINO' | 'FEMININO'
  cor_raca        text,   -- ex: 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDÍGENA'

  -- Perfil: cruzamento TSE × Câmara/Senado
  perfil_tipo     perfil_candidato,
  politico_id     uuid references politicos(id),
  -- preenchido se perfil A (em exercício) ou B (ex-mandatário)

  -- Histórico agregado (calculado de candidaturas_historico)
  mandatos_ant    integer default 0,
  candidaturas    integer default 0,

  -- Proposta de governo
  proposta_url    text,             -- PDF original TSE
  proposta_resumo jsonb,            -- 5 tópicos gerados por IA ex: [{"titulo":"Economia","descricao":"..."}]
  proposta_temas  text[],           -- array de slugs de temas

  bens_declarados numeric(14,2) check (bens_declarados >= 0),

  -- IDs externos TSE
  id_tse          text unique,
  -- Identificador interno da eleição (uso legado / cruzamento)
  sequencial_tse  text,
  -- SQ_CANDIDATO do TSE — chave primária eleitoral, sequencial de 12 dígitos por eleição
  -- Usar para: busca no DivulgaCandContas (fotos, PDFs), upsert diário em período eleitoral

  -- Trilha de auditoria IA
  ia_processado       boolean default false,
  ia_gerado_em        timestamptz,
  ia_modelo           text,
  ia_corrigido_em     timestamptz,
  ia_corrigido_motivo text,

  -- Lineage
  source_id          text,            -- 'tse' | 'brasil_io'
  source_record_id   text,
  collected_at       timestamptz,

  dado_estado     dado_estado default 'oficial',
  removido_em     timestamptz,   -- soft delete
  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now()
);

CREATE INDEX idx_candidatos_cargo     ON candidatos(cargo);
CREATE INDEX idx_candidatos_uf        ON candidatos(uf);
CREATE INDEX idx_candidatos_partido   ON candidatos(partido_id);
CREATE INDEX idx_candidatos_ano       ON candidatos(eleicao_ano);
CREATE INDEX idx_candidatos_slug      ON candidatos(slug);
CREATE INDEX idx_candidatos_politico  ON candidatos(politico_id);
CREATE INDEX idx_candidatos_municipio ON candidatos(municipio_id);
CREATE INDEX idx_candidatos_ativos    ON candidatos(removido_em) WHERE removido_em IS NULL;
CREATE INDEX idx_candidatos_ia        ON candidatos(ia_processado) WHERE ia_processado = false;


-- ============================================================
-- HISTÓRICO DE CANDIDATURAS (TSE desde 1994)
-- Permite: "4ª candidatura — eleito 2x"
-- ============================================================

CREATE TABLE candidaturas_historico (
  id            uuid primary key default gen_random_uuid(),

  politico_id   uuid references politicos(id),
  candidato_id  uuid references candidatos(id),
  -- pelo menos um dos dois preenchido

  eleicao_ano   integer not null,
  cargo         cargo_tipo not null,
  partido_id    uuid references partidos(id) on delete set null,
  uf            text,
  municipio_id  uuid references municipios(id),
  numero_urna   integer,

  resultado     text not null,
  -- 'eleito' | 'nao_eleito' | 'suplente' | 'cassado'
  -- 'renunciou' | 'em_curso'
  votos         integer,
  percentual    numeric(5,2),

  -- IDs externos TSE (dados brutos preservados antes do cruzamento)
  id_tse          text,
  sq_candidato    text,
  -- SQ_CANDIDATO do TSE para aquela eleição — chave de cruzamento com CSVs do TSE
  cd_municipio_tse integer,
  -- CD_MUNICIPIO do TSE — não é codigo_ibge — cruzar via municipios.cd_municipio_tse
  link_fonte    text,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

CREATE INDEX idx_cand_hist_politico  ON candidaturas_historico(politico_id);
CREATE INDEX idx_cand_hist_candidato ON candidaturas_historico(candidato_id);
CREATE INDEX idx_cand_hist_ano       ON candidaturas_historico(eleicao_ano desc);


-- ============================================================
-- USUÁRIOS — PERFIS
-- CEP nunca é armazenado (regra de privacidade)
-- ============================================================

CREATE TABLE perfis (
  id              uuid primary key references auth.users(id) on delete cascade,

  nome            text,
  uf              text,
  municipio       text,

  -- Preferências de notificação (fase 2)
  notif_votacao   boolean default true,
  notif_falta     boolean default true,
  notif_gasto     boolean default false,
  notif_partido   boolean default true,
  notif_candidato boolean default true,

  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now()
);


-- ============================================================
-- ACOMPANHAMENTOS ("Meus Políticos")
-- ============================================================

CREATE TABLE acompanhamentos (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  politico_id  uuid not null references politicos(id) on delete cascade,
  criado_em    timestamptz default now(),

  unique(usuario_id, politico_id)
);

CREATE INDEX idx_acompanhamentos_usuario  ON acompanhamentos(usuario_id);
CREATE INDEX idx_acompanhamentos_politico ON acompanhamentos(politico_id);


-- ============================================================
-- CORREÇÕES DE DADOS
-- Fluxo: /correcao (público) → /admin (aprovação)
-- ============================================================

CREATE TABLE correcoes (
  id                uuid primary key default gen_random_uuid(),

  nome_solicitante  text,
  email_solicitante text,

  politico_id       uuid references politicos(id),
  candidato_id      uuid references candidatos(id),

  dado_incorreto    text not null,
  dado_correto      text not null,
  link_fonte        text not null,  -- obrigatório

  status            correcao_status default 'pendente',
  revisado_por      text,
  revisado_em       timestamptz,
  motivo_rejeicao   text,

  criado_em         timestamptz default now()
);

CREATE INDEX idx_correcoes_status   ON correcoes(status);
CREATE INDEX idx_correcoes_politico ON correcoes(politico_id);


-- ============================================================
-- FEATURE FLAGS
-- Gerenciadas pelo /admin sem necessidade de deploy
-- ============================================================

CREATE TABLE feature_flags (
  id            uuid primary key default gen_random_uuid(),
  nome          text unique not null,
  ativo         boolean default false,
  descricao     text,
  atualizado_em timestamptz default now(),
  atualizado_por text,
  criado_em     timestamptz default now()
);

-- Seed inicial — todas OFF
INSERT INTO feature_flags (nome, ativo, descricao) VALUES
  ('insights_rankings',   false, 'Página /insights com rankings e análises'),
  ('na_imprensa',         false, 'Aba "Na imprensa" no perfil do político'),
  ('push_notifications',  false, 'Alertas via Web Push API'),
  ('atuacao_parlamentar', false, 'Aba de atuação parlamentar no perfil'),
  ('timeline_politica',   false, 'Linha do tempo no perfil do político'),
  ('modo_eleicao_2026',   false, 'Estado especial eleições outubro 2026'),
  ('explique_votacao',    false, 'Contexto IA por votação'),
  ('candidatos_2026',     false, 'Exibir perfis de candidatos 2026');


-- ============================================================
-- LOG DE COLETAS (auditoria dos cron jobs — /admin)
-- ============================================================

CREATE TABLE coletas_log (
  id            uuid primary key default gen_random_uuid(),

  fonte         text not null,
  -- 'camara_deputados' | 'senado' | 'tse'
  -- 'portal_transparencia' | 'ibge'
  tipo          text not null,
  -- 'deputados' | 'votacoes' | 'gastos' | 'presenca'
  -- 'candidatos' | 'emendas' | 'discursos'

  status        coleta_status not null,
  registros     integer default 0,
  erros         integer default 0,
  duracao_ms    integer,              -- duração em milissegundos
  mensagem      text,
  metadata      jsonb,
  -- ex: {"paginas": 10, "ultimo_id": 204554, "erro_tipo": "timeout"}

  iniciado_em   timestamptz not null default now(),
  concluido_em  timestamptz,
  criado_em     timestamptz default now()
);

CREATE INDEX idx_coletas_fonte  ON coletas_log(fonte);
CREATE INDEX idx_coletas_status ON coletas_log(status);
CREATE INDEX idx_coletas_inicio ON coletas_log(iniciado_em desc);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Dados públicos — qualquer um pode ler
ALTER TABLE municipios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE temas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE politico_partidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE redes_sociais          ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacoes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenca               ENABLE ROW LEVEL SECURITY;
ALTER TABLE emendas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE discursos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE atuacao                ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidaturas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura publica" ON municipios             FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON partidos               FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON temas                  FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON politicos              FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON politico_partidos      FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON redes_sociais          FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON votacoes               FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON gastos                 FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON presenca               FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON emendas                FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON discursos              FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON atuacao                FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON candidatos             FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON candidaturas_historico FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON feature_flags          FOR SELECT USING (true);

-- Dados privados do usuário
ALTER TABLE perfis          ENABLE ROW LEVEL SECURITY;
ALTER TABLE acompanhamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil proprio" ON perfis
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "acompanhamentos proprios" ON acompanhamentos
  FOR ALL USING (auth.uid() = usuario_id);

-- Correções: qualquer um insere, só admin gerencia
ALTER TABLE correcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inserir correcao" ON correcoes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin gerencia correcoes" ON correcoes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Coletas_log: só admin
ALTER TABLE coletas_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin acessa logs" ON coletas_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- RLS — TABELAS FASE 2 (SENADO)
-- Silver layer: leitura pública
-- Bronze layer (raw_senado): admin-only
-- ============================================================

ALTER TABLE politico_ids          ENABLE ROW LEVEL SECURITY;
ALTER TABLE senadores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_votacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_materias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_comissoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_discursos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_sessoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE politico_senado_ids    ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_senado             ENABLE ROW LEVEL SECURITY;

-- Silver layer — leitura pública
CREATE POLICY "leitura publica" ON politico_ids          FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON senadores              FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON senado_votacoes        FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON senado_materias        FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON senado_comissoes       FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON senado_discursos       FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON senado_sessoes         FOR SELECT USING (true);
CREATE POLICY "leitura publica" ON politico_senado_ids    FOR SELECT USING (true);

-- Bronze layer — admin-only (XML bruto sensível)
CREATE POLICY "admin acessa raw senado" ON raw_senado
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- VIEW: feed do usuário
-- Votações + gastos + discursos dos políticos acompanhados
-- Ordenado por data desc, com impacto_nivel para priorização
-- ============================================================

CREATE OR REPLACE VIEW feed_usuario AS
  SELECT
    a.usuario_id,
    p.id            AS politico_id,
    p.nome          AS politico_nome,
    p.cargo, p.foto_url,
    pt.sigla        AS partido,
    'votacao'       AS tipo_evento,
    v.id            AS evento_id,
    v.data,
    v.descricao_simples AS descricao,
    v.voto::text    AS detalhe,
    t.slug          AS tema,
    t.cor           AS tema_cor,
    t.icone         AS tema_icone,
    v.impacto_nivel,
    v.link_fonte
  FROM acompanhamentos a
  JOIN politicos p  ON p.id = a.politico_id AND p.removido_em IS NULL
  JOIN votacoes  v  ON v.politico_id = p.id
  LEFT JOIN temas t   ON t.id = v.tema_id
  LEFT JOIN partidos pt ON pt.id = p.partido_id

  UNION ALL

  SELECT
    a.usuario_id,
    p.id, p.nome, p.cargo, p.foto_url,
    pt.sigla        AS partido,
    'gasto'         AS tipo_evento,
    g.id            AS evento_id,
    (g.ano::text || '-' || LPAD(g.mes::text,2,'0') || '-01')::date AS data,
    g.categoria     AS descricao,
    g.valor::text   AS detalhe,
    NULL AS tema, NULL AS tema_cor, NULL AS tema_icone,
    g.impacto_nivel,
    g.link_fonte
  FROM acompanhamentos a
  JOIN politicos p ON p.id = a.politico_id AND p.removido_em IS NULL
  JOIN gastos    g ON g.politico_id = p.id
  LEFT JOIN partidos pt ON pt.id = p.partido_id

  UNION ALL

  SELECT
    a.usuario_id,
    p.id, p.nome, p.cargo, p.foto_url,
    pt.sigla        AS partido,
    'discurso'      AS tipo_evento,
    d.id            AS evento_id,
    d.data,
    d.resumo        AS descricao,
    d.tipo          AS detalhe,
    t.slug AS tema, t.cor AS tema_cor, t.icone AS tema_icone,
    d.impacto_nivel,
    d.link_fonte
  FROM acompanhamentos a
  JOIN politicos p  ON p.id = a.politico_id AND p.removido_em IS NULL
  JOIN discursos d  ON d.politico_id = p.id AND d.removido_em IS NULL
  LEFT JOIN temas t   ON t.id = d.tema_id
  LEFT JOIN partidos pt ON pt.id = p.partido_id

  ORDER BY data DESC;


-- ============================================================
-- VIEW: resumo do político
-- ============================================================

CREATE OR REPLACE VIEW resumo_politico AS
  SELECT
    p.id, p.nome, p.slug, p.uf, p.cargo,
    p.foto_url, p.situacao, p.dado_estado,
    p.mandato_inicio, p.mandato_fim, p.numero_mandato,
    pt.sigla        AS partido,
    pt.cor          AS partido_cor,
    COALESCE(pr.percentual, 0)    AS presenca_pct,
    COALESCE(SUM(g.valor), 0)     AS gasto_total_ano,
    COUNT(DISTINCT v.id)          AS total_votacoes,
    COUNT(DISTINCT ac.usuario_id) AS total_seguidores,
    p.atualizado_em
  FROM politicos p
  LEFT JOIN partidos pt ON pt.id = p.partido_id
  LEFT JOIN presenca pr ON pr.politico_id = p.id
    AND pr.ano = EXTRACT(YEAR FROM now())
    AND pr.mes IS NULL
  LEFT JOIN gastos g  ON g.politico_id = p.id
    AND g.ano = EXTRACT(YEAR FROM now())
  LEFT JOIN votacoes v ON v.politico_id = p.id
  LEFT JOIN acompanhamentos ac ON ac.politico_id = p.id
  WHERE p.removido_em IS NULL
  GROUP BY
    p.id, p.nome, p.slug, p.uf, p.cargo,
    p.foto_url, p.situacao, p.dado_estado,
    p.mandato_inicio, p.mandato_fim, p.numero_mandato,
    p.atualizado_em, pr.percentual,
    pt.sigla, pt.cor;


-- ============================================================
-- VIEW: fila de IA pendente (/admin — Fila IA)
-- ============================================================

CREATE OR REPLACE VIEW fila_ia_pendente AS
  SELECT
    'votacao'    AS tipo,
    v.id         AS item_id,
    v.proposicao AS referencia,
    v.data       AS data_registro,
    v.ia_gerado_em,
    v.ia_modelo,
    p.nome       AS politico_nome
  FROM votacoes v
  JOIN politicos p ON p.id = v.politico_id
  WHERE v.ia_processado = false
    AND v.descricao IS NOT NULL

  UNION ALL

  SELECT
    'candidato'  AS tipo,
    c.id,
    c.nome       AS referencia,
    c.atualizado_em AS data_registro,
    c.ia_gerado_em,
    c.ia_modelo,
    NULL         AS politico_nome
  FROM candidatos c
  WHERE c.ia_processado = false
    AND c.proposta_url IS NOT NULL
    AND c.removido_em IS NULL

  ORDER BY data_registro ASC;


-- ============================================================
-- VIEW: última coleta por fonte (/status público e /admin)
-- ============================================================

CREATE OR REPLACE VIEW ultima_coleta_por_fonte AS
  SELECT DISTINCT ON (fonte, tipo)
    fonte, tipo, status, registros, erros,
    duracao_ms, mensagem, iniciado_em, concluido_em
  FROM coletas_log
  ORDER BY fonte, tipo, iniciado_em DESC;


-- ============================================================
-- ============================================================
-- FASE 2 — SENADO FEDERAL
-- Fonte: legis.senado.leg.br/direitosadaptados/api
-- source_id = 'senado_legis'
-- ============================================================
-- ============================================================


-- ============================================================
-- ENTITY RESOLUTION — CÂMARA v1 ↔ v2
-- Mesmo deputado, duas versões da API (ideCadastro → id)
-- ============================================================

CREATE TABLE politico_ids (
  id           uuid primary key default gen_random_uuid(),
  politico_id  uuid not null references politicos(id) on delete cascade,

  ideCadastro  integer unique not null,
  -- ID da Câmara v1 (ideCadastro) — chave de cruzamento legado

  criado_em    timestamptz default now()
);

CREATE INDEX idx_politico_ids_politico    ON politico_ids(politico_id);
CREATE INDEX idx_politico_ids_cadastro    ON politico_ids(ideCadastro);


-- ============================================================
-- SENADORES
-- Dados cadastrais — atual + histórico
-- Fonte: /direitosadaptados/api/senadores
-- ============================================================

CREATE TABLE senadores (
  id             uuid primary key default gen_random_uuid(),

  id_senado      integer unique not null,
  -- ID único da API do Senado

  politico_id    uuid references politicos(id) on delete set null,
  -- Entity resolution via CPF — preenchido após ETAPA 10

  nome           text not null,
  nome_completo  text,
  uf             text not null,
  partido_id     uuid references partidos(id) on delete set null,
  email          text,
  foto_url       text,

  is_current     boolean default true,
  -- true = em exercício | false = histórico

  mandato_inicio date,
  mandato_fim    date,

  -- Lineage
  source_id          text default 'senado_legis',
  source_record_id   text,
  collected_at       timestamptz,

  dado_estado    dado_estado default 'oficial',
  removido_em    timestamptz,   -- soft delete
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now(),

  unique(id_senado, is_current)
);

CREATE INDEX idx_senadores_politico   ON senadores(politico_id);
CREATE INDEX idx_senadores_uf         ON senadores(uf);
CREATE INDEX idx_senadores_partido    ON senadores(partido_id);
CREATE INDEX idx_senadores_current    ON senadores(is_current) WHERE is_current = true;
CREATE INDEX idx_senadores_ativos     ON senadores(removido_em) WHERE removido_em IS NULL;


-- ============================================================
-- VOTAÇÕES DO SENADO
-- Fonte: /direitosadaptados/api/senadores/{id}/votacoes
-- ============================================================

CREATE TABLE senado_votacoes (
  id             uuid primary key default gen_random_uuid(),
  senador_id     uuid not null references senadores(id) on delete cascade,
  tema_id        uuid references temas(id) on delete set null,

  data           date not null,
  hora           time,
  descricao      text,          -- texto original da API
  descricao_simples text,       -- traduzido por IA
  voto           voto_tipo not null,

  proposicao     text,          -- ex: 'PL 1234/2023'
  proposicao_id  text,
  codigo_sessao  text,

  impacto_nivel  impacto_nivel default '2',
  dado_estado    dado_estado default 'oficial',

  -- Lineage
  source_id          text default 'senado_legis',
  source_record_id   text,
  collected_at       timestamptz,

  link_fonte     text,
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_senado_vot_senador    ON senado_votacoes(senador_id);
CREATE INDEX idx_senado_vot_data       ON senado_votacoes(data desc);
CREATE INDEX idx_senado_vot_voto       ON senado_votacoes(voto);
CREATE INDEX idx_senado_vot_tema       ON senado_votacoes(tema_id);
CREATE INDEX idx_senado_vot_impacto    ON senado_votacoes(impacto_nivel);
CREATE INDEX idx_senado_vot_sen_data   ON senado_votacoes(senador_id, data desc);
-- índice composto para query do perfil: "últimas votações de X"


-- ============================================================
-- MATÉRIAS LEGISLATIVAS DO SENADO
-- PLs, emendas, requerimentos
-- Fonte: /direitosadaptados/api/materia/pesquisa/lista
-- ============================================================

CREATE TABLE senado_materias (
  id             uuid primary key default gen_random_uuid(),
  senador_id     uuid references senadores(id) on delete set null,
  -- null quando a matéria não tem autor individual (ex: Executivo)
  tema_id        uuid references temas(id) on delete set null,

  codigo_materia text unique not null,
  -- ID único da matéria na API do Senado
  tipo           text not null,
  -- 'PL' | 'PEC' | 'MP' | 'emenda' | 'requerimento' | 'indicacao'
  numero         integer,
  ano            integer,
  ementa         text,
  ementa_simples text,          -- traduzido por IA
  situacao       text,

  data_apresentacao  date,

  dado_estado    dado_estado default 'oficial',

  -- Lineage
  source_id          text default 'senado_legis',
  source_record_id   text,
  collected_at       timestamptz,

  link_fonte     text,
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_senado_mat_senador    ON senado_materias(senador_id);
CREATE INDEX idx_senado_mat_tipo       ON senado_materias(tipo);
CREATE INDEX idx_senado_mat_ano        ON senado_materias(ano desc);
CREATE INDEX idx_senado_mat_tema       ON senado_materias(tema_id);


-- ============================================================
-- COMISSÕES DO SENADO
-- Participação histórica em comissões
-- Fonte: /direitosadaptados/api/senador/{id}/comissoes
-- ============================================================

CREATE TABLE senado_comissoes (
  id             uuid primary key default gen_random_uuid(),
  senador_id     uuid not null references senadores(id) on delete cascade,

  sigla_comissao text not null,
  nome_comissao  text,
  cargo          text,
  -- 'Titular' | 'Suplente' | 'Presidente' | 'Vice-Presidente'

  data_inicio    date,
  data_fim       date,          -- null = participação atual

  -- Lineage
  source_id          text default 'senado_legis',
  source_record_id   text,
  collected_at       timestamptz,

  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_senado_com_senador    ON senado_comissoes(senador_id);
CREATE INDEX idx_senado_com_sigla      ON senado_comissoes(sigla_comissao);
CREATE INDEX idx_senado_com_atual      ON senado_comissoes(data_fim) WHERE data_fim IS NULL;


-- ============================================================
-- DISCURSOS DO SENADO
-- Discursos e apartes em plenário
-- Fonte: /direitosadaptados/api/senador/{id}/discursos
-- ============================================================

CREATE TABLE senado_discursos (
  id             uuid primary key default gen_random_uuid(),
  senador_id     uuid not null references senadores(id) on delete cascade,
  tema_id        uuid references temas(id) on delete set null,

  data           date not null,
  hora           time,
  resumo         text,
  tipo           text,
  -- 'discurso' | 'aparte' | 'questao_ordem' | 'explicacao_voto'
  fase_sessao    text,
  transcricao_url text,

  impacto_nivel  impacto_nivel default '1',
  dado_estado    dado_estado default 'oficial',

  ia_processado  boolean default false,
  ia_gerado_em   timestamptz,
  ia_modelo      text,

  -- Lineage
  source_id          text default 'senado_legis',
  source_record_id   text,
  collected_at       timestamptz,

  link_fonte     text,
  removido_em    timestamptz,   -- soft delete
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_senado_dis_senador    ON senado_discursos(senador_id);
CREATE INDEX idx_senado_dis_data       ON senado_discursos(data desc);
CREATE INDEX idx_senado_dis_tema       ON senado_discursos(tema_id);
CREATE INDEX idx_senado_dis_sen_data   ON senado_discursos(senador_id, data desc);
CREATE INDEX idx_senado_dis_ativos     ON senado_discursos(removido_em) WHERE removido_em IS NULL;
CREATE INDEX idx_senado_dis_ia         ON senado_discursos(ia_processado) WHERE ia_processado = false;


-- ============================================================
-- SESSÕES PLENÁRIAS DO SENADO
-- Fonte: /direitosadaptados/api/plenario/lista/votacoes
-- ============================================================

CREATE TABLE senado_sessoes (
  id             uuid primary key default gen_random_uuid(),

  codigo_sessao  text unique not null,
  data           date not null,
  hora_inicio    time,
  hora_fim       time,
  tipo_sessao    text,
  -- 'ordinaria' | 'extraordinaria' | 'especial' | 'conjunta'
  numero_sessao  integer,
  legislatura    integer,
  situacao       text,

  -- Lineage
  source_id          text default 'senado_legis',
  source_record_id   text,
  collected_at       timestamptz,

  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now()
);

CREATE INDEX idx_senado_ses_data       ON senado_sessoes(data desc);
CREATE INDEX idx_senado_ses_tipo       ON senado_sessoes(tipo_sessao);
CREATE INDEX idx_senado_ses_leg        ON senado_sessoes(legislatura);


-- ============================================================
-- ENTITY RESOLUTION — SENADO ↔ POLITICOS
-- Âncora: CPF (nunca persistido — só usado no ETL)
-- Identifica políticos que passaram por ambas as casas
-- ============================================================

CREATE TABLE politico_senado_ids (
  id              uuid primary key default gen_random_uuid(),
  politico_id     uuid not null references politicos(id) on delete cascade,
  id_senado       integer not null,
  -- ID da API do Senado — referência sem FK (senadores pode não estar carregado)

  match_confidence numeric(4,3) not null check (match_confidence between 0 and 1),
  -- 1.000 = CPF + nome + UF coincidem exatamente
  -- 0.950 = CPF + nome (fuzzy match)
  -- 0.800 = nome + UF apenas (sem CPF disponível)
  -- < 0.800 = validação manual obrigatória

  criado_em       timestamptz default now(),

  unique(politico_id, id_senado)
);

CREATE INDEX idx_pol_senado_ids_politico    ON politico_senado_ids(politico_id);
CREATE INDEX idx_pol_senado_ids_senado      ON politico_senado_ids(id_senado);
CREATE INDEX idx_pol_senado_ids_confidence  ON politico_senado_ids(match_confidence);
CREATE INDEX idx_pol_senado_ids_confirmed   ON politico_senado_ids(match_confidence)
  WHERE match_confidence >= 0.90;
-- índice parcial para queries de linkagens confirmadas


-- ============================================================
-- RAW SENADO — BRONZE LAYER
-- XML bruto da API com deduplicação por SHA-256
-- Acesso restrito (RLS admin-only)
-- ============================================================

CREATE TABLE raw_senado (
  id               uuid primary key default gen_random_uuid(),

  endpoint         text not null,
  -- ex: 'senadores' | 'senador/123/votacoes'
  params           jsonb,
  -- parâmetros da requisição ex: {"dataInicio": "2025-01-01"}

  response_xml     text not null,
  checksum         text unique not null,
  -- SHA-256 do XML — ON CONFLICT previne duplicatas

  parse_status     parse_status_tipo default 'pending',
  -- pending: aguarda parsing | parsed: Silver layer atualizado
  -- error: falhou — reprocessar sem re-fetch da API

  collected_at     timestamptz not null default now(),
  parsed_at        timestamptz,
  error_message    text        -- preenchido se parse_status = 'error'
);

CREATE INDEX idx_raw_senado_endpoint       ON raw_senado(endpoint);
CREATE INDEX idx_raw_senado_parse_status   ON raw_senado(parse_status);
CREATE INDEX idx_raw_senado_pending        ON raw_senado(parse_status)
  WHERE parse_status = 'pending';
-- índice parcial para fila de parsing


-- ============================================================
-- ============================================================
-- FIM DAS TABELAS FASE 2 — SENADO FEDERAL
-- ============================================================
-- ============================================================
-- Atualiza atualizado_em em qualquer UPDATE sem intervenção
-- manual nos scripts de coleta
-- ============================================================

CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar nas tabelas com atualizado_em
CREATE TRIGGER trg_municipios_atualizado
  BEFORE UPDATE ON municipios
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_partidos_atualizado
  BEFORE UPDATE ON partidos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_politicos_atualizado
  BEFORE UPDATE ON politicos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_redes_sociais_atualizado
  BEFORE UPDATE ON redes_sociais
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_votacoes_atualizado
  BEFORE UPDATE ON votacoes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_gastos_atualizado
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_presenca_atualizado
  BEFORE UPDATE ON presenca
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_emendas_atualizado
  BEFORE UPDATE ON emendas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_discursos_atualizado
  BEFORE UPDATE ON discursos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_atuacao_atualizado
  BEFORE UPDATE ON atuacao
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_candidatos_atualizado
  BEFORE UPDATE ON candidatos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_candidaturas_historico_atualizado
  BEFORE UPDATE ON candidaturas_historico
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_perfis_atualizado
  BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_feature_flags_atualizado
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Triggers — Fase 2 (Senado Federal)
CREATE TRIGGER trg_senadores_atualizado
  BEFORE UPDATE ON senadores
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_senado_votacoes_atualizado
  BEFORE UPDATE ON senado_votacoes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_senado_materias_atualizado
  BEFORE UPDATE ON senado_materias
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_senado_comissoes_atualizado
  BEFORE UPDATE ON senado_comissoes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_senado_discursos_atualizado
  BEFORE UPDATE ON senado_discursos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_senado_sessoes_atualizado
  BEFORE UPDATE ON senado_sessoes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- ============================================================
-- FIM DO SCHEMA v2.10
--
-- Próximos passos após rodar este schema:
--   1. Verificar ENUMs criados corretamente (incluindo parse_status_tipo)
--   2. Confirmar seed de temas e feature_flags
--   3. Executar initial_load.py — popula partidos e deputados
--   4. Executar load_senado.py — popula senadores (Fase 2)
--   5. Verificar RLS com anon key e service_role key
--   6. Criar usuário admin no Supabase Auth com role 'admin'
--   7. Validar views com SELECT no Supabase Studio
--   8. Popular municipios.cd_municipio_tse via tabela de cruzamento TSE×IBGE
--
-- Verificação rápida Fase 2:
--   SELECT COUNT(*) FROM senadores;           -- ~81 (em exercício)
--   SELECT COUNT(*) FROM raw_senado;          -- >= 1
--   SELECT COUNT(*) FROM politico_senado_ids; -- ~45 confirmadas
-- ============================================================
