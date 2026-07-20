"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const PERIODOS = [
  { chave: "7", rotulo: "7 dias" },
  { chave: "30", rotulo: "30 dias" },
  { chave: "90", rotulo: "90 dias" },
  { chave: "tudo", rotulo: "Tudo" },
];

export function Filtros({
  pacientes,
  periodo,
}: {
  pacientes: { id: string; full_name: string }[];
  periodo: string;
}) {
  const router = useRouter();

  return (
    <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-56">
        <label
          htmlFor="paciente"
          className="block font-sans text-sm text-tinta"
        >
          Paciente
        </label>
        <select
          id="paciente"
          defaultValue=""
          // Escolher um paciente leva direto ao histórico dele, que é
          // a visão completa, com evolução de peso e observações.
          onChange={(e) => {
            if (e.target.value) router.push(`/painel/pacientes/${e.target.value}`);
          }}
          className="mt-2 w-full rounded-md border border-linha bg-cartao px-4 py-2.5 font-sans text-sm text-tinta outline-none focus:border-vital focus:ring-1 focus:ring-vital"
        >
          <option value="">Todos os pacientes</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id} className="bg-cartao">
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block font-sans text-sm text-tinta">Período</span>
        <div className="mt-2 flex gap-1">
          {PERIODOS.map((p) => (
            <Link
              key={p.chave}
              href={`/painel/pacientes/checkins?periodo=${p.chave}`}
              aria-current={periodo === p.chave ? "true" : undefined}
              className={`rounded-md border px-3 py-2 font-sans text-xs transition ${
                periodo === p.chave
                  ? "border-vital bg-vital/10 text-vital-fundo"
                  : "border-linha text-neutro hover:text-tinta"
              }`}
            >
              {p.rotulo}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
