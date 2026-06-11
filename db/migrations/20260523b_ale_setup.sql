-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Setup completo para ETL de Assembleias Legislativas Estaduais
-- Data: 2026-05-23b
-- Inclui:
--   1. politicos.id_ale            → chave de ligação com APIs das ALEs
--   2. proposicoes.id_externo_ale  → ID da proposição na ALE de origem
--   3. ale_sessoes                 → sessões plenárias e de comissões
--   4. ale_presencas               → presença individual por sessão
--   5. view v_presenca_deputado_estadual
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 0. Garantir PK em politicos.id (necessária para FK em ale_presencas) ──────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'politicos'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE politicos ADD PRIMARY KEY (id);
  END IF;
END
$$;

-- ── 1. politicos.id_ale ───────────────────────────────────────────────────────
ALTER TABLE politicos
  ADD COLUMN IF NOT EXISTS id_ale text;

CREATE INDEX IF NOT EXISTS idx_politicos_id_ale
  ON politicos(id_ale)
  WHERE id_ale IS NOT NULL;

COMMENT ON COLUMN politicos.id_ale IS 'ID do parlamentar na API da Assembleia Legislativa Estadual';

-- ── 2. proposicoes.id_externo_ale ────────────────────────────────────────────
ALTER TABLE proposicoes
  ADD COLUMN IF NOT EXISTS id_externo_ale text;

COMMENT ON COLUMN proposicoes.id_externo_ale IS 'ID da proposição na API da ALE de origem (almg, alep, etc.)';

-- ── 3. Tabela: ale_sessoes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ale_sessoes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  uf                char(2)     NOT NULL,
  fonte             text        NOT NULL,
  id_externo        text        NOT NULL,
  data              date        NOT NULL,
  hora_inicio       time,
  tipo              text        NOT NULL DEFAULT 'plenario',
  nome_sessao       text,
  numero_sessao     text,
  legislatura       integer,
  situacao          text,
  link_ata          text,
  dado_estado       text        NOT NULL DEFAULT 'oficial',
  source_id         text        NOT NULL,
  source_record_id  text        NOT NULL,
  collected_at      timestamptz,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  atualizado_em     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, source_record_id)
);

CREATE INDEX IF NOT EXISTS idx_ale_sessoes_uf    ON ale_sessoes(uf);
CREATE INDEX IF NOT EXISTS idx_ale_sessoes_data  ON ale_sessoes(data);
CREATE INDEX IF NOT EXISTS idx_ale_sessoes_fonte ON ale_sessoes(fonte);

-- ── 4. Tabela: ale_presencas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ale_presencas (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  politico_id       uuid        NOT NULL REFERENCES politicos(id) ON DELETE CASCADE,
  sessao_id         uuid        REFERENCES ale_sessoes(id) ON DELETE SET NULL,
  data              date        NOT NULL,
  uf                char(2)     NOT NULL,
  tipo_sessao       text        NOT NULL DEFAULT 'plenario',
  presente          boolean     NOT NULL,
  justificativa     text,
  fonte             text        NOT NULL,
  dado_estado       text        NOT NULL DEFAULT 'oficial',
  source_id         text        NOT NULL,
  source_record_id  text        NOT NULL,
  collected_at      timestamptz,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, source_record_id)
);

CREATE INDEX IF NOT EXISTS idx_ale_presencas_politico ON ale_presencas(politico_id);
CREATE INDEX IF NOT EXISTS idx_ale_presencas_data     ON ale_presencas(data);
CREATE INDEX IF NOT EXISTS idx_ale_presencas_uf       ON ale_presencas(uf);

-- ── 5. RLS — leitura pública ──────────────────────────────────────────────────
ALTER TABLE ale_sessoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ale_presencas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ale_sessoes' AND policyname = 'ale_sessoes_select_public'
  ) THEN
    CREATE POLICY "ale_sessoes_select_public"
      ON ale_sessoes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ale_presencas' AND policyname = 'ale_presencas_select_public'
  ) THEN
    CREATE POLICY "ale_presencas_select_public"
      ON ale_presencas FOR SELECT USING (true);
  END IF;
END
$$;

-- ── 6. View: v_presenca_deputado_estadual ─────────────────────────────────────
CREATE OR REPLACE VIEW v_presenca_deputado_estadual AS
SELECT
  p.politico_id,
  EXTRACT(YEAR FROM p.data)::integer AS ano,
  p.uf,
  COUNT(*)                           AS total_sessoes,
  COUNT(*) FILTER (WHERE p.presente) AS sessoes_presente,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE p.presente) / NULLIF(COUNT(*), 0),
    1
  )                                  AS presenca_pct
FROM ale_presencas p
GROUP BY p.politico_id, EXTRACT(YEAR FROM p.data), p.uf;

-- ── Comentários ───────────────────────────────────────────────────────────────
COMMENT ON TABLE ale_sessoes   IS 'Sessões plenárias e de comissões das Assembleias Legislativas Estaduais';
COMMENT ON TABLE ale_presencas IS 'Registro individual de presença de cada deputado estadual em cada sessão';
COMMENT ON VIEW  v_presenca_deputado_estadual IS 'Percentual de presença calculado por deputado e ano';
