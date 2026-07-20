-- ============================================================
-- Fase C: view de atividade por paciente
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Por que existe: a Visão geral precisa do último check-in de cada
-- paciente. Agrupar isso no aplicativo exigiria baixar todas as
-- linhas de checkins, e o PostgREST corta em 1000 por padrão. Passado
-- esse volume, um paciente com check-in antigo seria classificado
-- como "nunca respondeu", que é errado. O banco agrupa sem esse teto.
--
-- security_invoker = true faz a view rodar com as permissões de quem
-- consulta, e não da dona da view. Sem isso ela furaria o RLS e uma
-- nutricionista veria a atividade de pacientes de outra.
-- ============================================================

create or replace view public.patient_activity
with (security_invoker = true) as
select
  p.id                as patient_id,
  p.owner             as owner,
  max(c.created_at)   as ultimo_checkin,
  count(c.id)::int    as total_checkins
from public.patients p
left join public.checkins c on c.patient_id = p.id
group by p.id, p.owner;

-- A view não tem RLS própria, ela herda a das tabelas de origem
-- por causa do security_invoker. Basta permitir a leitura.
revoke all on public.patient_activity from public, anon;
grant select on public.patient_activity to authenticated;
