-- ============================================================
-- Sprint 6 — Emendas Parlamentares
-- Fontes:
--   Portal da Transparência: api.portaldatransparencia.gov.br
--     - Emendas individuais: /api-de-dados/emendas
--     - Emendas Pix:        /api-de-dados/transferencias-especiais
-- ============================================================


-- -------------------------------------------------------
-- 1. Tabela emendas
-- -------------------------------------------------------
CREATE TABLE emendas (
  id                  uuid primary key default gen_random_uuid(),

  politico_id         uuid references politicos(id) on delete set null,
  -- null quando não foi possível fazer match via codigo_siafi

  nome_parlamentar    text,
  -- nome vindo da API (fallback quando politico_id é null)

  partido             text,
  uf                  text,

  ano                 integer not null,

  tipo_emenda         text,
  -- 'individual' | 'bancada' | 'pix'

  numero_emenda       text,
  -- ex: '20240001' — código único da emenda

  funcao              text,
  -- área orçamentária: 'Saúde', 'Educação', etc.
  subfuncao           text,
  acao                text,
  -- nome da ação orçamentária

  municipio_ibge      text,
  -- código IBGE de 7 dígitos (FK soft para municipios.codigo_ibge)
  municipio_nome      text,
  uf_municipio        text,

  valor_empenhado     numeric(15,2) default 0,
  valor_liquidado     numeric(15,2) default 0,
  valor_pago          numeric(15,2) default 0,

  -- Lineage
  dado_estado         dado_estado default 'oficial',
  source_id           text,
  -- 'portal_transparencia_emendas' | 'portal_transparencia_pix'
  source_record_id    text,
  collected_at        timestamptz,

  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now(),

  UNIQUE (source_id, source_record_id)
);

CREATE INDEX idx_emendas_politico   ON emendas(politico_id);
CREATE INDEX idx_emendas_municipio  ON emendas(municipio_ibge);
CREATE INDEX idx_emendas_ano        ON emendas(ano);
CREATE INDEX idx_emendas_tipo       ON emendas(tipo_emenda);

CREATE TRIGGER set_atualizado_em_emendas
  BEFORE UPDATE ON emendas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

ALTER TABLE emendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emendas_select_public"
  ON emendas FOR SELECT USING (true);

GRANT SELECT ON emendas TO anon, authenticated;


-- -------------------------------------------------------
-- 2. Tabela fornecedores
-- -------------------------------------------------------
CREATE TABLE fornecedores (
  id                  uuid primary key default gen_random_uuid(),

  cnpj                text unique not null,
  nome_razao_social   text,
  nome_fantasia       text,

  municipio_ibge      text,
  uf                  text,

  cnae_principal      text,
  categoria           text,
  -- ex: 'saude' | 'comunicacao' | 'viagens' | 'consultoria' | 'outros'

  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now()
);

CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);

CREATE TRIGGER set_atualizado_em_fornecedores
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_select_public"
  ON fornecedores FOR SELECT USING (true);

GRANT SELECT ON fornecedores TO anon, authenticated;


-- -------------------------------------------------------
-- 3. Enriquecer municipios com faixa_populacional
-- -------------------------------------------------------
ALTER TABLE municipios
  ADD COLUMN IF NOT EXISTS faixa_populacional text;
-- Valores: 'ate_20k' | '20k_50k' | '50k_100k' | '100k_500k' | 'acima_500k'

COMMENT ON COLUMN municipios.faixa_populacional IS
  'Faixa demográfica baseada em populacao: ate_20k | 20k_50k | 50k_100k | 100k_500k | acima_500k';

-- Popular faixa_populacional para municípios que já têm populacao
UPDATE municipios
SET faixa_populacional = CASE
  WHEN populacao IS NULL         THEN NULL
  WHEN populacao <= 20000        THEN 'ate_20k'
  WHEN populacao <= 50000        THEN '20k_50k'
  WHEN populacao <= 100000       THEN '50k_100k'
  WHEN populacao <= 500000       THEN '100k_500k'
  ELSE                                'acima_500k'
END
WHERE faixa_populacional IS NULL;


-- -------------------------------------------------------
-- 4. Colunas de agregados de emendas em politicos
-- -------------------------------------------------------
ALTER TABLE politicos
  ADD COLUMN IF NOT EXISTS total_emendas_ano       numeric(15,2) default 0,
  ADD COLUMN IF NOT EXISTS total_emendas_historico numeric(15,2) default 0;

COMMENT ON COLUMN politicos.total_emendas_ano IS
  'Soma de valor_pago das emendas do ano corrente — atualizado pelo ETL';
COMMENT ON COLUMN politicos.total_emendas_historico IS
  'Soma de valor_pago de todas as emendas históricas — atualizado pelo ETL';


-- -------------------------------------------------------
-- 5. Views analíticas
-- -------------------------------------------------------

-- Ranking de parlamentares por total de emendas pagas
CREATE OR REPLACE VIEW v_ranking_emendas AS
SELECT
  p.id,
  p.slug,
  p.nome_eleitoral,
  p.uf,
  p.cargo,
  pt.sigla                          AS partido,
  COALESCE(SUM(e.valor_pago), 0)   AS total_pago,
  COALESCE(SUM(e.valor_empenhado), 0) AS total_empenhado,
  COUNT(*)                          AS qtd_emendas,
  COUNT(DISTINCT e.municipio_ibge)  AS municipios_atendidos,
  MAX(e.ano)                        AS ultimo_ano
FROM politicos p
JOIN emendas e     ON e.politico_id = p.id
LEFT JOIN partidos pt ON pt.id = p.partido_id
GROUP BY p.id, p.slug, p.nome_eleitoral, p.uf, p.cargo, pt.sigla;

GRANT SELECT ON v_ranking_emendas TO anon, authenticated;


-- Emendas por município com per capita
CREATE OR REPLACE VIEW v_emendas_municipio AS
SELECT
  m.codigo_ibge,
  m.nome,
  m.uf,
  m.populacao,
  m.faixa_populacional,
  COALESCE(SUM(e.valor_pago), 0)                                  AS total_emendas,
  CASE
    WHEN m.populacao > 0
    THEN ROUND(COALESCE(SUM(e.valor_pago), 0) / m.populacao, 2)
    ELSE 0
  END                                                              AS per_capita,
  COUNT(DISTINCT e.politico_id)                                   AS qtd_parlamentares,
  COUNT(*)                                                         AS qtd_emendas
FROM municipios m
LEFT JOIN emendas e ON e.municipio_ibge = m.codigo_ibge::text
GROUP BY m.codigo_ibge, m.nome, m.uf, m.populacao, m.faixa_populacional;

GRANT SELECT ON v_emendas_municipio TO anon, authenticated;


-- Fornecedores comuns entre gabinetes (suspeita de concentração)
CREATE OR REPLACE VIEW v_fornecedores_comuns AS
SELECT
  g.cnpj_cpf                          AS cnpj,
  g.fornecedor,
  COUNT(DISTINCT g.politico_id)        AS qtd_parlamentares,
  SUM(g.valor)                         AS total_recebido,
  array_agg(DISTINCT g.source_id)      AS fontes
FROM gastos g
WHERE g.cnpj_cpf IS NOT NULL
  AND LENGTH(g.cnpj_cpf) = 14  -- apenas CNPJs (14 dígitos), exclui CPFs
GROUP BY g.cnpj_cpf, g.fornecedor
HAVING COUNT(DISTINCT g.politico_id) > 1
ORDER BY qtd_parlamentares DESC, total_recebido DESC;

GRANT SELECT ON v_fornecedores_comuns TO anon, authenticated;
