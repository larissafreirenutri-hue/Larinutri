"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { TIPOS_INTERACAO } from "@/lib/vendas";
import { registrarInteracao, type EstadoLead } from "../actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-linha px-4 py-2 font-sans text-sm text-vital-fundo transition hover:bg-vital/10 disabled:opacity-60"
    >
      {pending ? "Registrando..." : "Registrar"}
    </button>
  );
}

export function NovaInteracao({
  leadId,
  hoje,
}: {
  leadId: string;
  /** Data de hoje calculada no servidor, para não usar relógio no render. */
  hoje: string;
}) {
  const [estado, acao] = useActionState<EstadoLead, FormData>(
    registrarInteracao,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro) formRef.current?.reset();
  }, [estado]);

  const controle =
    "mt-2 w-full rounded-md border border-linha bg-cartao px-4 py-2.5 font-sans text-sm text-tinta placeholder:text-neutro outline-none focus:border-vital focus:ring-1 focus:ring-vital";

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      <input type="hidden" name="lead_id" value={leadId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className="block font-sans text-sm text-tinta">
            Tipo
          </label>
          <select id="tipo" name="tipo" defaultValue="Nota" className={controle}>
            {TIPOS_INTERACAO.map((t) => (
              <option key={t} value={t} className="bg-cartao">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="occurred_at"
            className="block font-sans text-sm text-tinta"
          >
            Data
          </label>
          <input
            id="occurred_at"
            name="occurred_at"
            type="date"
            defaultValue={hoje}
            className={controle}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="descricao"
          className="block font-sans text-sm text-tinta"
        >
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={2}
          placeholder="O que aconteceu nesta conversa"
          className={`${controle} resize-y`}
        />
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {estado.erro}
        </p>
      ) : null}

      <Botao />
    </form>
  );
}
