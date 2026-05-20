-- ============================================================
-- Proposições legislativas (PLs, PECs, PLPs, PDLs, MPVs)
-- Fontes: dadosabertos.camara.leg.br/api/v2/proposicoes
--         dadosabertos.senado.leg.br (fase futura)
-- ============================================================

CREATE TABLE proposicoes (
  id                  uuid primary key default gen_random_uuid(),

  -- Identificação nas câmaras
  id_camara           integer unique,
  id_senado           integer unique,

  -- URL canônica no site (gerada no ETL)
  slug                text unique not null,
  -- ex: 'pl-1234-2024'

  tipo                text not null,
  -- 'PL' | 'PEC' | 'PLP' | 'PDL' | 'MPV' | 'PDS' | 'PLV'
  numero              text not null,
  ano                 integer not null,

  ementa              text,
  ementa_simples      text,
  -- Versão simplificada gerada por IA para o site público (linguagem cidadã)

  situacao            text,
  -- texto livre da API — ex: 'Em tramitação na Câmara dos Deputados'

  casa_origem         text,
  -- 'camara' | 'senado'

  data_apresentacao   date,

  link_camara         text,
  link_senado         text,

  -- IA
  ia_processado       boolean default false,
  ia_gerado_em        timestamptz,
  ia_modelo           text,

  -- Lineage
  dado_estado         dado_estado default 'oficial',
  source_id           text,
  source_record_id    text,
  collected_at        timestamptz,

  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now(),

  UNIQUE (tipo, numero, ano)
);

CREATE INDEX idx_proposicoes_tipo       ON proposicoes(tipo);
CREATE INDEX idx_proposicoes_ano        ON proposicoes(ano desc);
CREATE INDEX idx_proposicoes_situacao   ON proposicoes(situacao);
CREATE INDEX idx_proposicoes_data       ON proposicoes(data_apresentacao desc);
CREATE INDEX idx_proposicoes_ia         ON proposicoes(ia_processado) WHERE ia_processado = false;


CREATE TABLE proposicao_autores (
  id              uuid primary key default gen_random_uuid(),

  proposicao_id   uuid not null references proposicoes(id) on delete cascade,
  politico_id     uuid references politicos(id) on delete set null,
  -- null quando o autor não tem perfil no sistema (ex: bancada, comissão)

  nome            text not null,
  cargo           text,
  partido         text,
  uf              text,

  criado_em       timestamptz default now()
);

CREATE INDEX idx_prop_autores_proposicao ON proposicao_autores(proposicao_id);
CREATE INDEX idx_prop_autores_politico   ON proposicao_autores(politico_id);


-- Trigger para atualizar atualizado_em
CREATE TRIGGER set_atualizado_em_proposicoes
  BEFORE UPDATE ON proposicoes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- RLS — leitura pública para ambas as tabelas
ALTER TABLE proposicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposicoes_select_public"
  ON proposicoes FOR SELECT USING (true);

ALTER TABLE proposicao_autores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposicao_autores_select_public"
  ON proposicao_autores FOR SELECT USING (true);


-- Grant para anon e authenticated (Supabase)
GRANT SELECT ON proposicoes        TO anon, authenticated;
GRANT SELECT ON proposicao_autores TO anon, authenticated;
