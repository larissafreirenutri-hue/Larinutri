-- ============================================================
-- Corrige a constraint de atividade física do check-in
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- CAUSA RAIZ
-- A coluna checkins.dias_atividade_fisica nasceu na 0002 com um
-- check de 0 a 7 (dias da semana). Na 0012, o campo foi reaproveitado
-- para contar treinos, caminhadas e esportes, com um novo check de
-- 0 a 21, mas o check antigo de 0 a 7 nunca foi removido.
--
-- Com os dois checks ao mesmo tempo, o valor precisa passar nos dois,
-- então na prática o limite continuou sendo 7. Quem relata 8 ou mais
-- atividades na semana viola o check antigo e recebe erro. Quem relata
-- 7 ou menos passa. É por isso que só alguns pacientes falham.
--
-- A correção varre a tabela e remove TODO check que fale de
-- dias_atividade_fisica, seja qual for o nome, e recria um só, de 0 a 21.
-- ============================================================

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.checkins'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%dias_atividade_fisica%'
  loop
    execute format('alter table public.checkins drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.checkins
  add constraint checkins_atividade_ck
  check (dias_atividade_fisica is null or dias_atividade_fisica between 0 and 21);

-- Conferência: deve listar só checkins_atividade_ck.
-- select con.conname, pg_get_constraintdef(con.oid)
-- from pg_constraint con
-- where con.conrelid = 'public.checkins'::regclass
--   and con.contype = 'c'
--   and pg_get_constraintdef(con.oid) ilike '%dias_atividade_fisica%';
