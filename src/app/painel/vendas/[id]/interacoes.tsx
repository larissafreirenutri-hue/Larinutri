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
      className="rounded-md border border-dourado/40 px-4 py-2 font-sans text-sm text-dourado transition hover:bg-dourado/10 disabled:opacity-60"
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
    "mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme placeholder:text-creme/35 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado";

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      <input type="hidden" name="lead_id" value={leadId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className="block font-sans text-sm text-creme/80">
            Tipo
          </label>
          <select id="tipo" name="tipo" defaultValue="Nota" className={controle}>
            {TIPOS_INTERACAO.map((t) => (
              <option key={t} value={t} className="bg-marrom">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="occurred_at"
            className="block font-sans text-sm text-creme/80"
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
          className="block font-sans text-sm text-creme/80"
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
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <Botao />
    </form>
  );
}
