-- ============================================================
-- Link de check-in sem prazo de validade
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- REGRA NOVA
-- O link de check-in deixa de expirar por tempo. Ele vale enquanto
-- o status não for 'respondido' (uso único) nem 'expirado' (que
-- agora significa cancelado, quando um link mais novo o substitui).
-- A coluna expira_em continua existindo, sem uso, e não bloqueia
-- mais nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Validação do token na abertura da tela
-- Remove a checagem de expira_em. Recusa só respondido e cancelado.
-- ------------------------------------------------------------
create or replace function public.get_checkin_link(p_token text)
returns table (primeiro_nome text, semana int)
language sql
security definer
set search_path = ''
stable
as $$
  select
    split_part(btrim(p.full_name), ' ', 1) as primeiro_nome,
    l.semana
  from public.checkin_links l
  join public.patients p on p.id = l.patient_id
  where l.token = p_token
    and l.status not in ('respondido', 'expirado');
$$;

revoke all on function public.get_checkin_link(text) from public;
grant execute on function public.get_checkin_link(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Gravação do check-in
-- Sem checagem de prazo. Mensagens distintas para respondido e
-- para link substituído, para a paciente saber exatamente o que é.
-- Corpo idêntico ao da 0018, só muda a validação de entrada.
-- ------------------------------------------------------------
create or replace function public.submit_checkin_link(
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
  for update;

  if not found then
    raise exception 'Link de check-in invalido.'
      using errcode = '22023';
  end if;

  if v_link.status = 'respondido' then
    raise exception 'Este check-in ja foi respondido.'
      using errcode = '22023';
  end if;

  if v_link.status = 'expirado' then
    raise exception 'Este link foi substituido por um mais novo.'
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

revoke all on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[], int, text
) from public;

grant execute on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[], int, text
) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. A coluna expira_em perde o valor padrão baseado em prazo.
-- Novos links não recebem mais uma data de expiração automática.
-- Fica nula, sem uso. Os links antigos mantêm o que já tinham, e
-- isso não bloqueia mais nada.
-- ------------------------------------------------------------
alter table public.checkin_links
  alter column expira_em drop not null;

alter table public.checkin_links
  alter column expira_em drop default;
