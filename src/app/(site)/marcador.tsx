import { ehPendente, type Texto } from "@/lib/conteudo";

/**
 * Mostra o texto real, ou um aviso dourado bem visível quando o
 * conteúdo ainda não foi preenchido. A intenção é ser impossível
 * de ignorar, para nada entrar no ar pela metade.
 */
export function Falta({ o }: { o: string }) {
  return (
    <span className="inline-block rounded border border-dashed border-dourado/70 bg-dourado/10 px-2 py-0.5 font-sans text-xs font-medium text-dourado">
      A preencher: {o}
    </span>
  );
}

export function Conteudo({
  valor,
  className,
}: {
  valor: Texto;
  className?: string;
}) {
  if (ehPendente(valor)) {
    return <Falta o={valor.__pendente} />;
  }
  return <span className={className}>{valor}</span>;
}

/** Texto longo, com quebra de parágrafo respeitada. */
export function Paragrafos({
  valor,
  className,
}: {
  valor: Texto;
  className?: string;
}) {
  if (ehPendente(valor)) {
    return <Falta o={valor.__pendente} />;
  }

  return (
    <>
      {valor
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}
