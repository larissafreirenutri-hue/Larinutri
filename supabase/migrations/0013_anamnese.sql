-- ============================================================
-- Anamnese, o formulario inicial do paciente
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- Segue o mesmo desenho do check-in: link tokenizado, funcoes
-- publicas SECURITY DEFINER, RLS por owner. A diferenca e que a
-- anamnese e unica por paciente, entao o link nao tem semana, e as
-- respostas vao num jsonb, para as perguntas mudarem no futuro sem
-- migracao de banco.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Respostas da anamnese
-- ------------------------------------------------------------
create table if not exists public.anamneses (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  patient_id uuid not null
    references public.patients (id) on delete cascade,
  respostas jsonb not null,
  -- Uma anamnese ativa por paciente. Refazer marca a anterior como
  -- substituida, sem apagar, para o historico ficar preservado.
  substituida_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists anamneses_patient_idx
  on public.anamneses (patient_id, created_at desc);

-- ------------------------------------------------------------
-- Links de anamnese
-- ------------------------------------------------------------
create table if not exists public.anamnese_links (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  patient_id uuid not null
    references public.patients (id) on delete cascade,
  token text not null unique,
  status text not null default 'gerado'
    check (status in ('gerado', 'enviado', 'respondido', 'expirado')),
  gerado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '14 days'),
  anamnese_id uuid references public.anamneses (id) on delete set null
);

create index if not exists anamnese_links_owner_idx
  on public.anamnese_links (owner, status, gerado_em desc);

create index if not exists anamnese_links_patient_idx
  on public.anamnese_links (patient_id);

-- ------------------------------------------------------------
-- Row Level Security, so o dono ve o que e dele
-- ------------------------------------------------------------
alter table public.anamneses enable row level security;
alter table public.anamnese_links enable row level security;

drop policy if exists "anamneses: ler as proprias" on public.anamneses;
create policy "anamneses: ler as proprias"
  on public.anamneses for select to authenticated
  using (owner = auth.uid());

drop policy if exists "anamneses: inserir as proprias" on public.anamneses;
create policy "anamneses: inserir as proprias"
  on public.anamneses for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "anamneses: atualizar as proprias" on public.anamneses;
create policy "anamneses: atualizar as proprias"
  on public.anamneses for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "anamneses: excluir as proprias" on public.anamneses;
create policy "anamneses: excluir as proprias"
  on public.anamneses for delete to authenticated
  using (owner = auth.uid());

drop policy if exists "anamnese_links: ler os proprios" on public.anamnese_links;
create policy "anamnese_links: ler os proprios"
  on public.anamnese_links for select to authenticated
  using (owner = auth.uid());

drop policy if exists "anamnese_links: inserir os proprios" on public.anamnese_links;
create policy "anamnese_links: inserir os proprios"
  on public.anamnese_links for insert to authenticated
  with check (
    owner = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.id = anamnese_links.patient_id and p.owner = auth.uid()
    )
  );

drop policy if exists "anamnese_links: atualizar os proprios" on public.anamnese_links;
create policy "anamnese_links: atualizar os proprios"
  on public.anamnese_links for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "anamnese_links: excluir os proprios" on public.anamnese_links;
create policy "anamnese_links: excluir os proprios"
  on public.anamnese_links for delete to authenticated
  using (owner = auth.uid());

-- ------------------------------------------------------------
-- Funcao publica 1: valida o token e devolve o primeiro nome
--
-- Devolve so o primeiro nome, igual ao check-in. Se o link vazar, o
-- estranho ve "Ola, Maria" e nada mais.
-- ------------------------------------------------------------
create or replace function public.get_anamnese_link(p_token text)
returns table (primeiro_nome text)
language sql
security definer
set search_path = ''
stable
as $$
  select split_part(btrim(p.full_name), ' ', 1)
  from public.anamnese_links l
  join public.patients p on p.id = l.patient_id
  where l.token = p_token
    and l.status <> 'respondido'
    and l.expira_em > now();
$$;

revoke all on function public.get_anamnese_link(text) from public;
grant execute on function public.get_anamnese_link(text) to anon, authenticated;

-- ------------------------------------------------------------
-- Funcao publica 2: grava as respostas e fecha o link
--
-- Alem de salvar, aproveita para preencher campos do paciente que a
-- anamnese ja respondeu, sem nunca sobrescrever valor existente. E
-- marca qualquer anamnese anterior do paciente como substituida.
-- ------------------------------------------------------------
create or replace function public.submit_anamnese_link(
  p_token     text,
  p_respostas jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.anamnese_links;
  v_anamnese_id uuid;
  v_restricao text;
  v_objetivo text;
begin
  select * into v_link
  from public.anamnese_links
  where token = p_token
    and status <> 'respondido'
    and expira_em > now()
  for update;

  if not found then
    raise exception 'Link de anamnese invalido, expirado ou ja respondido.'
      using errcode = '22023';
  end if;

  if p_respostas is null or jsonb_typeof(p_respostas) <> 'object' then
    raise exception 'Respostas invalidas.' using errcode = '22023';
  end if;

  -- Anamnese anterior do mesmo paciente vira historico.
  update public.anamneses
  set substituida_em = now()
  where patient_id = v_link.patient_id and substituida_em is null;

  insert into public.anamneses (owner, patient_id, respostas)
  values (v_link.owner, v_link.patient_id, p_respostas)
  returning id into v_anamnese_id;

  update public.anamnese_links
  set status = 'respondido', anamnese_id = v_anamnese_id
  where id = v_link.id;

  -- Preenche o paciente com o que a anamnese ja respondeu, sem
  -- sobrescrever. nullif evita gravar string vazia por cima de null.
  v_restricao := nullif(btrim(p_respostas->>'restricao'), '');
  v_objetivo  := nullif(btrim(p_respostas->>'objetivo_texto'), '');

  update public.patients p set
    restricao = coalesce(nullif(btrim(p.restricao), ''), v_restricao),
    objetivo  = coalesce(nullif(btrim(p.objetivo), ''), v_objetivo)
  where p.id = v_link.patient_id;

  return v_anamnese_id;
end;
$$;

revoke all on function public.submit_anamnese_link(text, jsonb) from public;
grant execute on function public.submit_anamnese_link(text, jsonb) to anon, authenticated;
