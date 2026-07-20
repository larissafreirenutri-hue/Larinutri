import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Checkin, Paciente } from "@/lib/tipos";
import { juntarResumos } from "@/lib/pacientes";
import { CabecalhoArea } from "../cabecalho-area";
import { SubNavegacao } from "./subnavegacao";
import { ListaPacientes } from "./lista-pacientes";
import { NovoPaciente } from "./novo-paciente";

export const metadata: Metadata = {
  title: "Pacientes, Larissa Freire Nutricionista",
};

export default async function PacientesPage() {
  const supabase = await createClient();

  // O RLS limita as duas consultas às linhas desta nutricionista.
  // Os check-ins vêm só com as colunas que o resumo usa, para não
  // trazer as observações inteiras de todo mundo nesta tela.
  const [pacientesRes, checkinsRes] = await Promise.all([
    supabase.from("patients").select("*").order("full_name"),
    supabase
      .from("checkins")
      .select(
        "id, patient_id, created_at, peso_kg, adesao_plano, dias_atividade_fisica",
      ),
  ]);

  const erro = pacientesRes.error ?? checkinsRes.error;

  const pacientes = juntarResumos(
    (pacientesRes.data ?? []) as Paciente[],
    (checkinsRes.data ?? []) as Checkin[],
  );

  return (
    <>
      <CabecalhoArea
        titulo="Pacientes"
        apoio="Cadastro, links de check-in e histórico de cada paciente."
      />
      <SubNavegacao />
      <NovoPaciente />

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          Não foi possível carregar os pacientes. {erro.message}
        </p>
      ) : (
        <ListaPacientes pacientes={pacientes} />
      )}
    </>
  );
}
