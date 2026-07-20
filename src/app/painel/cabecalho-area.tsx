export function CabecalhoArea({
  titulo,
  apoio,
  acao,
}: {
  titulo: string;
  apoio?: string;
  acao?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-dourado/15 pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl text-creme">{titulo}</h1>
        {apoio ? (
          <p className="mt-2 max-w-prose font-sans text-sm text-creme/60">
            {apoio}
          </p>
        ) : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </header>
  );
}

/** Aviso padrão das áreas que ainda não foram construídas. */
export function EmConstrucao({ oQueVem }: { oQueVem: string }) {
  return (
    <div className="mt-10 rounded-lg border border-dashed border-dourado/30 px-6 py-14 text-center">
      <p className="font-display text-xl text-dourado">Em construção</p>
      <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-creme/60">
        {oQueVem}
      </p>
    </div>
  );
}
