-- ============================================================
-- Etapa 4: notas e tendencia por paciente
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- Por que existe: a coluna NOTA da carteira mostra a nota geral do
-- ultimo check-in e a tendencia comparada com o anterior. Buscar isso
-- no aplicativo exigiria baixar todos os check-ins de todos os
-- pacientes, e o PostgREST corta em 1000 linhas. Passado esse volume,
-- pacientes antigos apareceriam sem nota, o que e falso. A janela do
-- banco resolve sem teto.
--
-- security_invoker = true faz a view rodar com as permissoes de quem
-- consulta. Sem isso ela furaria o RLS.
-- ============================================================

create or replace view public.patient_scores
with (security_invoker = true) as
with com_nota as (
  select
    patient_id,
    semana_geral,
    created_at,
    row_number() over (
      partition by patient_id
      order by created_at desc
    ) as posicao
  from public.checkins
  where semana_geral is not null
)
select
  p.id    as patient_id,
  p.owner as owner,

  -- Data da ultima resposta, considerando qualquer check-in, mesmo
  -- os que vieram sem a nota geral preenchida.
  (
    select max(c.created_at)
    from public.checkins c
    where c.patient_id = p.id
  ) as ultimo_em,

  -- As duas notas gerais mais recentes. A tendencia compara so notas
  -- de verdade, entao um check-in sem nota nao zera a comparacao.
  (
    select n.semana_geral
    from com_nota n
    where n.patient_id = p.id and n.posicao = 1
  ) as nota_atual,

  (
    select n.semana_geral
    from com_nota n
    where n.patient_id = p.id and n.posicao = 2
  ) as nota_anterior,

  (
    select count(*)
    from public.checkins c
    where c.patient_id = p.id
  )::int as total_checkins

from public.patients p;

revoke all on public.patient_scores from public, anon;
grant select on public.patient_scores to authenticated;
