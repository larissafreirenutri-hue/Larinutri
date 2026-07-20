import { formatarData, formatarPeso, formatarVariacao } from "@/lib/formato";

export type PontoPeso = { data: string; peso: number };

const L = 520; // largura da viewBox
const A = 160; // altura da viewBox
const M = { topo: 16, base: 28, esq: 12, dir: 12 };

/**
 * Gráfico de linha em SVG puro, sem biblioteca externa.
 * Escala só o eixo do peso, os pontos ficam igualmente espaçados,
 * que é o suficiente para leitura de tendência.
 */
export function GraficoPeso({ pontos }: { pontos: PontoPeso[] }) {
  if (pontos.length === 0) return null;

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const delta = ultimo.peso - primeiro.peso;

  const pesos = pontos.map((p) => p.peso);
  const min = Math.min(...pesos);
  const max = Math.max(...pesos);
  // Faixa mínima de 1 kg evita que uma variação minúscula vire um pico.
  const faixa = Math.max(max - min, 1);
  const topo = max + faixa * 0.15;
  const base = min - faixa * 0.15;

  const largura = L - M.esq - M.dir;
  const altura = A - M.topo - M.base;

  const x = (i: number) =>
    pontos.length === 1
      ? M.esq + largura / 2
      : M.esq + (i / (pontos.length - 1)) * largura;

  const y = (peso: number) =>
    M.topo + altura - ((peso - base) / (topo - base)) * altura;

  const linha = pontos.map((p, i) => `${x(i)},${y(p.peso)}`).join(" ");
  const area = `${M.esq},${M.topo + altura} ${linha} ${
    x(pontos.length - 1)
  },${M.topo + altura}`;

  const corDelta =
    delta > 0 ? "text-mel-tinta" : delta < 0 ? "text-emerald-700" : "text-neutro";

  return (
    <div className="rounded-lg border border-linha bg-cartao px-6 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-vital-fundo">Evolução do peso</h3>
        <span className="font-sans text-xs text-neutro">
          {pontos.length} {pontos.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-8">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-wider text-neutro">
            Primeiro
          </p>
          <p className="mt-1 font-sans text-sm text-tinta">
            {formatarPeso(primeiro.peso)}
          </p>
          <p className="font-sans text-xs text-neutro">
            {formatarData(primeiro.data)}
          </p>
        </div>

        <div>
          <p className="font-sans text-[11px] uppercase tracking-wider text-neutro">
            Atual
          </p>
          <p className="mt-1 font-sans text-sm text-tinta">
            {formatarPeso(ultimo.peso)}
          </p>
          <p className="font-sans text-xs text-neutro">
            {formatarData(ultimo.data)}
          </p>
        </div>

        <div>
          <p className="font-sans text-[11px] uppercase tracking-wider text-neutro">
            Variação
          </p>
          <p className={`mt-1 font-sans text-sm font-medium ${corDelta}`}>
            {pontos.length === 1 ? "Sem comparação" : formatarVariacao(delta)}
          </p>
          <p className="font-sans text-xs text-neutro">
            {pontos.length === 1 ? "só um registro" : "do primeiro ao atual"}
          </p>
        </div>
      </div>

      {pontos.length > 1 ? (
        <svg
          viewBox={`0 0 ${L} ${A}`}
          className="mt-6 w-full"
          role="img"
          aria-label={`Evolução do peso de ${formatarPeso(
            primeiro.peso,
          )} em ${formatarData(primeiro.data)} para ${formatarPeso(
            ultimo.peso,
          )} em ${formatarData(ultimo.data)}.`}
        >
          <polygon points={area} fill="#E0C7A0" fillOpacity="0.12" />
          <polyline
            points={linha}
            fill="none"
            stroke="#E0C7A0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pontos.map((p, i) => (
            <circle
              key={`${p.data}-${i}`}
              cx={x(i)}
              cy={y(p.peso)}
              r="3.5"
              fill="#4A3220"
              stroke="#E0C7A0"
              strokeWidth="2"
            />
          ))}
          <text
            x={M.esq}
            y={A - 8}
            fill="#F6F1E7"
            fillOpacity="0.45"
            fontSize="11"
          >
            {formatarData(primeiro.data)}
          </text>
          <text
            x={L - M.dir}
            y={A - 8}
            textAnchor="end"
            fill="#F6F1E7"
            fillOpacity="0.45"
            fontSize="11"
          >
            {formatarData(ultimo.data)}
          </text>
        </svg>
      ) : null}
    </div>
  );
}
