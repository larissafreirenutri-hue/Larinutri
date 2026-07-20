import { formatarMoeda } from "@/lib/formato";
import type { MesResumo } from "@/lib/financeiro";

/** Barras em CSS puro, sem SVG e sem biblioteca. */
export function GraficoReceita({ meses }: { meses: MesResumo[] }) {
  const maior = Math.max(...meses.map((m) => m.valor), 1);
  const temDados = meses.some((m) => m.valor > 0);

  return (
    <div className="rounded-xl border border-dourado/20 bg-creme/5 px-6 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-lg text-dourado">
          Receita recebida por mês
        </h2>
        <span className="font-sans text-xs text-creme/40">últimos 6 meses</span>
      </div>

      {!temDados ? (
        <p className="mt-6 font-sans text-sm text-creme/45">
          Nenhuma receita recebida neste período ainda.
        </p>
      ) : (
        <ul className="mt-7 flex h-44 items-end gap-2 sm:gap-4">
          {meses.map((mes) => {
            const altura = (mes.valor / maior) * 100;

            return (
              <li
                key={mes.chave}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="font-sans text-[10px] tabular-nums text-creme/50 sm:text-xs">
                  {mes.valor > 0 ? formatarMoeda(mes.valor) : ""}
                </span>
                <div
                  className="w-full rounded-t bg-dourado/70 transition-all"
                  // Piso de 2px para um mês com valor mínimo ainda aparecer.
                  style={{ height: `max(${altura}%, ${mes.valor > 0 ? 2 : 0}px)` }}
                  role="img"
                  aria-label={`${mes.rotulo}: ${formatarMoeda(mes.valor)}`}
                />
                <span className="font-sans text-xs capitalize text-creme/45">
                  {mes.rotulo}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
