import type { SemanaEngajamento } from "@/lib/triagem";
import { Cartao } from "./ui";

/**
 * Barras pareadas, enviados ao lado de respondidos, como na referência.
 * CSS puro, sem SVG e sem biblioteca.
 */
export function Engajamento({ semanas }: { semanas: SemanaEngajamento[] }) {
  const maior = Math.max(1, ...semanas.map((s) => Math.max(s.enviados, s.respondidos)));
  const temDados = semanas.some((s) => s.enviados > 0);

  return (
    <Cartao>
      <header className="flex items-baseline justify-between border-b border-linha px-6 py-5">
        <h2 className="font-display text-[21px] text-barra">
          Engajamento com check-ins
        </h2>
        <span className="font-mono text-[12px] text-neutro">
          {semanas.length} semanas
        </span>
      </header>

      <div className="px-6 py-5">
        {!temDados ? (
          <p className="py-8 text-center font-sans text-[14.5px] text-neutro">
            Nenhum link gerado neste período ainda.
          </p>
        ) : (
          <>
            <ul className="flex h-40 items-end gap-3">
              {semanas.map((s) => (
                <li
                  key={s.rotulo}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div className="flex h-full items-end justify-center gap-1">
                    <div
                      className="w-1/2 max-w-4 rounded-t bg-areia"
                      style={{ height: `max(${(s.enviados / maior) * 100}%, ${s.enviados > 0 ? 3 : 0}px)` }}
                      role="img"
                      aria-label={`${s.rotulo}: ${s.enviados} enviados`}
                    />
                    <div
                      className="w-1/2 max-w-4 rounded-t bg-vital"
                      style={{ height: `max(${(s.respondidos / maior) * 100}%, ${s.respondidos > 0 ? 3 : 0}px)` }}
                      role="img"
                      aria-label={`${s.rotulo}: ${s.respondidos} respondidos`}
                    />
                  </div>
                  <span className="text-center font-mono text-[11px] text-neutro">
                    {s.rotulo}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-5">
              <span className="flex items-center gap-2 font-sans text-[13.5px] text-neutro">
                <span className="h-2.5 w-2.5 rounded-sm bg-areia" />
                Enviados
              </span>
              <span className="flex items-center gap-2 font-sans text-[13.5px] text-neutro">
                <span className="h-2.5 w-2.5 rounded-sm bg-vital" />
                Respondidos
              </span>
            </div>
          </>
        )}
      </div>
    </Cartao>
  );
}
