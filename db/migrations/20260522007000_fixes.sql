-- ============================================================
-- Fixes pós-auditoria
-- 1. coletas_log RLS: policy usava auth.jwt()->'role' (JWT) em vez
--    de perfis.role (tabela). Admin nunca conseguia ler via client.
-- 2. admin_logs RLS: mesmo problema.
-- 3. feature_flags: 5 linhas criadas após migração nome→slug
--    ficaram com nome=NULL. Preencher nome=slug para consistência.
-- ============================================================

-- -------------------------------------------------------
-- 1. Corrigir RLS de coletas_log
-- -------------------------------------------------------
DROP POLICY IF EXISTS "admin acessa logs" ON coletas_log;

CREATE POLICY "admin acessa logs" ON coletas_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- 2. Corrigir RLS de admin_logs (mesmo padrão errado)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "admin_logs_admin_only" ON admin_logs;

CREATE POLICY "admin_logs_admin_only" ON admin_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- 3. Limpar feature_flags com nome=NULL
-- -------------------------------------------------------
UPDATE feature_flags
SET nome = slug
WHERE nome IS NULL AND slug IS NOT NULL;

-- Verificação
SELECT nome, slug, ativo FROM feature_flags ORDER BY criado_em;
