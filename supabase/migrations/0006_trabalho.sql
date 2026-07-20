-- ============================================================
-- Fase F: area de trabalho, tarefas e rotinas
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat, para nao
-- arrastar texto solto junto.
-- ============================================================

-- ------------------------------------------------------------
-- Tarefas
-- ------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  titulo text not null
    check (length(btrim(titulo)) > 0),

  descricao text,

  prioridade text
    check (prioridade is null or prioridade in ('Baixa', 'Média', 'Alta')),

  status text not null default 'pendente'
    check (status in ('pendente', 'concluída')),

  due_date date,

  -- Tarefa ligada a um paciente. Se o paciente sair, a tarefa fica,
  -- porque pode haver pendencia administrativa a resolver.
  patient_id uuid
    references public.patients (id) on delete set null,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tasks_owner_status_due_idx
  on public.tasks (owner, status, due_date);

create index if not exists tasks_owner_created_at_idx
  on public.tasks (owner, created_at desc);

-- ------------------------------------------------------------
-- Rotinas
-- ------------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  titulo text not null
    check (length(btrim(titulo)) > 0),

  frequencia text not null
    check (frequencia in ('Diária', 'Semanal', 'Mensal')),

  ativa boolean not null default true,
  next_due date,

  created_at timestamptz not null default now()
);

create index if not exists routines_owner_ativa_next_idx
  on public.routines (owner, ativa, next_due);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.routines enable row level security;

drop policy if exists "tarefas: ler as proprias" on public.tasks;
create policy "tarefas: ler as proprias"
  on public.tasks for select to authenticated
  using (owner = auth.uid());

drop policy if exists "tarefas: inserir as proprias" on public.tasks;
create policy "tarefas: inserir as proprias"
  on public.tasks for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "tarefas: atualizar as proprias" on public.tasks;
create policy "tarefas: atualizar as proprias"
  on public.tasks for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "tarefas: excluir as proprias" on public.tasks;
create policy "tarefas: excluir as proprias"
  on public.tasks for delete to authenticated
  using (owner = auth.uid());

drop policy if exists "rotinas: ler as proprias" on public.routines;
create policy "rotinas: ler as proprias"
  on public.routines for select to authenticated
  using (owner = auth.uid());

drop policy if exists "rotinas: inserir as proprias" on public.routines;
create policy "rotinas: inserir as proprias"
  on public.routines for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "rotinas: atualizar as proprias" on public.routines;
create policy "rotinas: atualizar as proprias"
  on public.routines for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "rotinas: excluir as proprias" on public.routines;
create policy "rotinas: excluir as proprias"
  on public.routines for delete to authenticated
  using (owner = auth.uid());
