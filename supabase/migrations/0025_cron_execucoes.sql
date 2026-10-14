-- ============================================================
-- Portal do paciente, Fase 3: log da abertura automatica
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Registra cada rodada da rotina de segunda-feira, para a Larissa ver
-- quando rodou e quantos check-ins foram abertos. A rotina escreve com
-- a Secret key, ignorando o RLS. A Larissa le as proprias linhas.
-- ============================================================

create table if not exists public.cron_execucoes (
  id uuid primary key default gen_random_uuid(),
  owner uuid
    references auth.users (id) on delete set null,
  job text not null,
  semana_inicio date,
  abertos int not null default 0,
  ativos int not null default 0,
  detalhe text,
  executado_em timestamptz not null default now()
);

create index if not exists cron_execucoes_owner_idx
  on public.cron_execucoes (owner, executado_em desc);

alter table public.cron_execucoes enable row level security;

drop policy if exists "cron: ler as proprias" on public.cron_execucoes;
create policy "cron: ler as proprias"
  on public.cron_execucoes for select to authenticated
  using (owner = auth.uid());
