ALTER TABLE perfis ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references perfis(id) on delete set null,
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

CREATE TABLE IF NOT EXISTS analytics_eventos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  payload jsonb,
  usuario_id uuid,
  criado_em timestamptz default now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "admin_logs_admin" ON admin_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "feature_flags_admin" ON feature_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY IF NOT EXISTS "analytics_admin" ON analytics_eventos FOR ALL USING (
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
);

-- Seed initial feature flags
INSERT INTO feature_flags (slug, descricao, ativo, rollout_pct) VALUES
  ('busca_postgres_direto', 'Forçar busca via Postgres direto em vez do Supabase client', true, 100),
  ('emendas_pix_visivel', 'Exibir seção de Emendas Pix no perfil do político', false, 0),
  ('comparativo_parlamentares', 'Habilitar página /comparar', false, 0),
  ('candidatos_2026', 'Ativar seção de candidatos 2026 no site', false, 0),
  ('glossario_tooltips', 'Tooltips inline do glossário', false, 0),
  ('plano_premium', 'Exportação CSV e alertas por email', false, 0)
ON CONFLICT (slug) DO NOTHING;
