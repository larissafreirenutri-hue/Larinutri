-- ============================================================
-- Novo arco: estado de triagem por check-in
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- Existe por causa da Esteira, que tem tres colunas: A responder,
-- Respondido e Analisado. Sem esta coluna o sistema nao sabe o que a
-- nutricionista ja tratou, e a esteira nao consegue lembrar de nada.
-- ============================================================

alter table public.checkins
  add column if not exists triagem text not null default 'respondido',
  -- Recado que a nutricionista devolve ao paciente sobre o check-in.
  -- Aparece na ficha e na esteira nas proximas etapas.
  add column if not exists comentario_nutri text,
  -- Marca quando a resposta foi de fato analisada, para medir o tempo
  -- entre o paciente responder e a nutricionista retornar.
  add column if not exists analisado_em timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'checkins_triagem_ck'
  ) then
    alter table public.checkins
      add constraint checkins_triagem_ck
      check (triagem in ('a_responder', 'respondido', 'analisado'));
  end if;
end $$;

-- A esteira ordena por estado e por chegada.
create index if not exists checkins_triagem_idx
  on public.checkins (triagem, created_at desc);

-- Check-ins que ja existiam entram como respondidos, que e onde
-- realmente estao: chegaram e ainda nao foram analisados.
update public.checkins
set triagem = 'respondido'
where triagem is null;
