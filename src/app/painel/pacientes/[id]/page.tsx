import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CheckinComPaciente, Paciente } from "@/lib/tipos";
import { CartaoCheckin } from "../cartao-checkin";
import { BotaoCopiarLink } from "../botao-copiar-link";
import { GraficoPeso, type PontoPeso } from "../grafico-peso";

export const metadata: Metadata = {
  title: "Histórico do paciente, Larissa Freire Nutricionista",
};

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dadosPaciente } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // RLS devolve zero linhas para paciente de outra nutricionista,
  // então vira 404 sem revelar que o registro existe.
  if (!dadosPaciente) {
    notFound();
  }

  const paciente = dadosPaciente as Paciente;

  // Ordem cronológica, do mais antigo para o mais novo, que é como se
  // lê a evolução de um acompanhamento.
  const { data: dadosCheckins, error } = await supabase
    .from("checkins")
    .select("*, patients(id, full_name)")
    .eq("patient_id", id)
    .order("created_at", { ascending: true });

  const checkins = (dadosCheckins ?? []) as CheckinComPaciente[];

  const pontosPeso: PontoPeso[] = checkins
    .filter((c) => c.peso_kg !== null)
    .map((c) => ({ data: c.created_at, peso: c.peso_kg as number }));

  return (
    <>
      <section className="mt-10">
        <Link
          href="/painel/pacientes"
          className="font-sans text-sm text-dourado transition hover:text-dourado/80"
        >
          ← Voltar aos pacientes
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-creme">
              {paciente.full_name}
            </h2>
            <p className="mt-1 font-sans text-sm text-creme/55">
              {[paciente.phone, paciente.email].filter(Boolean).join("  ·  ") ||
                "Sem contato cadastrado"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BotaoCopiarLink token={paciente.access_token} />
            <Link
              href={`/painel/pacientes/${paciente.id}/editar`}
              className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
            >
              Editar
            </Link>
          </div>
        </div>

        {paciente.notes ? (
          <div className="mt-5 rounded-lg border border-dourado/20 bg-creme/5 px-5 py-4">
            <p className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
              Observações da nutricionista
            </p>
            <p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-creme/80">
              {paciente.notes}
            </p>
          </div>
        ) : null}
      </section>

      {error ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          Não foi possível carregar os check-ins. {error.message}
        </p>
      ) : null}

      {pontosPeso.length > 0 ? (
        <section className="mt-10">
          <GraficoPeso pontos={pontosPeso} />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl text-dourado">
            Histórico de check-ins
          </h3>
          {checkins.length > 0 ? (
            <span className="font-sans text-xs text-creme/50">
              {checkins.length}{" "}
              {checkins.length === 1 ? "resposta" : "respostas"}
            </span>
          ) : null}
        </div>

        {checkins.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-dourado/25 px-6 py-12 text-center">
            <p className="font-display text-lg text-creme/70">
              Nenhum check-in recebido ainda
            </p>
            <p className="mt-2 font-sans text-sm text-creme/50">
              Copie o link acima e envie para {paciente.full_name.split(" ")[0]}.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {checkins.map((checkin) => (
              <CartaoCheckin key={checkin.id} checkin={checkin} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
