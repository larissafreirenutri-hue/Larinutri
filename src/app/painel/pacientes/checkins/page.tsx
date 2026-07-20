import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { CheckinComPaciente, Paciente } from "@/lib/tipos";
import { CartaoCheckin } from "../cartao-checkin";
import { SubNavegacao } from "../subnavegacao";
import { CabecalhoArea } from "../../cabecalho-area";
import { Filtros } from "./filtros";

export const metadata: Metadata = {
  title: "Check-ins, Larissa Freire Nutricionista",
};

const DIAS: Record<string, number> = { "7": 7, "30": 30, "90": 90 };

export default async function CheckinsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: bruto } = await searchParams;
  const periodo = bruto && (DIAS[bruto] || bruto === "tudo") ? bruto : "30";

  const supabase = await createClient();

  // O join traz o nome do paciente. O RLS das duas tabelas continua
  // valendo, então só vêm check-ins de pacientes desta nutricionista.
  let consulta = supabase
    .from("checkins")
    .select("*, patients(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (periodo !== "tudo") {
    const corte = new Date();
    corte.setDate(corte.getDate() - DIAS[periodo]);
    consulta = consulta.gte("created_at", corte.toISOString());
  }

  const [{ data: dadosCheckins, error }, { data: dadosPacientes }] =
    await Promise.all([
      consulta,
      supabase.from("patients").select("id, full_name").order("full_name"),
    ]);

  const checkins = (dadosCheckins ?? []) as CheckinComPaciente[];
  const pacientes = (dadosPacientes ?? []) as Pick<
    Paciente,
    "id" | "full_name"
  >[];

  return (
    <>
      <CabecalhoArea
        titulo="Pacientes"
        apoio="Cadastro, links de check-in e histórico de cada paciente."
      />
      <SubNavegacao />

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-vital-fundo">
            Check-ins recebidos
          </h2>
          {checkins.length > 0 ? (
            <span className="font-sans text-xs text-neutro">
              {checkins.length}{" "}
              {checkins.length === 1 ? "resposta" : "respostas"}
            </span>
          ) : null}
        </div>

        <Filtros pacientes={pacientes} periodo={periodo} />
      </section>

      {error ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar os check-ins. {error.message}
        </p>
      ) : checkins.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-linha px-6 py-12 text-center">
          <p className="font-display text-lg text-neutro">
            {periodo === "tudo"
              ? "Nenhum check-in recebido ainda"
              : "Nenhum check-in neste período"}
          </p>
          <p className="mt-2 font-sans text-sm text-neutro">
            {periodo === "tudo"
              ? "Copie o link de check-in de um paciente e envie para ele."
              : "Experimente ampliar o período acima."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {checkins.map((checkin) => (
            <CartaoCheckin key={checkin.id} checkin={checkin} mostrarPaciente />
          ))}
        </ul>
      )}
    </>
  );
}
