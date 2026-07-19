-- ============================================================
-- Etapa 3: tabela de pacientes com Row Level Security
-- Rodar no Supabase, SQL Editor. Pode rodar mais de uma vez
-- sem quebrar, todos os comandos são idempotentes.
-- ============================================================

-- gen_random_uuid() vem do pgcrypto. Nos projetos novos do Supabase
-- já costuma estar ativo, a linha abaixo garante o caso contrário.
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tabela
-- ------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),

  -- Nutricionista dona do registro. O default auth.uid() preenche
  -- sozinho a partir da sessão de quem está inserindo.
  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  full_name text not null check (length(btrim(full_name)) > 0),
  email text,
  phone text,
  notes text,

  -- Usado só na etapa 4, para montar o link único de check-in.
  access_token uuid not null unique default gen_random_uuid(),

  created_at timestamptz not null default now()
);

-- Ordenação da listagem do painel, por dona e mais recentes primeiro.
create index if not exists patients_owner_created_at_idx
  on public.patients (owner, created_at desc);

-- ------------------------------------------------------------
-- Row Level Security
-- Sem estas políticas a tabela fica invisível para a API,
-- que é o padrão seguro do Postgres.
-- ------------------------------------------------------------
alter table public.patients enable row level security;

-- O Postgres não aceita "create policy if not exists", por isso
-- cada política é removida antes de ser recriada.
drop policy if exists "pacientes: ler os proprios" on public.patients;
create policy "pacientes: ler os proprios"
  on public.patients
  for select
  to authenticated
  using (owner = auth.uid());

-- O with check no insert impede gravar linha em nome de outra pessoa,
-- mesmo que o cliente mande um owner diferente no corpo da requisição.
drop policy if exists "pacientes: inserir os proprios" on public.patients;
create policy "pacientes: inserir os proprios"
  on public.patients
  for insert
  to authenticated
  with check (owner = auth.uid());

-- using filtra quais linhas podem ser alteradas, with check impede
-- que a alteração transfira a linha para outra dona.
drop policy if exists "pacientes: atualizar os proprios" on public.patients;
create policy "pacientes: atualizar os proprios"
  on public.patients
  for update
  to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "pacientes: excluir os proprios" on public.patients;
create policy "pacientes: excluir os proprios"
  on public.patients
  for delete
  to authenticated
  using (owner = auth.uid());
