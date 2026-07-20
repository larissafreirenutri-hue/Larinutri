-- ============================================================
-- Novo arco, etapa 1: modelo de dados rico
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- PRINCIPIO DESTA MIGRACAO: nada do que ja existe e destruido.
-- Colunas antigas incompativeis sao renomeadas com sufixo _texto e
-- ficam paradas. As funcoes publicas antigas continuam vivas, para
-- o formulario de check-in atual nao parar de funcionar. As novas
-- funcoes convivem com elas ate a etapa 2 migrar as telas.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Pacientes, campos de plano e antropometria
-- ------------------------------------------------------------
alter table public.patients
  add column if not exists objetivo text,
  add column if not exists plano_nome text,
  add column if not exists plano_duracao text,
  add column if not exists plano_vence date,
  add column if not exists restricao text,
  add column if not exists status text not null default 'ativo',
  add column if not exists peso_inicial numeric,
  add column if not exists altura numeric,
  add column if not exists sono_habitual text,
  add column if not exists treino_planejado text,
  add column if not exists meta_agua text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'patients_status_ck'
  ) then
    alter table public.patients
      add constraint patients_status_ck
      check (status in ('ativo', 'pausado', 'arquivado'));
  end if;
end $$;

create index if not exists patients_owner_status_idx
  on public.patients (owner, status);

-- ------------------------------------------------------------
-- 2. Check-ins, modelo de dez notas de 0 a 10
--
-- adesao_plano existe hoje como texto (Baixa, Media, Alta) e o novo
-- modelo pede inteiro. A coluna antiga e renomeada para
-- adesao_plano_texto e preservada. As demais colunas antigas
-- (qualidade_sono, nivel_fome, dias_atividade_fisica) nao conflitam
-- de nome e ficam onde estao, sem uso.
-- ------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'checkins'
      and column_name = 'adesao_plano'
      and data_type = 'text'
  ) then
    alter table public.checkins rename column adesao_plano to adesao_plano_texto;
    -- A restricao antiga acompanha a coluna renomeada, entao some do
    -- caminho da coluna nova.
    alter table public.checkins drop constraint if exists checkins_adesao_plano_check;
  end if;
end $$;

alter table public.checkins
  add column if not exists semana int,
  add column if not exists adesao_plano int,
  add column if not exists saciedade int,
  add column if not exists controle_vontade int,
  add column if not exists hidratacao int,
  add column if not exists digestao int,
  add column if not exists sono int,
  add column if not exists recuperacao_energia int,
  add column if not exists humor int,
  add column if not exists tranquilidade int,
  add column if not exists semana_geral int,
  add column if not exists alerta_clinico text;

-- Uma restricao unica para as dez notas, mais simples de manter do
-- que dez restricoes separadas.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'checkins_notas_ck'
  ) then
    alter table public.checkins add constraint checkins_notas_ck check (
      (adesao_plano        is null or adesao_plano        between 0 and 10) and
      (saciedade           is null or saciedade           between 0 and 10) and
      (controle_vontade    is null or controle_vontade    between 0 and 10) and
      (hidratacao          is null or hidratacao          between 0 and 10) and
      (digestao            is null or digestao            between 0 and 10) and
      (sono                is null or sono                between 0 and 10) and
      (recuperacao_energia is null or recuperacao_energia between 0 and 10) and
      (humor               is null or humor               between 0 and 10) and
      (tranquilidade       is null or tranquilidade       between 0 and 10) and
      (semana_geral        is null or semana_geral        between 0 and 10)
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. Links de check-in, um por paciente e por semana
-- ------------------------------------------------------------
create table if not exists public.checkin_links (
  id uuid primary key default gen_random_uuid(),

  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  patient_id uuid not null
    references public.patients (id) on delete cascade,

  semana int,

  -- Texto, e nao uuid, para seguir o formato das referencias,
  -- do tipo pt_597044_s12_5c5525.
  token text not null unique,

  status text not null default 'gerado'
    check (status in ('gerado', 'enviado', 'respondido', 'expirado')),

  gerado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '7 days'),

  checkin_id uuid references public.checkins (id) on delete set null
);

create index if not exists checkin_links_owner_status_idx
  on public.checkin_links (owner, status, gerado_em desc);

create index if not exists checkin_links_patient_idx
  on public.checkin_links (patient_id, semana);

alter table public.checkin_links enable row level security;

