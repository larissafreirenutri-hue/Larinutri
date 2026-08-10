-- ============================================================
-- Sessão estratégica: captação de lead pelo site público
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- O visitante do site nunca está autenticado, então a gravação do
-- lead passa por uma função SECURITY DEFINER, no mesmo espírito do
-- check-in público. A função roda com os privilégios da dona da
-- função e resolve o owner sozinha, sem o navegador poder escolher
-- em nome de quem o lead é criado.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: quem é a dona do sistema
--
-- O sistema é de uma nutricionista só, então o owner de um lead
-- vindo do site é sempre ela. Resolvemos a partir de quem já é dona
-- dos dados do sistema (pacientes, depois leads), com a conta mais
-- antiga como último recurso. Se um dia o sistema virar multiusuário,
-- este é o ponto a repensar.
-- ------------------------------------------------------------
create or replace function public.dona_do_sistema()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select p.owner from public.patients p limit 1),
    (select l.owner from public.leads l limit 1),
    (select u.id from auth.users u order by u.created_at asc limit 1)
  );
$$;

revoke all on function public.dona_do_sistema() from public;
-- Não é exposta a anon. Só a função de criar lead a usa, por dentro.

-- ------------------------------------------------------------
-- Função pública: criar um lead a partir do site
--
-- O navegador manda nome, telefone, e-mail e as respostas já
-- concatenadas em texto legível. O owner e a etapa inicial são
-- decididos aqui, nunca pelo cliente.
-- ------------------------------------------------------------
create or replace function public.criar_lead_site(
  p_nome        text,
  p_phone       text,
  p_email       text default null,
  p_observacoes text default null,
  p_origem      text default 'Site, sessão estratégica'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner   uuid;
  v_nome    text := btrim(coalesce(p_nome, ''));
  v_lead_id uuid;
begin
  if length(v_nome) = 0 then
    raise exception 'Informe o seu nome.'
      using errcode = '22023';
  end if;

  v_owner := public.dona_do_sistema();
  if v_owner is null then
    raise exception 'Não foi possível registrar o contato agora.'
      using errcode = '22023';
  end if;

  insert into public.leads (
    owner,
    nome,
    phone,
    email,
    origem,
    etapa,
    observacoes
  )
  values (
    v_owner,
    left(v_nome, 200),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_email, '')), ''),
    coalesce(nullif(btrim(p_origem), ''), 'Site, sessão estratégica'),
    'Novo',
    nullif(btrim(coalesce(p_observacoes, '')), '')
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.criar_lead_site(text, text, text, text, text) from public;
grant execute on function public.criar_lead_site(text, text, text, text, text) to anon, authenticated;
