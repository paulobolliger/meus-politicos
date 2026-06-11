-- ─────────────────────────────────────────────────────────────────
-- Grant SELECT + RLS policies para todas as tabelas públicas
-- ─────────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated, service_role;

-- Grants
grant select on table public.partidos                 to anon, authenticated, service_role;
grant select on table public.municipios               to anon, authenticated, service_role;
grant select on table public.emendas                  to anon, authenticated, service_role;
grant select on table public.candidatos               to anon, authenticated, service_role;
grant select on table public.senadores                to anon, authenticated, service_role;
grant select on table public.candidaturas_historico   to anon, authenticated, service_role;
grant select on table public.feed_eventos             to anon, authenticated, service_role;
grant select on table public.coletas_log              to anon, authenticated, service_role;
grant select on table public.feature_flags            to anon, authenticated, service_role;
grant select on table public.perfis                   to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- RLS policies — criar se não existir
-- ─────────────────────────────────────────────────────────────────

alter table public.partidos               enable row level security;
alter table public.municipios             enable row level security;
alter table public.emendas                enable row level security;
alter table public.candidatos             enable row level security;
alter table public.senadores              enable row level security;
alter table public.candidaturas_historico enable row level security;
alter table public.feed_eventos           enable row level security;
alter table public.coletas_log            enable row level security;
alter table public.feature_flags          enable row level security;

do $$ begin
  create policy "partidos_select_public"
    on public.partidos for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "municipios_select_public"
    on public.municipios for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "emendas_select_public"
    on public.emendas for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "candidatos_select_public"
    on public.candidatos for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "senadores_select_public"
    on public.senadores for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "candidaturas_historico_select_public"
    on public.candidaturas_historico for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "feed_eventos_select_public"
    on public.feed_eventos for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "coletas_log_select_public"
    on public.coletas_log for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "feature_flags_select_public"
    on public.feature_flags for select using (true);
exception when duplicate_object then null;
end $$;
