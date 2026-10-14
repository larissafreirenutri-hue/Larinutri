-- ============================================================
-- Portal do paciente, Fase 2: check-in da semana pela sessão
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- MODELAGEM
-- Reaproveitamos checkin_links. Ele ja modela "um check-in por semana
-- por paciente, com status aberto e respondido", ja alimenta a esteira,
-- a triagem e a ficha, e o token continua valendo para os links avulsos
-- antigos. Para o portal, acrescentamos semana_inicio, a segunda-feira
-- da semana coberta, e um caminho de resposta pela sessao autenticada,
-- sem token na URL.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Semana coberta pelo check-in, a segunda-feira (data pura)
-- ------------------------------------------------------------
alter table public.checkin_links
  add column if not exists semana_inicio date;

-- No maximo um check-in por paciente por semana, aberto ou respondido.
-- O cancelado (expirado) fica de fora, para dar para reabrir se preciso.
create unique index if not exists checkin_links_paciente_semana_uk
  on public.checkin_links (patient_id, semana_inicio)
  where semana_inicio is not null and status <> 'expirado';

-- ------------------------------------------------------------
-- 2. RLS: o paciente le os proprios links de check-in
-- Permissiva, convive com a politica por owner da nutricionista.
-- ------------------------------------------------------------
drop policy if exists "links: o paciente le os proprios" on public.checkin_links;
create policy "links: o paciente le os proprios"
  on public.checkin_links for select to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = checkin_links.patient_id
        and p.auth_user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3. Gravacao pelo portal, pela sessao do paciente
--
-- SECURITY DEFINER para gravar apesar do RLS, mas com a trava de
-- seguranca por dentro: so grava se o link for de um paciente cujo
-- auth_user_id e o proprio chamador. O navegador manda o id do link,
-- nunca o patient_id, e nao consegue responder o check-in de outra
-- pessoa nem adulterando o formulario.
-- ------------------------------------------------------------
create or replace function public.submit_checkin_portal(
  p_link_id         uuid,
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
  select l.* into v_link
  from public.checkin_links l
  join public.patients p on p.id = l.patient_id
  where l.id = p_link_id
    and p.auth_user_id = auth.uid()
    and l.status not in ('respondido', 'expirado')
  for update;

  if not found then
    raise exception 'Check-in indisponivel.'
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

-- So quem esta logado responde pelo portal. O anon nao recebe acesso.
revoke all on function public.submit_checkin_portal(
  uuid, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[], int, text
) from public;

grant execute on function public.submit_checkin_portal(
  uuid, numeric, int, int, int, int, int, int, int, int, int, int,
  text, text, boolean, int, text, text[], int, text
) to authenticated;
