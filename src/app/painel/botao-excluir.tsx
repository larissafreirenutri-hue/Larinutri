"use client";

import { useFormStatus } from "react-dom";
import { excluirPaciente } from "./actions";

function Botao({ nome }: { nome: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(evento) => {
        const confirmado = window.confirm(
          `Excluir ${nome}? Esta ação não pode ser desfeita.`,
        );
        if (!confirmado) evento.preventDefault();
      }}
      className="rounded-md border border-red-300/30 px-3 py-1.5 font-sans text-xs text-red-200 transition hover:bg-red-900/25 disabled:opacity-60"
    >
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}

export function BotaoExcluir({ id, nome }: { id: string; nome: string }) {
  return (
    <form action={excluirPaciente}>
      <input type="hidden" name="id" value={id} />
      <Botao nome={nome} />
    </form>
  );
}
