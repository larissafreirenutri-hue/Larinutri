const baseInput =
  "mt-2 w-full rounded-md border border-linha bg-cartao px-4 py-2.5 font-sans text-sm text-tinta placeholder:text-neutro outline-none focus:border-vital focus:ring-1 focus:ring-vital";

export function Campo({
  id,
  rotulo,
  tipo = "text",
  obrigatorio = false,
  padrao,
  dica,
}: {
  id: string;
  rotulo: string;
  tipo?: string;
  obrigatorio?: boolean;
  padrao?: string | null;
  dica?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-sm text-tinta">
        {rotulo}
        {obrigatorio ? <span className="text-vital-fundo"> *</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        required={obrigatorio}
        defaultValue={padrao ?? ""}
        placeholder={dica}
        className={baseInput}
      />
    </div>
  );
}

export function CampoTexto({
  id,
  rotulo,
  padrao,
  dica,
}: {
  id: string;
  rotulo: string;
  padrao?: string | null;
  dica?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-sm text-tinta">
        {rotulo}
      </label>
      <textarea
        id={id}
        name={id}
        rows={3}
        defaultValue={padrao ?? ""}
        placeholder={dica}
        className={`${baseInput} resize-y`}
      />
    </div>
  );
}
