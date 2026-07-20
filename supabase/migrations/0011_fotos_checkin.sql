-- ============================================================
-- Fotos do check-in, em bucket privado
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Bucket privado
--
-- public = false e o ponto central. Num bucket publico, qualquer
-- pessoa com o caminho veria a foto, e foto de corpo de paciente e
-- dado sensivel de saude. Aqui nada e servido sem URL assinada,
-- gerada no servidor e com prazo curto.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('checkin-fotos', 'checkin-fotos', false)
on conflict (id) do update set public = false;

-- ------------------------------------------------------------
-- 2. Sem politica nenhuma para anon e authenticated, de proposito
--
-- Nao ha create policy aqui, e isso e intencional. Todo acesso ao
-- bucket passa pelo servidor, que usa a Secret key e ignora RLS.
-- O paciente sobe por URL assinada de upload, e a nutricionista ve
-- por URL assinada de leitura. Uma politica para anon abriria uma
-- porta que nao precisa existir.
--
-- As linhas abaixo removem qualquer politica que tenha sido criada
-- por engano no painel, para o bucket ficar mesmo fechado.
-- ------------------------------------------------------------
drop policy if exists "checkin-fotos: leitura publica" on storage.objects;
drop policy if exists "checkin-fotos: upload anonimo" on storage.objects;

-- ------------------------------------------------------------
-- 3. Coluna com os caminhos das fotos
-- ------------------------------------------------------------
alter table public.checkins
  add column if not exists fotos text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'checkins_fotos_ck'
  ) then
    -- No maximo cinco por check-in, conferido tambem no servidor.
    alter table public.checkins
      add constraint checkins_fotos_ck
      check (fotos is null or array_length(fotos, 1) <= 5);
  end if;
end $$;

-- ------------------------------------------------------------
-- 4. Funcao publica de gravacao, agora recebendo os caminhos
--
-- ATENCAO: mudar a lista de parametros cria uma SOBRECARGA. As duas
-- versoes conviveriam e a chamada ficaria ambigua, quebrando todo
-- envio. Por isso a assinatura anterior e removida primeiro.
-- ------------------------------------------------------------
drop function if exists public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text
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
  p_refeicao_oque  text    default null,
  p_fotos          text[]  default null
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

  -- Teto de cinco reforcado aqui tambem. Quem chamar a funcao direto,
  -- sem passar pelo formulario, tambem esbarra no limite.
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
    fotos
  )
  values (
    v_link.patient_id, v_link.semana, p_peso,
    p_adesao, p_saciedade, p_controle, p_hidratacao, p_digestao,
    p_sono, p_recuperacao, p_humor, p_tranquilidade, p_geral,
    nullif(btrim(p_alerta), ''), nullif(btrim(p_obs), ''),
    p_refeicao_livre,
    case when p_refeicao_livre then p_refeicao_qtd else null end,
    case when p_refeicao_livre then nullif(btrim(p_refeicao_oque), '') else null end,
    v_fotos
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
  text, text, boolean, int, text, text[]
) from public;

grant execute on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[]
) to anon, authenticated;
