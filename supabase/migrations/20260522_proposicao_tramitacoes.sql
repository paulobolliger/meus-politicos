-- Histórico de tramitação de proposições (Câmara dos Deputados)
CREATE TABLE IF NOT EXISTS proposicao_tramitacoes (
  id                   uuid primary key default gen_random_uuid(),
  id_camara            integer not null,   -- proposicoes.id_camara (sem FK, sem PK na origem)
  sequencia            integer not null,
  data_hora            timestamptz,
  sigla_orgao          text,
  descricao_tramitacao text,
  cod_tipo_tramitacao  integer,
  descricao_situacao   text,
  cod_situacao         integer,
  despacho             text,
  regime               text,
  ambito               text,
  url_documento        text,
  criado_em            timestamptz default now(),

  UNIQUE (id_camara, sequencia)
);

CREATE INDEX IF NOT EXISTS idx_tramitacoes_id_camara ON proposicao_tramitacoes(id_camara);
CREATE INDEX IF NOT EXISTS idx_tramitacoes_data      ON proposicao_tramitacoes(data_hora DESC);

-- RLS: leitura pública
ALTER TABLE proposicao_tramitacoes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'proposicao_tramitacoes' AND policyname = 'tramitacoes_select_public'
  ) THEN
    CREATE POLICY "tramitacoes_select_public" ON proposicao_tramitacoes
      FOR SELECT USING (true);
  END IF;
END
$$;
