-- ============================================================
-- Fix Sprint 6 — adaptar tabela emendas existente
-- A tabela emendas já existia no schema inicial com estrutura
-- minimalista. Esta migration adiciona as colunas faltantes
-- e recria as views com os campos corretos.
-- ============================================================

-- -------------------------------------------------------
-- 1. Adicionar colunas faltantes na tabela emendas
-- -------------------------------------------------------
ALTER TABLE emendas
  ADD COLUMN IF NOT EXISTS nome_parlamentar    text,
  ADD COLUMN IF NOT EXISTS partido             text,
  ADD COLUMN IF NOT EXISTS uf                  text,
  ADD COLUMN IF NOT EXISTS tipo_emenda         text,
  ADD COLUMN IF NOT EXISTS numero_emenda       text,
  ADD COLUMN IF NOT EXISTS funcao              text,
  ADD COLUMN IF NOT EXISTS subfuncao           text,
  ADD COLUMN IF NOT EXISTS acao                text,
  ADD COLUMN IF NOT EXISTS municipio_ibge      text,
  ADD COLUMN IF NOT EXISTS municipio_nome      text,
  ADD COLUMN IF NOT EXISTS uf_municipio        text,
  ADD COLUMN IF NOT EXISTS valor_empenhado     numeric(15,2) default 0,
  ADD COLUMN IF NOT EXISTS valor_liquidado     numeric(15,2) default 0,
  ADD COLUMN IF NOT EXISTS valor_pago          numeric(15,2) default 0,
  ADD COLUMN IF NOT EXISTS source_id           text,
  ADD COLUMN IF NOT EXISTS source_record_id    text,
  ADD COLUMN IF NOT EXISTS collected_at        timestamptz;

-- politico_id já existe mas era NOT NULL — relaxar para permitir null
-- (quando não encontramos match pelo codigo_siafi)
ALTER TABLE emendas ALTER COLUMN politico_id DROP NOT NULL;

-- valor já existe — manter (usaremos valor_pago como campo principal no ETL)

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_emendas_municipio  ON emendas(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_emendas_tipo       ON emendas(tipo_emenda);

-- UNIQUE para upserts do ETL
ALTER TABLE emendas
  ADD CONSTRAINT IF NOT EXISTS emendas_source_key UNIQUE (source_id, source_record_id);


-- -------------------------------------------------------
-- 2. Adicionar colunas de agregados em politicos
--    (pode já ter sido aplicado na migration anterior)
-- -------------------------------------------------------
ALTER TABLE politicos
  ADD COLUMN IF NOT EXISTS total_emendas_ano       numeric(15,2) default 0,
  ADD COLUMN IF NOT EXISTS total_emendas_historico numeric(15,2) default 0;


-- -------------------------------------------------------
-- 3. Recriar views com os campos corretos
-- -------------------------------------------------------

-- Ranking de parlamentares por emendas pagas
DROP VIEW IF EXISTS v_ranking_emendas;
CREATE VIEW v_ranking_emendas AS
SELECT
  p.id,
  p.slug,
  p.nome_eleitoral,
  p.uf,
  p.cargo,
  pt.sigla                                      AS partido,
  COALESCE(SUM(e.valor_pago), 0)               AS total_pago,
  COALESCE(SUM(e.valor_empenhado), 0)          AS total_empenhado,
  COUNT(*)                                      AS qtd_emendas,
  COUNT(DISTINCT e.municipio_ibge)              AS municipios_atendidos,
  MAX(e.ano)                                    AS ultimo_ano
FROM politicos p
JOIN emendas e     ON e.politico_id = p.id
LEFT JOIN partidos pt ON pt.id = p.partido_id
GROUP BY p.id, p.slug, p.nome_eleitoral, p.uf, p.cargo, pt.sigla;

GRANT SELECT ON v_ranking_emendas TO anon, authenticated;


-- Emendas por município com per capita
DROP VIEW IF EXISTS v_emendas_municipio;
CREATE VIEW v_emendas_municipio AS
SELECT
  m.codigo_ibge,
  m.nome,
  m.uf,
  m.populacao,
  m.faixa_populacional,
  COALESCE(SUM(e.valor_pago), 0)                              AS total_emendas,
  CASE
    WHEN m.populacao > 0
    THEN ROUND(COALESCE(SUM(e.valor_pago), 0) / m.populacao, 2)
    ELSE 0
  END                                                          AS per_capita,
  COUNT(DISTINCT e.politico_id)                               AS qtd_parlamentares,
  COUNT(*)                                                     AS qtd_emendas
FROM municipios m
LEFT JOIN emendas e ON e.municipio_ibge = m.codigo_ibge::text
GROUP BY m.codigo_ibge, m.nome, m.uf, m.populacao, m.faixa_populacional;

GRANT SELECT ON v_emendas_municipio TO anon, authenticated;


-- Fornecedores comuns entre gabinetes
DROP VIEW IF EXISTS v_fornecedores_comuns;
CREATE VIEW v_fornecedores_comuns AS
SELECT
  g.cnpj_cpf                          AS cnpj,
  g.fornecedor,
  COUNT(DISTINCT g.politico_id)        AS qtd_parlamentares,
  SUM(g.valor)                         AS total_recebido,
  array_agg(DISTINCT g.source_id)      AS fontes
FROM gastos g
WHERE g.cnpj_cpf IS NOT NULL
  AND LENGTH(g.cnpj_cpf) = 14
GROUP BY g.cnpj_cpf, g.fornecedor
HAVING COUNT(DISTINCT g.politico_id) > 1
ORDER BY qtd_parlamentares DESC, total_recebido DESC;

GRANT SELECT ON v_fornecedores_comuns TO anon, authenticated;
