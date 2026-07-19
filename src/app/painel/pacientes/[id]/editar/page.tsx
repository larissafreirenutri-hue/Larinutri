import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/tipos";
import { FormularioPaciente } from "../../../formulario-paciente";

export const metadata: Metadata = {
  title: "Editar paciente, Larissa Freire Nutricionista",
};

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Se o id for de outra nutricionista, o RLS devolve zero linhas
  // e a página vira 404, sem vazar a existência do registro.
  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const paciente = data as Paciente;

  return (
    <section className="mt-10 max-w-2xl">
      <Link
        href={`/painel/pacientes/${paciente.id}`}
        className="font-sans text-sm text-dourado transition hover:text-dourado/80"
      >
        ← Voltar para {paciente.full_name}
      </Link>

      <h2 className="mt-5 font-display text-xl text-dourado">
        Editar paciente
      </h2>

      <div className="mt-5 rounded-lg border border-dourado/25 bg-creme/5 px-6 py-6">
        <FormularioPaciente
          paciente={paciente}
          onCancelar={
            <Link
              href={`/painel/pacientes/${paciente.id}`}
              className="font-sans text-sm text-creme/60 transition hover:text-creme"
            >
              Cancelar
            </Link>
          }
        />
      </div>
    </section>
  );
}
