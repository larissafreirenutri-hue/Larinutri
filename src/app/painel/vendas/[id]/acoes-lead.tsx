"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  excluirLead,
  transformarEmPaciente,
  type EstadoLead,
} from "../actions";

function BotaoExcluirLead({ nome }: { nome: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(evento) => {
        const ok = window.confirm(
          `Excluir o lead ${nome}? O histórico de interações vai junto, e a ação não pode ser desfeita.`,
        );
        if (!ok) evento.preventDefault();
      }}
      className="rounded-md border border-argila/35 px-3 py-1.5 font-sans text-xs text-argila transition hover:bg-argila-suave disabled:opacity-60"
    >
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}

export function ExcluirLead({ id, nome }: { id: string; nome: string }) {
  return (
    <form action={excluirLead}>
      <input type="hidden" name="id" value={id} />
      <BotaoExcluirLead nome={nome} />
    </form>
  );
}

function BotaoConverter({ nome }: { nome: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(evento) => {
        const ok = window.confirm(
          `Criar um paciente a partir de ${nome}? Nome, e-mail, telefone e observações vão ser copiados, e um link de check-in será gerado.`,
        );
        if (!ok) evento.preventDefault();
      }}
      className="rounded-md bg-emerald-600 px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-emerald-300 disabled:opacity-60"
    >
      {pending ? "Criando..." : "Transformar em paciente"}
    </button>
  );
}

export function TransformarEmPaciente({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const [estado, acao] = useActionState<EstadoLead, FormData>(
    transformarEmPaciente,
    {},
  );

  return (
    <form action={acao}>
      <input type="hidden" name="id" value={id} />
      <BotaoConverter nome={nome} />

      {estado.erro ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}
