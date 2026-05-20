-- ============================================================
-- Sprint 7b — Admin Interno
-- Tabelas: admin_logs, analytics_eventos, feature_flags
-- Coluna:  perfis.role
-- ============================================================

ALTER TABLE perfis ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid,
  -- soft FK para perfis.id — sem constraint para compatibilidade
  acao text not null,
  entidade text,
  entidade_id text,
  detalhe jsonb,
  criado_em timestamptz default now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  descricao text,
  ativo boolean default false,
  rollout_pct integer default 0,
  atualizado_em timestamptz default now()
);

-- Se a tabela já existia com schema antigo (coluna 'nome'), migra para 'slug'
ALTER TABLE feature_flags
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS rollout_pct integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_flags' AND column_name = 'nome'
  ) THEN
    UPDATE feature_flags
    SET slug = lower(regexp_replace(nome, '\s+', '_', 'g'))
    WHERE slug IS NULL;

    ALTER TABLE feature_flags ALTER COLUMN slug SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_slug_key'
    ) THEN
      ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_slug_key UNIQUE (slug);
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS analytics_eventos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  payload jsonb,
  usuario_id uuid,
  criado_em timestamptz default now()
);

ALTER TABLE admin_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_eventos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_logs_admin" ON admin_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "feature_flags_admin" ON feature_flags FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "analytics_admin" ON analytics_eventos FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Se a coluna 'nome' existe e é NOT NULL, torná-la nullable antes de inserir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_flags' AND column_name = 'nome'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE feature_flags ALTER COLUMN nome DROP NOT NULL;
  END IF;
END $$;

-- Seed initial feature flags (ON CONFLICT em slug para idempotência)
INSERT INTO feature_flags (slug, descricao, ativo, rollout_pct) VALUES
  ('busca_postgres_direto',       'Forçar busca via Postgres direto em vez do Supabase client', true,  100),
  ('emendas_pix_visivel',         'Exibir seção de Emendas Pix no perfil do político',           false,  0),
  ('comparativo_parlamentares',   'Habilitar página /comparar',                                   false,  0),
  ('candidatos_2026',             'Ativar seção de candidatos 2026 no site',                      false,  0),
  ('glossario_tooltips',          'Tooltips inline do glossário',                                 false,  0),
  ('plano_premium',               'Exportação CSV e alertas por email',                           false,  0)
ON CONFLICT (slug) DO NOTHING;
