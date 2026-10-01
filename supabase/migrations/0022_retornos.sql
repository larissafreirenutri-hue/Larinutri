-- ============================================================
-- Retornos programados e modalidade do plano
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Campos novos no plano
-- ------------------------------------------------------------
alter table public.payment_plans
  add column if not exists modalidade text
    check (modalidade is null or modalidade in ('online', 'presencial', 'domiciliar')),
  add column if not exists qtd_retornos int not null default 0
    check (qtd_retornos >= 0 and qtd_retornos <= 24);

-- ------------------------------------------------------------
-- 2. Tabela de retornos
-- ------------------------------------------------------------
create table if not exists public.retornos (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  patient_id uuid
    references public.patients (id) on delete set null,

  payment_plan_id uuid
    references public.payment_plans (id) on delete cascade,

  numero int not null default 1,

  data_prevista date not null,

  status text not null default 'pendente'
    check (status in ('pendente', 'realizado', 'remarcado')),

  realizado_em date,
  observacoes text,

  created_at timestamptz not null default now()
);

create index if not exists retornos_owner_data_idx
  on public.retornos (owner, status, data_prevista);

create index if not exists retornos_plan_idx
  on public.retornos (payment_plan_id);

create index if not exists retornos_patient_idx
  on public.retornos (patient_id);

-- ------------------------------------------------------------
-- 3. Row Level Security
-- A Larissa so ve e mexe nos proprios retornos.
-- ------------------------------------------------------------
alter table public.retornos enable row level security;

drop policy if exists "retornos: ler os proprios" on public.retornos;
create policy "retornos: ler os proprios"
  on public.retornos for select to authenticated
  using (owner = auth.uid());

drop policy if exists "retornos: inserir os proprios" on public.retornos;
create policy "retornos: inserir os proprios"
  on public.retornos for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "retornos: atualizar os proprios" on public.retornos;
create policy "retornos: atualizar os proprios"
  on public.retornos for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "retornos: excluir os proprios" on public.retornos;
create policy "retornos: excluir os proprios"
  on public.retornos for delete to authenticated
  using (owner = auth.uid());
