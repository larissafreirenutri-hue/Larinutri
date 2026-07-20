/** Folha da marca, extraída do SVG das referências. */
export function Folha({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 21c0-7 4-11 9-12-1 7-5 11-9 12z" fill="#A9723F" />
      <path
        d="M12 21C12 14 8 10 3 9c1 6 4 10 9 11z"
        fill="#7a5030"
        opacity=".55"
      />
    </svg>
  );
}

export function Marca() {
  return (
    <span className="flex items-center gap-2.5">
      <Folha />
      <span className="leading-none">
        <span className="block font-display text-[19px] font-semibold text-sobre-escuro-forte">
          Larissa Freire
        </span>
        <span className="mt-[3px] block font-mono text-[9px] uppercase tracking-[0.14em] text-dourado">
          Nutricionista
        </span>
      </span>
    </span>
  );
}

/** Avatar quadrado com as iniciais, como nas referências. */
export function Avatar({
  nome,
  tamanho = "md",
}: {
  nome: string;
  tamanho?: "sm" | "md" | "lg";
}) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const medidas = {
    sm: "h-8 w-8 text-[11px] rounded-lg",
    md: "h-11 w-11 text-sm rounded-xl",
    lg: "h-16 w-16 text-lg rounded-2xl",
  }[tamanho];

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center bg-areia-clara font-mono font-bold tracking-wide text-vital-fundo ${medidas}`}
    >
      {iniciais || "?"}
    </span>
  );
}
