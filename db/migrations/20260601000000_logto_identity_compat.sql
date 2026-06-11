-- File: supabase/migrations/20260601000000_logto_identity_compat.sql
-- Purpose: Sprint 1B compatibility columns for Supabase Auth -> Logto migration.
-- References:
-- - docs/auth/AUTH_MIGRATION_LOGTO.md
-- - docs/adr/ADR-001-logto-as-identity-provider.md
--
-- This migration is additive only. It must not remove or alter Supabase Auth
-- runtime dependencies such as auth.users, auth.uid(), auth.jwt(), RLS policies,
-- login, signup, logout, middleware, or existing triggers.
--
-- Real database audit note:
-- public.perfis has no email column. During reconciliation, the legacy email
-- must come from auth.users.email through the preserved public.perfis.id =
-- auth.users.id relationship. This migration intentionally does not add an
-- email reconciliation column to public.perfis.

alter table public.perfis
  add column if not exists logto_sub text,
  add column if not exists supabase_user_id uuid,
  add column if not exists auth_provider text not null default 'supabase',
  add column if not exists migrado_logto_em timestamptz;

update public.perfis
set supabase_user_id = id
where supabase_user_id is null;

create unique index if not exists perfis_logto_sub_uidx
  on public.perfis (logto_sub)
  where logto_sub is not null;

create unique index if not exists perfis_supabase_user_id_uidx
  on public.perfis (supabase_user_id)
  where supabase_user_id is not null;

comment on column public.perfis.logto_sub is
  'External Logto/OIDC subject. Prepared for the Supabase Auth to Logto migration.';

comment on column public.perfis.supabase_user_id is
  'Legacy Supabase Auth user id preserved for reconciliation during the Logto migration. Legacy email is read from auth.users.email via public.perfis.id = auth.users.id.';

comment on column public.perfis.auth_provider is
  'Current or last known identity provider during migration. Expected values: supabase, logto.';

comment on column public.perfis.migrado_logto_em is
  'Timestamp when this profile was linked or migrated to Logto.';
