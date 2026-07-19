import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/tipos";
import { FormularioPaciente } from "./formulario-paciente";
import { BotaoExcluir } from "./botao-excluir";
import { BotaoCopiarLink } from "./botao-copiar-link";

export const metadata: Metadata = {
  title: "Pacientes, Larissa Freire Nutricionista",
};

export default async function PainelPage() {
  const supabase = await createClient();

  // O RLS limita o retorno às linhas desta nutricionista, sem precisar
  // de filtro por owner na consulta.
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  const pacientes = (data ?? []) as Paciente[];

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          Não foi possível carregar os pacientes. {error.message}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl text-dourado">Novo paciente</h2>
        <div className="mt-5 rounded-lg border border-dourado/25 bg-creme/5 px-6 py-6">
          <FormularioPaciente />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-dourado">Pacientes</h2>
          {pacientes.length > 0 ? (
            <span className="font-sans text-xs text-creme/50">
              {pacientes.length}{" "}
              {pacientes.length === 1 ? "cadastrado" : "cadastrados"}
            </span>
          ) : null}
        </div>

        {pacientes.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-dourado/25 px-6 py-12 text-center">
            <p className="font-display text-lg text-creme/70">
              Nenhum paciente cadastrado ainda
            </p>
            <p className="mt-2 font-sans text-sm text-creme/50">
              Use o formulário acima para adicionar o primeiro.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {pacientes.map((paciente) => (
              <li
                key={paciente.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dourado/20 bg-creme/5 px-5 py-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/painel/pacientes/${paciente.id}`}
                    className="font-display text-lg text-creme transition hover:text-dourado"
                  >
                    {paciente.full_name}
                  </Link>
                  <p className="mt-1 font-sans text-sm text-creme/55">
                    {[paciente.phone, paciente.email]
                      .filter(Boolean)
                      .join("  ·  ") || "Sem contato cadastrado"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <BotaoCopiarLink token={paciente.access_token} />
                  <Link
                    href={`/painel/pacientes/${paciente.id}`}
                    className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                  >
                    Histórico
                  </Link>
                  <Link
                    href={`/painel/pacientes/${paciente.id}/editar`}
                    className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                  >
                    Editar
                  </Link>
                  <BotaoExcluir id={paciente.id} nome={paciente.full_name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
