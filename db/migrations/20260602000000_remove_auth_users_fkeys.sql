-- File: db/migrations/20260602000000_remove_auth_users_fkeys.sql
-- Purpose: Remove foreign key constraints to legacy auth.users for Logto integration.
-- References:
-- - docs/adr/ADR-001-logto-as-identity-provider.md
-- - docs/migrations/2026-06-postgres-logto-migration.md

-- 1. Remove the foreign key constraint from public.perfis referencing auth.users(id)
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_id_fkey;

-- 2. Configure public.perfis.id to generate UUIDs automatically by default
ALTER TABLE public.perfis ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Remove the foreign key constraint from public.acompanhamentos referencing auth.users(id)
ALTER TABLE public.acompanhamentos DROP CONSTRAINT IF EXISTS acompanhamentos_usuario_id_fkey;

-- 4. Add the new foreign key constraint on public.acompanhamentos referencing public.perfis(id)
-- Note: All existing user IDs in acompanhamentos should have corresponding entries in public.perfis,
-- which was guaranteed by the legacy database constraints.
ALTER TABLE public.acompanhamentos
  ADD CONSTRAINT acompanhamentos_usuario_id_perfis_id_fk
  FOREIGN KEY (usuario_id)
  REFERENCES public.perfis(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT acompanhamentos_usuario_id_perfis_id_fk ON public.acompanhamentos IS
  'Establishes foreign key referencing public.perfis instead of legacy auth.users for OIDC identity compatibility.';
