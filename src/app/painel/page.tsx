import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CabecalhoArea } from "./cabecalho-area";

export const metadata: Metadata = {
  title: "Visão geral, Larissa Freire Nutricionista",
};

export default async function VisaoGeralPage() {
  const supabase = await createClient();

  // Só as contagens, o conteúdo real desta tela fica para uma fase futura.
  const [{ count: totalPacientes }, { count: totalCheckins }] =
    await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("checkins").select("id", { count: "exact", head: true }),
    ]);

  return (
    <>
      <CabecalhoArea
        titulo="Visão geral"
        apoio="O resumo do seu consultório em um lugar só."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/painel/pacientes"
          className="rounded-lg border border-dourado/20 bg-creme/5 px-6 py-6 transition hover:border-dourado/40"
        >
          <p className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
            Pacientes
          </p>
          <p className="mt-2 font-display text-3xl text-creme">
            {totalPacientes ?? 0}
          </p>
          <p className="mt-1 font-sans text-xs text-dourado">Ver todos</p>
        </Link>

        <Link
          href="/painel/pacientes/checkins"
          className="rounded-lg border border-dourado/20 bg-creme/5 px-6 py-6 transition hover:border-dourado/40"
        >
          <p className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
            Check-ins recebidos
          </p>
          <p className="mt-2 font-display text-3xl text-creme">
            {totalCheckins ?? 0}
          </p>
          <p className="mt-1 font-sans text-xs text-dourado">Revisar</p>
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-dourado/25 px-6 py-8">
        <p className="font-display text-lg text-dourado">
          Esta tela vai crescer
        </p>
        <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-creme/65">
          Aqui vão entrar os alertas do dia, os pacientes que precisam de
          atenção e o resumo de vendas e financeiro, conforme as próximas áreas
          forem construídas.
        </p>
      </div>
    </>
  );
}
