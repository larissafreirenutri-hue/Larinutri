-- ============================================================
-- Hora opcional na tarefa
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- Tarefa sem hora e tratada como do dia inteiro. A coluna itens ja foi
-- criada na 0015, mas o add if not exists abaixo a garante para quem
-- pulou aquela migracao. O RLS de tasks nao muda.
-- ============================================================

alter table public.tasks
  add column if not exists due_time time,
  add column if not exists itens jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_itens_array_ck'
  ) then
    alter table public.tasks add constraint tasks_itens_array_ck
      check (jsonb_typeof(itens) = 'array');
  end if;
end $$;
