-- ============================================================
-- Glossário político — termos explicados em linguagem cidadã
-- Usado no (site) como página dedicada e no (app) via tooltip inline
-- ============================================================

CREATE TABLE IF NOT EXISTS glossario (
  id                  uuid primary key default gen_random_uuid(),

  slug                text unique not null,
  -- ex: 'projeto-de-lei', 'cota-parlamentar'

  termo               text unique not null,
  -- ex: 'Projeto de Lei', 'Cota Parlamentar'

  definicao_simples   text not null,
  -- (site) linguagem cidadã — máx 2 parágrafos

  definicao_tecnica   text,
  -- (app) linguagem técnica com referências legais

  categoria           text not null,
  -- 'legislativo' | 'eleitoral' | 'financeiro' | 'institucional'

  exemplo             text,
  -- frase de exemplo em contexto real

  termos_relacionados text[],
  -- slugs de outros termos do glossário

  criado_em           timestamptz default now(),
  atualizado_em       timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_glossario_categoria ON glossario(categoria);
CREATE INDEX IF NOT EXISTS idx_glossario_slug      ON glossario(slug);

DO $$ BEGIN
  CREATE TRIGGER set_atualizado_em_glossario
    BEFORE UPDATE ON glossario
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE glossario ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "glossario_select_public"
    ON glossario FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT ON glossario TO anon, authenticated;
