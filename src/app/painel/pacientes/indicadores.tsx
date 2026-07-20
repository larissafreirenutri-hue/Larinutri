import type { Tendencia } from "@/lib/pacientes";
import { formatarVariacao } from "@/lib/formato";

/**
 * A cor indica a direção do peso, não julgamento. Perder peso não é
 * bom para todo paciente, tem quem esteja em ganho de massa.
 */
const CORES: Record<Tendencia, string> = {
  desceu: "text-emerald-700",
  subiu: "text-mel-tinta",
  estavel: "text-neutro",
};

const SETAS: Record<Tendencia, string> = {
  desceu: "↓",
  subiu: "↑",
  estavel: "→",
};

export function Variacao({
  valor,
  tendencia,
  className = "",
}: {
  valor: number | null;
  tendencia: Tendencia | null;
  className?: string;
}) {
  if (valor === null || tendencia === null) {
    return <span className="font-sans text-sm text-neutro">sem medida</span>;
  }

  return (
    <span
      className={`font-sans font-medium tabular-nums ${CORES[tendencia]} ${className}`}
    >
      <span aria-hidden>{SETAS[tendencia]}</span>{" "}
      {tendencia === "estavel" ? "estável" : formatarVariacao(valor)}
    </span>
  );
}

export function SeloNovo() {
  return (
    <span className="rounded-full bg-vital/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-vital-fundo">
      Novo
    </span>
  );
}

/** Cartão de número grande, no formato dos KPIs do painel antigo. */
export function Kpi({
  rotulo,
  valor,
  rodape,
  destaque,
}: {
  rotulo: string;
  valor: React.ReactNode;
  rodape?: string;
  destaque?: string;
}) {
  return (
    <div className="rounded-xl border border-linha bg-cartao px-5 py-5 transition hover:border-linha">
      <p className="font-sans text-[11px] uppercase tracking-wider text-neutro">
        {rotulo}
      </p>
      <p
        className={`mt-2 font-display text-2xl ${destaque ?? "text-tinta"}`}
      >
        {valor}
      </p>
      {rodape ? (
        <p className="mt-1 font-sans text-xs text-neutro">{rodape}</p>
      ) : null}
    </div>
  );
}

const CORES_ADESAO: Record<string, string> = {
  Alta: "border-emerald-600/40 text-emerald-700",
  Média: "border-linha text-vital-fundo",
  Baixa: "border-argila/35 text-argila",
};

export function SeloAdesao({ valor }: { valor: string }) {
  return (
    <span
      className={`rounded-md border px-2.5 py-1 font-sans text-xs ${
        CORES_ADESAO[valor] ?? "border-linha text-neutro"
      }`}
    >
      {valor}
    </span>
  );
}
