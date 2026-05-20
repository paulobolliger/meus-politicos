-- ================================================================
-- Sprint: /estado/[sigla] — Inteligência Política Estadual
-- Tabelas para as 12 seções da página de estado
-- ================================================================

-- -------------------------------------------------------
-- 1. estados_info — dados institucionais básicos
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_info (
  id               uuid primary key default gen_random_uuid(),
  sigla            char(2) unique not null,
  nome             text not null,
  capital          text not null,
  regiao           text not null, -- 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'
  area_km2         numeric(12, 2),
  gentilico        text,
  fuso             text,
  site_gov         text,
  criado_em        timestamptz default now(),
  atualizado_em    timestamptz default now()
);

-- -------------------------------------------------------
-- 2. estados_economia — indicadores econômicos anuais
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_economia (
  id                     uuid primary key default gen_random_uuid(),
  sigla                  char(2) not null references estados_info(sigla) on delete cascade,
  ano                    integer not null,
  pib_total_mi           numeric(18, 2),  -- R$ milhões
  pib_per_capita         numeric(14, 2),  -- R$
  pib_variacao_pct       numeric(5, 2),
  pib_agro_pct           numeric(5, 2),
  pib_industria_pct      numeric(5, 2),
  pib_servicos_pct       numeric(5, 2),
  populacao              bigint,
  idh                    numeric(4, 3),
  idh_ranking_nacional   integer,
  arrecadacao_icms_mi    numeric(18, 2),
  arrecadacao_total_mi   numeric(18, 2),
  orcamento_total_mi     numeric(18, 2),
  divida_publica_mi      numeric(18, 2),
  exportacoes_usd_mi     numeric(18, 2),
  desemprego_pct         numeric(5, 2),
  gini                   numeric(4, 3),
  ranking_pib_nacional   integer,
  source_id              text,
  collected_at           timestamptz,
  criado_em              timestamptz default now(),
  atualizado_em          timestamptz default now(),
  UNIQUE (sigla, ano)
);

-- -------------------------------------------------------
-- 3. estados_governos — histórico de governadores
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_governos (
  id               uuid primary key default gen_random_uuid(),
  sigla            char(2) not null references estados_info(sigla) on delete cascade,
  nome_governador  text not null,
  nome_vice        text,
  partido_sigla    text,
  politico_id      uuid,  -- soft FK para politicos.id (sem constraint para compatibilidade)
  mandato_inicio   date not null,
  mandato_fim      date,
  is_atual         boolean default false,
  situacao         text default 'ativo',
  -- 'ativo' | 'encerrado' | 'cassado' | 'falecido' | 'renunciou' | 'interino'
  foto_url         text,
  criado_em        timestamptz default now(),
  atualizado_em    timestamptz default now()
);

CREATE INDEX idx_estados_governos_sigla  ON estados_governos(sigla);
CREATE INDEX idx_estados_governos_atual  ON estados_governos(sigla) WHERE is_atual = true;

-- -------------------------------------------------------
-- 4. estados_ale — Assembleia Legislativa Estadual
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_ale (
  id                  uuid primary key default gen_random_uuid(),
  sigla               char(2) not null references estados_info(sigla) on delete cascade,
  legislatura         integer not null,
  total_deputados     integer,
  presidente_nome     text,
  presidente_partido  text,
  site_oficial        text,
  endereco            text,
  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now(),
  UNIQUE (sigla, legislatura)
);

-- -------------------------------------------------------
-- 5. estados_pacto_federativo — transferências intergovernamentais
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_pacto_federativo (
  id                          uuid primary key default gen_random_uuid(),
  sigla                       char(2) not null references estados_info(sigla) on delete cascade,
  ano                         integer not null,
  -- Recebimentos da União (R$ milhões)
  fpe_mi                      numeric(18, 2) default 0,
  sus_mi                      numeric(18, 2) default 0,
  fundeb_mi                   numeric(18, 2) default 0,
  outras_transferencias_mi    numeric(18, 2) default 0,
  total_recebido_mi           numeric(18, 2) default 0,
  -- Contribuições ao governo federal (R$ milhões, estimativa)
  ir_arrecadado_mi            numeric(18, 2) default 0,
  ipi_arrecadado_mi           numeric(18, 2) default 0,
  previdencia_mi              numeric(18, 2) default 0,
  total_enviado_mi            numeric(18, 2) default 0,
  -- Saldo calculado
  saldo_federativo_mi         numeric(18, 2) generated always as (total_recebido_mi - total_enviado_mi) stored,
  tipo                        text generated always as (
    CASE WHEN total_recebido_mi > total_enviado_mi THEN 'receptor' ELSE 'doador' END
  ) stored,
  source_id                   text,
  collected_at                timestamptz,
  criado_em                   timestamptz default now(),
  atualizado_em               timestamptz default now(),
  UNIQUE (sigla, ano)
);

