import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/tipos";
import { montarCarteira, type NotasPaciente } from "@/lib/carteira";
import { TituloPagina } from "../ui";
import { Carteira } from "./carteira";
import { NovoPaciente } from "./novo-paciente";

export const metadata: Metadata = {
  title: "Pacientes, Larissa Freire Nutricionista",
};

export default async function PacientesPage() {
  const supabase = await createClient();

  // O RLS limita as duas consultas às linhas desta nutricionista,
  // inclusive na view, que usa security_invoker.
  const [pacientesRes, notasRes] = await Promise.all([
    supabase.from("patients").select("*").order("full_name"),
    supabase.from("patient_scores").select("*"),
  ]);

  const erro = pacientesRes.error ?? notasRes.error;

  const carteira = montarCarteira(
    (pacientesRes.data ?? []) as Paciente[],
    (notasRes.data ?? []) as NotasPaciente[],
  );

  const botaoNovo = <NovoPaciente />;

  return (
    <>
      <TituloPagina olho="Carteira" titulo="Pacientes" acao={botaoNovo} />

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar os pacientes. {erro.message}
        </p>
      ) : (
        <Carteira pacientes={carteira} botaoNovo={botaoNovo} />
      )}
    </>
  );
}
