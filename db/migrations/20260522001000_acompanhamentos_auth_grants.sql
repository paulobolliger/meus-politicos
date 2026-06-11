-- Ajusta permissões e RLS para fluxo de acompanhar/desacompanhar politico

grant usage on schema public to authenticated, service_role;

grant select, insert, delete on table public.acompanhamentos to authenticated, service_role;
grant select, insert, update on table public.perfis to authenticated, service_role;

alter table public.acompanhamentos enable row level security;
alter table public.perfis enable row level security;

do $$ begin
  create policy "acompanhamentos_proprios_select"
    on public.acompanhamentos for select
    using (auth.uid() = usuario_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "acompanhamentos_proprios_insert"
    on public.acompanhamentos for insert
    with check (auth.uid() = usuario_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "acompanhamentos_proprios_delete"
    on public.acompanhamentos for delete
    using (auth.uid() = usuario_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "perfil_proprio_select"
    on public.perfis for select
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "perfil_proprio_insert"
    on public.perfis for insert
    with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "perfil_proprio_update"
    on public.perfis for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;