-- -------------------------------------------------------
-- 6. estados_tribunais — TCE, TJ, MP, Defensoria
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_tribunais (
  id              uuid primary key default gen_random_uuid(),
  sigla           char(2) not null references estados_info(sigla) on delete cascade,
  tipo            text not null,
  -- 'tj' | 'tce' | 'mp' | 'dp' | 'trt' | 'tre'
  nome_completo   text not null,
  presidente      text,
  sede            text,
  site_oficial    text,
  membros_total   integer,
  ano_fundacao    integer,
  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now(),
  UNIQUE (sigla, tipo)
);

-- -------------------------------------------------------
-- 7. estados_timeline — eventos históricos e políticos
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_timeline (
  id          uuid primary key default gen_random_uuid(),
  sigla       char(2) not null references estados_info(sigla) on delete cascade,
  ano         integer not null,
  mes         integer,
  titulo      text not null,
  descricao   text,
  tipo        text,
  -- 'eleicao' | 'escandalo' | 'obra' | 'crise' | 'privatizacao' | 'reforma' | 'desastre'
  impacto     text default 'neutro', -- 'positivo' | 'negativo' | 'neutro'
  criado_em   timestamptz default now()
);

CREATE INDEX idx_estados_timeline_sigla ON estados_timeline(sigla, ano DESC);

-- -------------------------------------------------------
-- 8. Seed: estados_info — todos os 27 estados
-- -------------------------------------------------------
INSERT INTO estados_info (sigla, nome, capital, regiao, area_km2, gentilico, fuso) VALUES
  ('AC', 'Acre',                  'Rio Branco',       'Norte',        164123.0,   'Acriano',            'UTC-5'),
  ('AL', 'Alagoas',               'Maceió',           'Nordeste',      27779.0,   'Alagoano',           'UTC-3'),
  ('AM', 'Amazonas',              'Manaus',           'Norte',       1559159.0,   'Amazonense',         'UTC-4'),
  ('AP', 'Amapá',                 'Macapá',           'Norte',        142829.0,   'Amapaense',          'UTC-3'),
  ('BA', 'Bahia',                 'Salvador',         'Nordeste',     564733.0,   'Baiano',             'UTC-3'),
  ('CE', 'Ceará',                 'Fortaleza',        'Nordeste',     148921.0,   'Cearense',           'UTC-3'),
  ('DF', 'Distrito Federal',      'Brasília',         'Centro-Oeste',   5780.0,   'Candango',           'UTC-3'),
  ('ES', 'Espírito Santo',        'Vitória',          'Sudeste',       46074.0,   'Capixaba',           'UTC-3'),
  ('GO', 'Goiás',                 'Goiânia',          'Centro-Oeste', 340111.0,   'Goiano',             'UTC-3'),
  ('MA', 'Maranhão',              'São Luís',         'Nordeste',     331983.0,   'Maranhense',         'UTC-3'),
  ('MG', 'Minas Gerais',          'Belo Horizonte',   'Sudeste',      586522.0,   'Mineiro',            'UTC-3'),
  ('MS', 'Mato Grosso do Sul',    'Campo Grande',     'Centro-Oeste', 357145.0,   'Sul-mato-grossense', 'UTC-4'),
  ('MT', 'Mato Grosso',           'Cuiabá',           'Centro-Oeste', 903208.0,   'Mato-grossense',     'UTC-4'),
  ('PA', 'Pará',                  'Belém',            'Norte',       1247950.0,   'Paraense',           'UTC-3'),
  ('PB', 'Paraíba',               'João Pessoa',      'Nordeste',      56439.0,   'Paraibano',          'UTC-3'),
  ('PE', 'Pernambuco',            'Recife',           'Nordeste',      98076.0,   'Pernambucano',       'UTC-3'),
  ('PI', 'Piauí',                 'Teresina',         'Nordeste',     251756.0,   'Piauiense',          'UTC-3'),
  ('PR', 'Paraná',                'Curitiba',         'Sul',          199307.0,   'Paranaense',         'UTC-3'),
  ('RJ', 'Rio de Janeiro',        'Rio de Janeiro',   'Sudeste',       43780.0,   'Fluminense',         'UTC-3'),
  ('RN', 'Rio Grande do Norte',   'Natal',            'Nordeste',      52811.0,   'Potiguar',           'UTC-3'),
  ('RO', 'Rondônia',              'Porto Velho',      'Norte',        237765.0,   'Rondoniense',        'UTC-4'),
  ('RR', 'Roraima',               'Boa Vista',        'Norte',        224299.0,   'Roraimense',         'UTC-4'),
  ('RS', 'Rio Grande do Sul',     'Porto Alegre',     'Sul',          281748.0,   'Gaúcho',             'UTC-3'),
  ('SC', 'Santa Catarina',        'Florianópolis',    'Sul',           95736.0,   'Catarinense',        'UTC-3'),
  ('SE', 'Sergipe',               'Aracaju',          'Nordeste',      21915.0,   'Sergipano',          'UTC-3'),
  ('SP', 'São Paulo',             'São Paulo',        'Sudeste',      248219.0,   'Paulista',           'UTC-3'),
  ('TO', 'Tocantins',             'Palmas',           'Norte',        277621.0,   'Tocantinense',       'UTC-3')
