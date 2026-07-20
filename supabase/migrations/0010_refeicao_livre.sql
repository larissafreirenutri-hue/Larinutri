-- ============================================================
-- Refeicao livre no check-in
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
-- ============================================================

alter table public.checkins
  add column if not exists refeicao_livre boolean,
  add column if not exists refeicao_livre_qtd int,
  add column if not exists refeicao_livre_oque text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'checkins_refeicao_livre_ck'
  ) then
    alter table public.checkins add constraint checkins_refeicao_livre_ck check (
      refeicao_livre_qtd is null or refeicao_livre_qtd between 0 and 50
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- Funcao publica de gravacao, agora com os tres campos novos
--
-- ATENCAO: create or replace nao serve aqui. Mudar a lista de
-- parametros cria uma SOBRECARGA, e as duas versoes passariam a
-- existir ao mesmo tempo, deixando a chamada ambigua. Por isso a
-- versao antiga e removida primeiro, pela assinatura exata.
-- ------------------------------------------------------------
drop function if exists public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int, text, text
);

create or replace function public.submit_checkin_link(
  p_token          text,
  p_peso           numeric default null,
  p_adesao         int     default null,
  p_saciedade      int     default null,
  p_controle       int     default null,
  p_hidratacao     int     default null,
  p_digestao       int     default null,
  p_sono           int     default null,
  p_recuperacao    int     default null,
  p_humor          int     default null,
  p_tranquilidade  int     default null,
  p_geral          int     default null,
  p_alerta         text    default null,
  p_obs            text    default null,
  p_refeicao_livre boolean default null,
  p_refeicao_qtd   int     default null,
  p_refeicao_oque  text    default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.checkin_links;
  v_checkin_id uuid;
begin
  -- for update segura a linha ate o fim da transacao, para dois envios
  -- simultaneos do mesmo link nao gerarem dois check-ins.
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

  insert into public.checkins (
    patient_id, semana, peso_kg,
    adesao_plano, saciedade, controle_vontade, hidratacao, digestao,
    sono, recuperacao_energia, humor, tranquilidade, semana_geral,
    alerta_clinico, observacoes,
    refeicao_livre, refeicao_livre_qtd, refeicao_livre_oque
  )
  values (
    v_link.patient_id, v_link.semana, p_peso,
    p_adesao, p_saciedade, p_controle, p_hidratacao, p_digestao,
    p_sono, p_recuperacao, p_humor, p_tranquilidade, p_geral,
    nullif(btrim(p_alerta), ''), nullif(btrim(p_obs), ''),
    p_refeicao_livre,
    -- Sem refeicao livre, quantidade e descricao nao fazem sentido e
    -- sao zeradas aqui, mesmo que cheguem preenchidas do formulario.
    case when p_refeicao_livre then p_refeicao_qtd else null end,
    case when p_refeicao_livre then nullif(btrim(p_refeicao_oque), '') else null end
  )
  returning id into v_checkin_id;

  update public.checkin_links
  set status = 'respondido', checkin_id = v_checkin_id
  where id = v_link.id;

  return v_checkin_id;
end;
$$;

revoke all on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text
) from public;

grant execute on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text
) to anon, authenticated;
