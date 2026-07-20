import Link from "next/link";
import type { CheckinComPaciente } from "@/lib/tipos";
import { formatarDataHora, formatarPeso } from "@/lib/formato";
import { adesaoDoCheckin, normalizarAdesao } from "@/lib/notas";

function Medida({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null;

  return (
    <div>
      <dt className="font-sans text-[11px] uppercase tracking-wider text-neutro">
        {rotulo}
      </dt>
      <dd className="mt-0.5 font-sans text-sm text-tinta">{valor}</dd>
    </div>
  );
}

export function CartaoCheckin({
  checkin,
  mostrarPaciente = false,
  destacado = false,
}: {
  checkin: CheckinComPaciente;
  mostrarPaciente?: boolean;
  /** Realça check-ins recentes, que são os que pedem atenção. */
  destacado?: boolean;
}) {
  const medidas = [
    { rotulo: "Peso", valor: formatarPeso(checkin.peso_kg) },
    { rotulo: "Adesão", valor: normalizarAdesao(adesaoDoCheckin(checkin)) },
    { rotulo: "Sono", valor: checkin.qualidade_sono },
    { rotulo: "Fome", valor: checkin.nivel_fome },
    {
      rotulo: "Atividade",
      valor:
        checkin.dias_atividade_fisica === null
          ? null
          : `${checkin.dias_atividade_fisica} ${
              checkin.dias_atividade_fisica === 1 ? "dia" : "dias"
            }`,
    },
  ];

  const preenchidas = medidas.filter((m) => m.valor);

  return (
    <li
      className={`rounded-xl border px-5 py-4 transition ${
        destacado
          ? "border-linha bg-vital/[0.07]"
          : "border-linha bg-cartao hover:border-linha"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {mostrarPaciente && checkin.patients ? (
          <Link
            href={`/painel/pacientes/${checkin.patients.id}`}
            className="font-display text-lg text-tinta transition hover:text-vital-fundo"
          >
            {checkin.patients.full_name}
          </Link>
        ) : (
          <span className="font-display text-lg text-tinta">
            {formatarDataHora(checkin.created_at)}
          </span>
        )}

        {mostrarPaciente ? (
          <span className="font-sans text-xs text-neutro">
            {formatarDataHora(checkin.created_at)}
          </span>
        ) : null}
      </div>

      {preenchidas.length > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
          {preenchidas.map((m) => (
            <Medida key={m.rotulo} rotulo={m.rotulo} valor={m.valor} />
          ))}
        </dl>
      ) : (
        <p className="mt-3 font-sans text-sm text-neutro">
          Nenhuma medida preenchida neste check-in.
        </p>
      )}

      {checkin.observacoes ? (
        <details className="group mt-4">
          <summary className="cursor-pointer font-sans text-xs text-vital-fundo transition hover:text-vital">
            <span className="group-open:hidden">Ver observações</span>
            <span className="hidden group-open:inline">Ocultar observações</span>
          </summary>
          <p className="mt-3 whitespace-pre-wrap border-l-2 border-linha pl-4 font-sans text-sm leading-relaxed text-neutro">
            {checkin.observacoes}
          </p>
        </details>
      ) : null}
    </li>
  );
}
