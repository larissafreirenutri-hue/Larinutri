-- ============================================================
-- Fase E: modulo financeiro, lancamentos de receita e despesa
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie este arquivo pelo botao de copiar do GitHub, e nao do chat,
-- para nao arrastar texto solto junto.
-- ============================================================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  tipo text not null
    check (tipo in ('receita', 'despesa')),

  descricao text not null
    check (length(btrim(descricao)) > 0),

  valor numeric not null
    check (valor >= 0),

  categoria text,

  -- Receita ligada a um paciente. Se o paciente sair, o lancamento
  -- fica, porque o dinheiro entrou de qualquer forma.
  patient_id uuid
    references public.patients (id) on delete set null,

  status text not null default 'pago'
    check (status in ('pago', 'pendente')),

  -- Usado quando o lancamento esta pendente.
  vencimento date,

  -- Quando o dinheiro efetivamente entrou ou saiu.
  pago_em timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists transactions_owner_created_at_idx
  on public.transactions (owner, created_at desc);

-- Atende a consulta de atrasados e de contas a receber.
create index if not exists transactions_owner_status_vencimento_idx
  on public.transactions (owner, status, vencimento);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists "lancamentos: ler os proprios" on public.transactions;
create policy "lancamentos: ler os proprios"
  on public.transactions
  for select
  to authenticated
  using (owner = auth.uid());

drop policy if exists "lancamentos: inserir os proprios" on public.transactions;
create policy "lancamentos: inserir os proprios"
  on public.transactions
  for insert
  to authenticated
  with check (owner = auth.uid());

drop policy if exists "lancamentos: atualizar os proprios" on public.transactions;
create policy "lancamentos: atualizar os proprios"
  on public.transactions
  for update
  to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "lancamentos: excluir os proprios" on public.transactions;
create policy "lancamentos: excluir os proprios"
  on public.transactions
  for delete
  to authenticated
  using (owner = auth.uid());
