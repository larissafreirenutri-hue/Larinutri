-- ============================================================
-- Etapa 4: check-ins e acesso público por token
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Desenho de segurança: o papel anon NÃO recebe nenhuma permissão
-- direta na tabela checkins. Todo o acesso público passa pelas duas
-- funções SECURITY DEFINER abaixo, que são a única superfície
-- exposta e só aceitam quem apresenta um access_token válido.
-- ============================================================

-- ------------------------------------------------------------
-- Tabela
-- ------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null
    references public.patients (id) on delete cascade,

  peso_kg numeric
    check (peso_kg is null or (peso_kg > 0 and peso_kg < 500)),

  adesao_plano text
    check (adesao_plano is null or adesao_plano in ('Baixa', 'Média', 'Alta')),

  qualidade_sono text
    check (qualidade_sono is null or qualidade_sono in ('Ruim', 'Regular', 'Boa', 'Ótima')),

  nivel_fome text
    check (nivel_fome is null or nivel_fome in ('Baixa', 'Moderada', 'Alta')),

  dias_atividade_fisica int
    check (dias_atividade_fisica is null or dias_atividade_fisica between 0 and 7),

  observacoes text,

  created_at timestamptz not null default now()
);

-- Listagem da etapa 5, por paciente e mais recentes primeiro.
create index if not exists checkins_patient_created_at_idx
  on public.checkins (patient_id, created_at desc);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.checkins enable row level security;

-- Leitura só para a nutricionista, e só dos check-ins de pacientes dela.
-- Sem política de insert, ninguém escreve direto na tabela pela API.
drop policy if exists "checkins: ler os dos meus pacientes" on public.checkins;
create policy "checkins: ler os dos meus pacientes"
  on public.checkins
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = checkins.patient_id
        and p.owner = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Função pública 1: validar o token e devolver o primeiro nome
--
-- SECURITY DEFINER roda com os privilégios da dona da função, então
-- enxerga a tabela apesar do RLS. Devolve só o primeiro nome de
-- propósito: se o link vazar, o estrago é menor do que expor o nome
-- completo, o e-mail ou o telefone. Token inválido devolve nulo.
-- ------------------------------------------------------------
create or replace function public.get_checkin_patient(p_token uuid)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select split_part(btrim(p.full_name), ' ', 1)
  from public.patients p
  where p.access_token = p_token;
$$;

revoke all on function public.get_checkin_patient(uuid) from public;
grant execute on function public.get_checkin_patient(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- Função pública 2: gravar o check-in
--
-- O paciente nunca informa o patient_id, ele é resolvido aqui a partir
-- do token. Assim ninguém consegue gravar um check-in no prontuário
-- de outra pessoa, mesmo adulterando o formulário.
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
    raise exception 'Link de check-in inválido.'
      using errcode = '22023';
  end if;

  insert into public.checkins (
    patient_id,
    peso_kg,
    adesao_plano,
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
