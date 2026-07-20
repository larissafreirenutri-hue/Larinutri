import { corDaNota } from "@/lib/dimensoes";

export function Cartao({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[18px] border border-linha bg-cartao shadow-cartao ${className}`}
    >
      {children}
    </section>
  );
}

export function Olho({ children }: { children: React.ReactNode }) {
  return <p className="olho">{children}</p>;
}

export function TituloPagina({
  olho,
  titulo,
  apoio,
  acao,
}: {
  olho?: string;
  titulo: string;
  apoio?: string;
  acao?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {olho ? <Olho>{olho}</Olho> : null}
        <h1 className="mt-2 font-display text-[40px] leading-[1.1] text-barra">
          {titulo}
        </h1>
        {apoio ? (
          <p className="mt-2 max-w-2xl font-sans text-[15px] text-neutro">
            {apoio}
          </p>
        ) : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </header>
  );
}

type Tom = "neutro" | "mel" | "argila" | "vital" | "verde";

const TONS: Record<Tom, string> = {
  neutro: "bg-areia-clara text-neutro",
  mel: "bg-mel-suave text-mel-tinta",
  argila: "bg-argila-suave text-argila",
  vital: "bg-vital/15 text-vital-fundo",
  verde: "bg-emerald-100 text-emerald-800",
};

export function Selo({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: Tom;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[13px] font-medium ${TONS[tom]}`}
    >
      {children}
    </span>
  );
}

/** Selo de status de link, com o tom que cada situação pede. */
export function SeloLink({ status }: { status: string }) {
  const tom: Tom =
    status === "respondido"
      ? "vital"
      : status === "enviado"
        ? "mel"
        : status === "expirado"
          ? "argila"
          : "neutro";

  const rotulo = status.charAt(0).toUpperCase() + status.slice(1);
  return <Selo tom={tom}>{rotulo}</Selo>;
}

export function SeloStatusPaciente({ status }: { status: string }) {
  const tom: Tom =
    status === "ativo" ? "vital" : status === "pausado" ? "mel" : "neutro";
  const rotulo = status.charAt(0).toUpperCase() + status.slice(1);
  return <Selo tom={tom}>{rotulo}</Selo>;
}

/**
 * Medidor horizontal de 0 a 10, o elemento central da ficha.
 * A trilha fica na cor areia e o preenchimento na cor da dimensão,
 * exceto quando a nota é baixa, aí vira âmbar ou vermelho.
 */
export function Medidor({
  rotulo,
  nota,
  cor,
}: {
  rotulo: string;
  nota: number | null;
  cor: string;
}) {
  const preenchido = nota === null ? 0 : (nota / 10) * 100;
  const corFinal = nota === null ? "#E4D8C2" : corDaNota(nota, cor);

  return (
    <div className="flex items-center gap-4 py-[7px]">
      <span className="w-[150px] shrink-0 font-sans text-[14.5px] text-tinta sm:w-[170px]">
        {rotulo}
      </span>

      <div
        className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-areia"
        role="img"
        aria-label={`${rotulo}: ${nota === null ? "sem resposta" : `${nota} de 10`}`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${preenchido}%`, backgroundColor: corFinal }}
        />
      </div>

      <span
        className="w-6 shrink-0 text-right font-mono text-[15px] font-bold tabular-nums"
        style={{ color: nota === null ? "#C6B296" : corFinal }}
      >
        {nota === null ? "·" : nota}
      </span>
    </div>
  );
}

export function BotaoPrimario({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-vital px-5 py-2.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export const CLASSE_BOTAO_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-linha bg-cartao px-4 py-2.5 font-sans text-[14px] text-tinta transition hover:border-vital/50";

export const CLASSE_BOTAO_PERIGO =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-argila/35 bg-cartao px-4 py-2.5 font-sans text-[14px] text-argila transition hover:bg-argila-suave";

export const CLASSE_CAMPO =
  "mt-2 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital";

export const CLASSE_ROTULO =
  "block font-sans text-[13px] font-semibold text-tinta";

export function Vazio({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-linha px-6 py-14 text-center">
      <p className="font-display text-xl text-barra">{titulo}</p>
      {texto ? (
        <p className="mx-auto mt-3 max-w-md font-sans text-[14.5px] leading-relaxed text-neutro">
          {texto}
        </p>
      ) : null}
      {acao ? <div className="mt-6 flex justify-center">{acao}</div> : null}
    </div>
  );
}

export function AlertaClinico({ texto }: { texto: string }) {
  return (
    <div className="rounded-r-xl border-l-4 border-argila bg-argila-suave px-4 py-3.5">
      <p className="flex items-center gap-2 font-sans text-[13.5px] font-semibold text-argila">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
          <path
            d="M12 4l9 15H3l9-15z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M12 10v4M12 16.5v.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        Alerta clínico
      </p>
      <p className="mt-2 whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-tinta">
        {texto}
      </p>
    </div>
  );
}
