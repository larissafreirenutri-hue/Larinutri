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
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-linha pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl text-tinta">{titulo}</h1>
        {apoio ? (
          <p className="mt-2 max-w-prose font-sans text-sm text-neutro">
            {apoio}
          </p>
        ) : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </header>
  );
}

