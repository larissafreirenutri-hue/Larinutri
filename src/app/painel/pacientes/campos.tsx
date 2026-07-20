const baseInput =
  "mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme placeholder:text-creme/35 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado";

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
      <label htmlFor={id} className="block font-sans text-sm text-creme/80">
        {rotulo}
        {obrigatorio ? <span className="text-dourado"> *</span> : null}
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
      <label htmlFor={id} className="block font-sans text-sm text-creme/80">
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