drop policy if exists "links: ler os proprios" on public.checkin_links;
create policy "links: ler os proprios"
  on public.checkin_links for select to authenticated
  using (owner = auth.uid());

drop policy if exists "links: inserir os proprios" on public.checkin_links;
create policy "links: inserir os proprios"
  on public.checkin_links for insert to authenticated
  with check (
    owner = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.id = checkin_links.patient_id and p.owner = auth.uid()
    )
  );

drop policy if exists "links: atualizar os proprios" on public.checkin_links;
create policy "links: atualizar os proprios"
  on public.checkin_links for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "links: excluir os proprios" on public.checkin_links;
create policy "links: excluir os proprios"
  on public.checkin_links for delete to authenticated
  using (owner = auth.uid());

-- ------------------------------------------------------------
-- 3b. Conserta a funcao publica antiga
--
-- submit_checkin gravava texto em adesao_plano. Depois do rename
-- acima, essa coluna e inteira, e a funcao quebraria o formulario que
-- esta no ar. Aqui ela passa a gravar em adesao_plano_texto. A funcao
-- inteira e recriada para o comportamento ficar explicito.
-- ------------------------------------------------------------
create or replace function public.submit_checkin(
  p_token  uuid,
  p_peso   numeric default null,
  p_adesao text    default null,
  p_sono   text    default null,
  p_fome   text    default null,
  p_dias   int     default null,
  p_obs    text    default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_checkin_id uuid;
begin
  select p.id into v_patient_id
  from public.patients p
  where p.access_token = p_token;

  if v_patient_id is null then
    raise exception 'Link de check-in invalido.'
      using errcode = '22023';
  end if;

  insert into public.checkins (
    patient_id,
    peso_kg,
    adesao_plano_texto,
    qualidade_sono,
    nivel_fome,
    dias_atividade_fisica,
    observacoes
  )
  values (
    v_patient_id,
    p_peso,
    nullif(btrim(p_adesao), ''),
    nullif(btrim(p_sono), ''),
    nullif(btrim(p_fome), ''),
    p_dias,
    nullif(btrim(p_obs), '')
  )
  returning id into v_checkin_id;

  return v_checkin_id;
end;
$$;

revoke all on function public.submit_checkin(uuid, numeric, text, text, text, int, text) from public;
grant execute on function public.submit_checkin(uuid, numeric, text, text, text, int, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Funcoes publicas por token do link
--
-- Nomes novos, para nao derrubar get_checkin_patient e submit_checkin,
-- que o formulario atual ainda usa. As duas antigas saem de cena na
-- etapa 2, quando o formulario rico entrar no lugar.
-- ------------------------------------------------------------

-- Valida o token e devolve o minimo necessario para montar a tela.
-- Devolve so o primeiro nome: se o link vazar, o estranho ve
-- "Ola, Maria" e nada mais.
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
    and l.status <> 'respondido'
    and l.expira_em > now();
$$;

revoke all on function public.get_checkin_link(text) from public;
grant execute on function public.get_checkin_link(text) to anon, authenticated;

-- Grava o check-in rico e fecha o link. O patient_id e a semana saem
-- do link, nunca do navegador, entao ninguem grava no prontuario
-- alheio adulterando o formulario.
create or replace function public.submit_checkin_link(
  p_token        text,
  p_peso         numeric default null,
  p_adesao       int     default null,
  p_saciedade    int     default null,
  p_controle     int     default null,
  p_hidratacao   int     default null,
  p_digestao     int     default null,
  p_sono         int     default null,
  p_recuperacao  int     default null,
  p_humor        int     default null,
  p_tranquilidade int    default null,
  p_geral        int     default null,
  p_alerta       text    default null,
  p_obs          text    default null
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
    alerta_clinico, observacoes
  )
  values (
    v_link.patient_id, v_link.semana, p_peso,
    p_adesao, p_saciedade, p_controle, p_hidratacao, p_digestao,
    p_sono, p_recuperacao, p_humor, p_tranquilidade, p_geral,
    nullif(btrim(p_alerta), ''), nullif(btrim(p_obs), '')
  )
  returning id into v_checkin_id;

  update public.checkin_links
  set status = 'respondido', checkin_id = v_checkin_id
  where id = v_link.id;

  return v_checkin_id;
end;
$$;

revoke all on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int, text, text
) from public;
grant execute on function public.submit_checkin_link(
  text, numeric, int, int, int, int, int, int, int, int, int, int, text, text
) to anon, authenticated;
