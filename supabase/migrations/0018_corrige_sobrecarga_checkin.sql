-- ============================================================
-- Correção do envio de check-in: remove sobrecargas residuais
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- CAUSA RAIZ
-- O banco de produção foi montado rodando as migrações à mão. Se
-- alguma versão antiga de submit_checkin_link ficou para trás (uma
-- migração pulada ou fora de ordem), a função passa a existir em
-- mais de uma assinatura ao mesmo tempo, uma sobrecarga.
--
-- Com sobrecarga, o Postgres desempata pelo tipo dos argumentos.
-- Quando a paciente manda fotos, p_fotos chega como array e casa
-- com o parâmetro text[], então funciona. Quando não manda foto,
-- p_fotos vai como null sem tipo, o banco não consegue escolher a
-- versão e a chamada falha. É por isso que "com foto funciona e sem
-- foto não".
--
-- A correção varre o catálogo e remove TODAS as versões da função,
-- seja qual for a assinatura, e recria uma só, a canônica.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remover toda e qualquer versão de submit_checkin_link
-- ------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select oid::regprocedure as assinatura
    from pg_proc
    where proname = 'submit_checkin_link'
      and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function if exists ' || r.assinatura::text;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 2. Recriar a versão canônica, única
-- Corpo idêntico ao da migração 0012, a mais recente.
-- ------------------------------------------------------------
create function public.submit_checkin_link(
  p_token           text,
  p_peso            numeric default null,
  p_adesao          int     default null,
  p_saciedade       int     default null,
  p_controle        int     default null,
  p_hidratacao      int     default null,
  p_digestao        int     default null,
  p_sono            int     default null,
  p_recuperacao     int     default null,
  p_humor           int     default null,
  p_tranquilidade   int     default null,
  p_geral           int     default null,
  p_alerta          text    default null,
  p_obs             text    default null,
  p_refeicao_livre  boolean default null,
  p_refeicao_qtd    int     default null,
  p_refeicao_oque   text    default null,
  p_fotos           text[]  default null,
  p_treinos_qtd     int     default null,
  p_treinos_quais   text    default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.checkin_links;
  v_checkin_id uuid;
  v_fotos text[];
begin
  select * into v_link
  from public.checkin_links
  where token = p_token
    and status <> 'respondido'
    and expira_em > now()
  for update;

  if not found then
    raise exception 'Link de check-in invalido, expirado ou ja respondido.'
      using errcode = '22023';
  end if;

  v_fotos := p_fotos;
  if v_fotos is not null and array_length(v_fotos, 1) > 5 then
    v_fotos := v_fotos[1:5];
  end if;

  insert into public.checkins (
    patient_id, semana, peso_kg,
    adesao_plano, saciedade, controle_vontade, hidratacao, digestao,
    sono, recuperacao_energia, humor, tranquilidade, semana_geral,
    alerta_clinico, observacoes,
    refeicao_livre, refeicao_livre_qtd, refeicao_livre_oque,
    fotos,
    dias_atividade_fisica, atividade_quais
  )
  values (
    v_link.patient_id, v_link.semana, p_peso,
    p_adesao, p_saciedade, p_controle, p_hidratacao, p_digestao,
    p_sono, p_recuperacao, p_humor, p_tranquilidade, p_geral,
    nullif(btrim(p_alerta), ''), nullif(btrim(p_obs), ''),
    p_refeicao_livre,
    case when p_refeicao_livre then p_refeicao_qtd else null end,
    case when p_refeicao_livre then nullif(btrim(p_refeicao_oque), '') else null end,
    v_fotos,
    p_treinos_qtd,
    case when coalesce(p_treinos_qtd, 0) > 0
      then nullif(btrim(p_treinos_quais), '')
      else null
    end
  )
  returning id into v_checkin_id;

  update public.checkin_links
  set status = 'respondido', checkin_id = v_checkin_id
  where id = v_link.id;

  return v_checkin_id;
end;
$$;

-- ------------------------------------------------------------
-- 3. Permissões: SECURITY DEFINER roda como a dona, mas o anon
-- ainda precisa poder executar a função.
-- ------------------------------------------------------------
revoke all on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[], int, text
) from public;

grant execute on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[], int, text
) to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Conferência: deve retornar exatamente uma linha
-- ------------------------------------------------------------
-- select count(*) as versoes_da_funcao
-- from pg_proc
-- where proname = 'submit_checkin_link'
--   and pronamespace = 'public'::regnamespace;
