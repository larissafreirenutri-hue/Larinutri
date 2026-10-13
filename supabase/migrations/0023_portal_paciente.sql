-- ============================================================
-- Portal do paciente, Fase 1: papeis, vinculo de conta e acesso
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- SEGURANCA (LGPD, dado de saude)
-- O paciente autenticado so enxerga o proprio registro e os
-- proprios check-ins, via RLS por patients.auth_user_id = auth.uid().
-- A nutricionista continua vendo tudo o que e dela, por owner.
-- As duas politicas convivem, o Postgres aplica OR entre elas.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Vinculo da conta de auth ao registro do paciente
-- ------------------------------------------------------------
alter table public.patients
  add column if not exists auth_user_id uuid
    references auth.users (id) on delete set null,
  add column if not exists acesso_status text not null default 'sem_acesso'
    check (acesso_status in ('sem_acesso', 'convidado', 'ativo'));

-- Um registro de paciente por conta de auth, no maximo.
create unique index if not exists patients_auth_user_id_key
  on public.patients (auth_user_id)
  where auth_user_id is not null;

-- ------------------------------------------------------------
-- 2. Papel de cada usuario
--
-- ABORDAGEM
-- O papel vive em dois lugares, com proposito distinto:
--  a) auth.users.raw_app_meta_data->>'role', escrito so pelo servidor
--     com a Secret key, nunca pelo usuario. Vai no JWT, entao o proxy
--     roteia por papel sem bater no banco. 'paciente' para o portal,
--     ausente para a nutricionista, que e o padrao.
--  b) a tabela profiles abaixo, o registro duravel e consultavel do
--     papel. A conta da nutricionista entra aqui com 'nutricionista'.
--
-- O controle de DADOS nao depende do papel, e sim do RLS por
-- auth_user_id e owner. O papel serve ao roteamento e a clareza.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  role text not null default 'paciente'
    check (role in ('nutricionista', 'paciente')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada um le so o proprio perfil. A escrita acontece pelo servidor
-- com a Secret key, que ignora o RLS.
drop policy if exists "profiles: ler o proprio" on public.profiles;
create policy "profiles: ler o proprio"
  on public.profiles for select to authenticated
  using (user_id = auth.uid());

-- Semente: as contas que ja existem sao da nutricionista. Novos
-- pacientes entram com 'paciente' pelo fluxo de primeiro acesso.
insert into public.profiles (user_id, role)
  select id, 'nutricionista' from auth.users
  on conflict (user_id) do nothing;

-- ------------------------------------------------------------
-- 3. Convites de primeiro acesso
--
-- Token unico e temporario, no mesmo espirito do link de check-in. A
-- Larissa gera, copia e manda pelo WhatsApp. O paciente abre, define a
-- propria senha, e a conta vira ativa. O consumo roda no servidor com
-- a Secret key, entao o RLS abaixo cobre so o que a Larissa faz.
-- ------------------------------------------------------------
create table if not exists public.patient_invites (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  patient_id uuid not null
    references public.patients (id) on delete cascade,
  token text not null unique,
  expira_em timestamptz not null,
  consumido_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists patient_invites_patient_idx
  on public.patient_invites (patient_id);

alter table public.patient_invites enable row level security;

drop policy if exists "convites: ler os proprios" on public.patient_invites;
create policy "convites: ler os proprios"
  on public.patient_invites for select to authenticated
  using (owner = auth.uid());

drop policy if exists "convites: inserir os proprios" on public.patient_invites;
create policy "convites: inserir os proprios"
  on public.patient_invites for insert to authenticated
  with check (
    owner = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.id = patient_invites.patient_id and p.owner = auth.uid()
    )
  );

drop policy if exists "convites: atualizar os proprios" on public.patient_invites;
create policy "convites: atualizar os proprios"
  on public.patient_invites for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "convites: excluir os proprios" on public.patient_invites;
create policy "convites: excluir os proprios"
  on public.patient_invites for delete to authenticated
  using (owner = auth.uid());

-- ------------------------------------------------------------
-- 4. RLS: o paciente le so os proprios dados
--
-- Politicas novas e permissivas, que convivem com as da nutricionista.
-- So concedem SELECT. O paciente nao tem politica de escrita em
-- patients nem em checkins, entao nao consegue alterar nada nesta fase.
-- ------------------------------------------------------------
drop policy if exists "patients: o paciente le o proprio" on public.patients;
create policy "patients: o paciente le o proprio"
  on public.patients for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "checkins: o paciente le os proprios" on public.checkins;
create policy "checkins: o paciente le os proprios"
  on public.checkins for select to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = checkins.patient_id
        and p.auth_user_id = auth.uid()
    )
  );
