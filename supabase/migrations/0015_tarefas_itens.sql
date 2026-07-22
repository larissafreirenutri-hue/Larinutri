-- ============================================================
-- Subitens da tarefa, checklist em jsonb
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- Guarda os subitens de cada tarefa no formato
-- [{ "texto": "...", "feito": true|false }]. O jsonb evita uma tabela
-- separada e uma migracao a cada ajuste no formato do checklist. O RLS
-- da tabela tasks continua valendo, sem mudanca.
-- ============================================================

alter table public.tasks
  add column if not exists itens jsonb not null default '[]'::jsonb;

-- Garante que a coluna e sempre um array, nunca um objeto solto.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_itens_array_ck'
  ) then
    alter table public.tasks add constraint tasks_itens_array_ck
      check (jsonb_typeof(itens) = 'array');
  end if;
end $$;
