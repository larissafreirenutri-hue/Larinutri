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
          className="block font-sans text-sm text-creme/80"
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
          className="mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme outline-none focus:border-dourado focus:ring-1 focus:ring-dourado"
        >
          <option value="">Todos os pacientes</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id} className="bg-marrom">
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block font-sans text-sm text-creme/80">Período</span>
        <div className="mt-2 flex gap-1">
          {PERIODOS.map((p) => (
            <Link
              key={p.chave}
              href={`/painel/checkins?periodo=${p.chave}`}
              aria-current={periodo === p.chave ? "true" : undefined}
              className={`rounded-md border px-3 py-2 font-sans text-xs transition ${
                periodo === p.chave
                  ? "border-dourado bg-dourado/15 text-dourado"
                  : "border-dourado/25 text-creme/60 hover:text-creme"
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
