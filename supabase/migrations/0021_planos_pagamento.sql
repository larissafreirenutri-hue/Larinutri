-- ============================================================
-- Planos de pagamento recorrentes por paciente
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat, para nao
-- arrastar texto solto junto.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabela de planos
-- ------------------------------------------------------------
create table if not exists public.payment_plans (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  patient_id uuid
    references public.patients (id) on delete set null,

  descricao text,

  valor_mensal numeric not null
    check (valor_mensal >= 0),

  meses int not null
    check (meses between 1 and 60),

  -- Dia do mes do vencimento, limitado a 28 para existir em todo mes.
  dia_vencimento int
    check (dia_vencimento is null or dia_vencimento between 1 and 28),

  data_inicio date not null,

  status text not null default 'ativo'
    check (status in ('ativo', 'concluido', 'cancelado')),

  created_at timestamptz not null default now()
);

create index if not exists payment_plans_owner_idx
  on public.payment_plans (owner, created_at desc);

create index if not exists payment_plans_patient_idx
  on public.payment_plans (patient_id);

-- ------------------------------------------------------------
-- 2. Ligar as parcelas ao plano, na tabela de lancamentos
-- ------------------------------------------------------------
alter table public.transactions
  add column if not exists payment_plan_id uuid
    references public.payment_plans (id) on delete set null,
  add column if not exists parcela_num int;

create index if not exists transactions_plan_idx
  on public.transactions (payment_plan_id);

-- ------------------------------------------------------------
-- 3. pago_em vira data pura
--
-- A data real do pagamento nao tem hora nem fuso. Como timestamptz,
-- ela deslocava o dia ao ser exibida. Passa a ser date. A conversao
-- dos registros antigos usa o fuso de Brasilia, para o dia bater com
-- quando o dinheiro entrou de fato.
-- ------------------------------------------------------------
alter table public.transactions
  alter column pago_em type date
  using (pago_em at time zone 'America/Sao_Paulo')::date;

-- ------------------------------------------------------------
-- 4. Row Level Security dos planos
-- A Larissa so ve e mexe nos proprios planos.
-- ------------------------------------------------------------
alter table public.payment_plans enable row level security;

drop policy if exists "planos: ler os proprios" on public.payment_plans;
create policy "planos: ler os proprios"
  on public.payment_plans for select to authenticated
  using (owner = auth.uid());

drop policy if exists "planos: inserir os proprios" on public.payment_plans;
create policy "planos: inserir os proprios"
  on public.payment_plans for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "planos: atualizar os proprios" on public.payment_plans;
create policy "planos: atualizar os proprios"
  on public.payment_plans for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "planos: excluir os proprios" on public.payment_plans;
create policy "planos: excluir os proprios"
  on public.payment_plans for delete to authenticated
  using (owner = auth.uid());