ON CONFLICT (sigla) DO NOTHING;

-- -------------------------------------------------------
-- 9. Seed: estados_economia — dados IBGE 2022/2023
--    Fonte: IBGE Contas Regionais 2022 + estimativas 2023
-- -------------------------------------------------------
INSERT INTO estados_economia
  (sigla, ano, pib_total_mi, pib_per_capita, populacao, idh, idh_ranking_nacional, ranking_pib_nacional,
   pib_agro_pct, pib_industria_pct, pib_servicos_pct, desemprego_pct)
VALUES
  ('SP', 2023, 2815000,  63500,  44411238, 0.826,  1, 1, 3.0, 22.0, 75.0,  7.1),
  ('RJ', 2023,  892000,  51200,  17463349, 0.796,  5, 2, 1.0, 22.0, 77.0, 10.2),
  ('MG', 2023,  760000,  36000,  21292666, 0.787,  8, 3, 8.0, 25.0, 67.0,  7.9),
  ('RS', 2023,  551000,  48000,  11466630, 0.787,  7, 4, 9.0, 24.0, 67.0,  5.8),
  ('PR', 2023,  532000,  45800,  11597484, 0.792,  6, 5,10.0, 26.0, 64.0,  5.0),
  ('BA', 2023,  319000,  21200,  14985284, 0.714, 21, 6,12.0, 19.0, 69.0, 13.8),
  ('SC', 2023,  402000,  55100,   7338473, 0.808,  3, 7, 8.0, 29.0, 63.0,  4.2),
  ('GO', 2023,  239000,  32600,   7381770, 0.764, 13, 8,18.0, 21.0, 61.0,  6.2),
  ('DF', 2023,  274000,  91700,   3094325, 0.824,  2, 9, 0.5,  7.0, 92.5,  9.8),
  ('PE', 2023,  215000,  22400,   9674793, 0.727, 20, 10,6.0, 16.0, 78.0, 14.5),
  ('AM', 2023,  155000,  36000,   4269995, 0.708, 23, 11,5.0, 30.0, 65.0, 10.1),
  ('MT', 2023,  201000,  57700,   3784239, 0.757, 15, 12,38.0, 18.0, 44.0,  5.3),
  ('CE', 2023,  179000,  19600,   9240580, 0.745, 17, 13,5.0, 16.0, 79.0, 14.1),
  ('ES', 2023,  172000,  41500,   4108508, 0.776, 11, 14,4.0, 22.0, 74.0,  8.1),
  ('PA', 2023,  162000,  18200,   8777124, 0.698, 25, 15,15.0, 22.0, 63.0, 11.0),
  ('MS', 2023,  162000,  57300,   2833742, 0.769, 12, 16,27.0, 18.0, 55.0,  5.8),
  ('MA', 2023,  102000,  14000,   7374980, 0.683, 27, 17,16.0, 14.0, 70.0, 12.9),
  ('RN', 2023,   78000,  21500,   3560903, 0.754, 16, 18,9.0, 16.0, 75.0, 14.1),
  ('PB', 2023,   72000,  17700,   4059905, 0.744, 18, 19,7.0, 14.0, 79.0, 13.8),
  ('AL', 2023,   59000,  17200,   3365351, 0.683, 26, 20,9.0, 13.0, 78.0, 16.2),
  ('PI', 2023,   60000,  17600,   3289290, 0.716, 20, 21,18.0, 12.0, 70.0, 12.5),
  ('SE', 2023,   51000,  21200,   2338474, 0.738, 19, 22,6.0, 14.0, 80.0, 14.8),
  ('RO', 2023,   57000,  30700,   1815278, 0.736, 19, 23,28.0, 16.0, 56.0,  6.7),
  ('TO', 2023,   45000,  27800,   1590248, 0.745, 17, 24,22.0, 12.0, 66.0,  8.4),
  ('AC', 2023,   20000,  22200,    906876, 0.719, 20, 25,12.0, 11.0, 77.0, 10.2),
  ('AP', 2023,   20000,  22900,    877613, 0.708, 23, 26,4.0,  9.0, 87.0, 14.3),
  ('RR', 2023,   17000,  24700,    694049, 0.707, 24, 27,8.0, 10.0, 82.0, 13.2)
