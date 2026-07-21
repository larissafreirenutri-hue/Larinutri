-- ============================================================
-- Politica de UPDATE para checkins
-- Rodar no Supabase, SQL Editor. Idempotente.
--
-- Copie pelo botao de copiar do GitHub, e nao do chat.
--
-- CAUSA DO BUG DA ESTEIRA: a tabela checkins so tinha politica de
-- SELECT. O insert vem das funcoes SECURITY DEFINER, que ignoram RLS,
-- entao nunca precisou de politica de insert. Mas mover um cartao na
-- esteira e um UPDATE feito pela nutricionista com a chave publishable,
-- e sem politica de UPDATE o RLS nega em silencio: o update afeta zero
-- linhas e retorna sem erro, entao o cartao volta ao recarregar.
--
-- A politica espelha a de SELECT: a nutricionista so atualiza check-ins
-- de pacientes que sao dela. O using filtra quais linhas ela alcanca,
-- e o with check impede que a alteracao mova o check-in para um
-- paciente que nao e dela.
-- ============================================================

drop policy if exists "checkins: atualizar os dos meus pacientes" on public.checkins;
create policy "checkins: atualizar os dos meus pacientes"
  on public.checkins
  for update
  to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = checkins.patient_id and p.owner = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = checkins.patient_id and p.owner = auth.uid()
    )
  );
