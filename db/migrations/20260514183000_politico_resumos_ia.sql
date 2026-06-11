create table if not exists public.politico_resumos_ia (
  politico_id uuid primary key references public.politicos(id) on delete cascade,
  hash_dados text not null,
  conteudo_json jsonb not null,
  criado_em timestamptz not null default timezone('utc', now()),
  atualizado_em timestamptz not null default timezone('utc', now())
);

create index if not exists idx_politico_resumos_ia_hash on public.politico_resumos_ia(hash_dados);

comment on table public.politico_resumos_ia is 'Cache de resumos interpretativos gerados por IA com invalidacao por hash de metricas.';

create table if not exists public.politico_resumos_ia_cotas (
  id uuid primary key default gen_random_uuid(),
  politico_id uuid not null references public.politicos(id) on delete cascade,
  dia_referencia date not null,
  geracoes integer not null default 0 check (geracoes >= 0),
  limite_diario integer not null default 3 check (limite_diario >= 1),
  criado_em timestamptz not null default timezone('utc', now()),
  atualizado_em timestamptz not null default timezone('utc', now()),
  unique (politico_id, dia_referencia)
);

create index if not exists idx_politico_resumos_ia_cotas_dia
  on public.politico_resumos_ia_cotas(dia_referencia desc);

create index if not exists idx_politico_resumos_ia_cotas_politico
  on public.politico_resumos_ia_cotas(politico_id, dia_referencia desc);

comment on table public.politico_resumos_ia_cotas is 'Controle de cota diaria de geracoes de resumo interpretativo por politico.';

alter table public.politico_resumos_ia enable row level security;
alter table public.politico_resumos_ia_cotas enable row level security;

drop policy if exists "admin acessa resumos ia" on public.politico_resumos_ia;
create policy "admin acessa resumos ia" on public.politico_resumos_ia
  for all using (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "admin acessa cotas resumos ia" on public.politico_resumos_ia_cotas;
create policy "admin acessa cotas resumos ia" on public.politico_resumos_ia_cotas
  for all using (auth.jwt() ->> 'role' = 'admin');

drop trigger if exists trg_politico_resumos_ia_atualizado on public.politico_resumos_ia;
create trigger trg_politico_resumos_ia_atualizado
  before update on public.politico_resumos_ia
  for each row execute function public.set_atualizado_em();

drop trigger if exists trg_politico_resumos_ia_cotas_atualizado on public.politico_resumos_ia_cotas;
create trigger trg_politico_resumos_ia_cotas_atualizado
  before update on public.politico_resumos_ia_cotas
  for each row execute function public.set_atualizado_em();