ON CONFLICT (sigla, ano) DO NOTHING;

-- -------------------------------------------------------
-- 10. Seed: estados_pacto_federativo — dados STN 2023 (estimativas públicas)
--     Fonte: STN SIAFI + STN FPE + TCU
-- -------------------------------------------------------
INSERT INTO estados_pacto_federativo
  (sigla, ano, fpe_mi, sus_mi, fundeb_mi, total_recebido_mi,
   ir_arrecadado_mi, ipi_arrecadado_mi, previdencia_mi, total_enviado_mi)
VALUES
  -- DOADORES LÍQUIDOS (grandes economias)
  ('SP', 2023,  9500, 22000, 18000,  55000, 260000, 35000, 180000, 480000),
  ('RJ', 2023,  4800, 12000,  7500,  26000,  95000, 10000,  65000, 175000),
  ('MG', 2023,  8200, 15000, 12000,  38000,  65000,  8000,  55000, 132000),
  ('RS', 2023,  6100, 10000,  8500,  27000,  45000,  5500,  38000,  92000),
  ('PR', 2023,  5800,  9500,  8000,  26000,  42000,  5000,  35000,  86000),
  ('SC', 2023,  3900,  7000,  5500,  19000,  32000,  4000,  28000,  66000),
  ('DF', 2023,   800,  3500,  2000,   8000,  28000,  1500,  22000,  54000),
  ('ES', 2023,  2200,  5000,  3500,  12000,  14000,  2000,  12000,  30000),
  ('GO', 2023,  4200,  7500,  5500,  20000,  18000,  2500,  14000,  38000),
  ('MT', 2023,  2800,  4500,  3500,  13000,  15000,  1800,  10000,  30000),
  ('MS', 2023,  2200,  3800,  2800,  10000,  11000,  1200,   8000,  23000),
  -- RECEPTORES LÍQUIDOS (dependem da União)
  ('BA', 2023, 14500, 20000, 14000,  55000,  18000,  2000,  14000,  38000),
  ('CE', 2023, 10800, 14000,  9500,  38000,  12000,  1500,   9000,  26000),
  ('PE', 2023,  9200, 14000,  8500,  36000,  14000,  1800,  10000,  30000),
  ('MA', 2023, 11500, 12000,  8500,  36000,   5500,   600,   4000,  11500),
  ('PA', 2023, 10200, 12000,  8000,  34000,   9000,  1000,   6500,  19000),
  ('PB', 2023,  7200,  8500,  5800,  25000,   4200,   450,   3200,   8500),
  ('PI', 2023,  7500,  8000,  5500,  24000,   3200,   350,   2500,   6500),
  ('RN', 2023,  6500,  8000,  5200,  22000,   4500,   500,   3500,   9500),
  ('AL', 2023,  7200,  7500,  4800,  22000,   3000,   300,   2200,   6200),
  ('SE', 2023,  4200,  5000,  3200,  14000,   3200,   350,   2500,   6500),
  ('AM', 2023,  5800,  9000,  5500,  23000,   8500,  1800,   6000,  18000),
  ('AC', 2023,  4800,  3000,  2000,  12000,    900,   100,    700,   1900),
  ('AP', 2023,  3800,  2500,  1800,  10000,    800,    90,    600,   1700),
  ('RO', 2023,  3200,  3500,  2200,  11000,   2500,   280,   1800,   5100),
  ('RR', 2023,  3500,  2000,  1500,   9000,    700,    80,    500,   1500),
  ('TO', 2023,  4500,  3500,  2500,  13000,   2000,   220,   1500,   4200)
ON CONFLICT (sigla, ano) DO NOTHING;

-- -------------------------------------------------------
-- 11. RLS + grants
-- -------------------------------------------------------
ALTER TABLE estados_info              ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_economia          ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_governos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_ale               ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_pacto_federativo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_tribunais         ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_timeline          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estados_info_public"     ON estados_info             FOR SELECT USING (true);
CREATE POLICY "estados_econ_public"     ON estados_economia         FOR SELECT USING (true);
CREATE POLICY "estados_gov_public"      ON estados_governos         FOR SELECT USING (true);
CREATE POLICY "estados_ale_public"      ON estados_ale              FOR SELECT USING (true);
CREATE POLICY "estados_pacto_public"    ON estados_pacto_federativo FOR SELECT USING (true);
CREATE POLICY "estados_trib_public"     ON estados_tribunais        FOR SELECT USING (true);
CREATE POLICY "estados_timeline_public" ON estados_timeline         FOR SELECT USING (true);

GRANT SELECT ON
  estados_info, estados_economia, estados_governos, estados_ale,
  estados_pacto_federativo, estados_tribunais, estados_timeline
TO anon, authenticated;
