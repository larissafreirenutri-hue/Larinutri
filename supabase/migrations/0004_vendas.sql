-- ============================================================
-- Fase D: módulo de vendas, leads e interações
-- Rodar no Supabase, SQL Editor. Idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- Leads
-- ------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  nome text not null check (length(btrim(nome)) > 0),
  email text,
  phone text,
  origem text,

  etapa text not null default 'Novo'
    check (etapa in (
      'Novo',
      'Contato feito',
      'Avaliação agendada',
      'Proposta enviada',
      'Fechado ganho',
      'Fechado perdido'
    )),

  valor numeric check (valor is null or valor >= 0),
  observacoes text,

  -- Preenchido quando o lead vira paciente. Se o paciente for
  -- excluído, o lead permanece com o histórico, sem o vínculo.
  patient_id uuid references public.patients (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_owner_etapa_idx
  on public.leads (owner, etapa);

create index if not exists leads_owner_created_at_idx
  on public.leads (owner, created_at desc);

-- ------------------------------------------------------------
-- Interações com o lead
-- ------------------------------------------------------------
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  lead_id uuid not null
    references public.leads (id) on delete cascade,

  tipo text
    check (tipo is null or tipo in ('Ligação', 'Mensagem', 'Reunião', 'Nota')),

  descricao text,
  occurred_at timestamptz not null default now()
);

create index if not exists lead_activities_lead_occurred_idx
  on public.lead_activities (lead_id, occurred_at desc);

-- ------------------------------------------------------------
-- updated_at automático nos leads
-- Mantido no banco, e não na aplicação, para que qualquer caminho
-- de escrita atualize o campo, inclusive edição manual no painel
-- do Supabase.
-- ------------------------------------------------------------
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_tocar_updated_at on public.leads;
create trigger leads_tocar_updated_at
  before update on public.leads
  for each row
  execute function public.tocar_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

drop policy if exists "leads: ler os proprios" on public.leads;
create policy "leads: ler os proprios"
  on public.leads for select to authenticated
  using (owner = auth.uid());

drop policy if exists "leads: inserir os proprios" on public.leads;
create policy "leads: inserir os proprios"
  on public.leads for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "leads: atualizar os proprios" on public.leads;
create policy "leads: atualizar os proprios"
  on public.leads for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "leads: excluir os proprios" on public.leads;
create policy "leads: excluir os proprios"
  on public.leads for delete to authenticated
  using (owner = auth.uid());

drop policy if exists "interacoes: ler as proprias" on public.lead_activities;
create policy "interacoes: ler as proprias"
  on public.lead_activities for select to authenticated
  using (owner = auth.uid());

-- Além do owner, o with check exige que o lead também seja da mesma
-- pessoa. Sem isso daria para pendurar uma interação no lead de outra
-- nutricionista, já que o owner da interação seria o seu.
drop policy if exists "interacoes: inserir as proprias" on public.lead_activities;
create policy "interacoes: inserir as proprias"
  on public.lead_activities for insert to authenticated
  with check (
    owner = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_activities.lead_id
        and l.owner = auth.uid()
    )
  );

drop policy if exists "interacoes: atualizar as proprias" on public.lead_activities;
create policy "interacoes: atualizar as proprias"
  on public.lead_activities for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "interacoes: excluir as proprias" on public.lead_activities;
create policy "interacoes: excluir as proprias"
  on public.lead_activities for delete to authenticated
  using (owner = auth.uid());
