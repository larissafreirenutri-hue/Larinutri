"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ETAPAS, type Lead } from "@/lib/vendas";
import { criarLead, atualizarLead, type EstadoLead } from "./actions";

const rotulo = "block font-sans text-sm text-creme/80";
const controle =
  "mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme placeholder:text-creme/35 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado";

function Botao({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-dourado px-5 py-2.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : texto}
    </button>
  );
}

export function FormularioLead({
  lead,
  onCancelar,
}: {
  lead?: Lead;
  onCancelar?: React.ReactNode;
}) {
  const editando = Boolean(lead);
  const [estado, acao] = useActionState<EstadoLead, FormData>(
    editando ? atualizarLead : criarLead,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!editando && !estado.erro) formRef.current?.reset();
  }, [estado, editando]);

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      {lead ? <input type="hidden" name="id" value={lead.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome" className={rotulo}>
            Nome do contato <span className="text-dourado">*</span>
          </label>
          <input
            id="nome"
            name="nome"
            required
            defaultValue={lead?.nome ?? ""}
            className={controle}
          />
        </div>

        <div>
          <label htmlFor="email" className={rotulo}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={lead?.email ?? ""}
            placeholder="opcional"
            className={controle}
          />
        </div>

        <div>
          <label htmlFor="phone" className={rotulo}>
            Telefone ou WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={lead?.phone ?? ""}
            placeholder="opcional"
            className={controle}
          />
        </div>

        <div>
          <label htmlFor="origem" className={rotulo}>
            Origem
          </label>
          <input
            id="origem"
            name="origem"
            list="origens"
            defaultValue={lead?.origem ?? ""}
            placeholder="Instagram, indicação..."
            className={controle}
          />
          <datalist id="origens">
            <option value="Instagram" />
            <option value="Indicação" />
            <option value="WhatsApp" />
            <option value="Site" />
</datalist>
        </div>

        <div>
          <label htmlFor="valor" className={rotulo}>
            Valor estimado
          </label>
          <input
            id="valor"
            name="valor"
            inputMode="decimal"
            defaultValue={lead?.valor?.toString().replace(".", ",") ?? ""}
            placeholder="R$ 0,00"
            className={controle}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="etapa" className={rotulo}>
            Etapa
          </label>
          <select
            id="etapa"
            name="etapa"
            defaultValue={lead?.etapa ?? "Novo"}
            className={controle}
          >
            {ETAPAS.map((e) => (
              <option key={e} value={e} className="bg-marrom">
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="observacoes" className={rotulo}>
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={lead?.observacoes ?? ""}
            placeholder="opcional"
            className={`${controle} resize-y`}
          />
        </div>
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Botao texto={editando ? "Salvar alterações" : "Adicionar lead"} />
        {onCancelar}
      </div>
    </form>
  );
}

/** Botão que abre o formulário de novo lead, recolhido por padrão. */
export function NovoLead() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          className="rounded-md bg-dourado px-5 py-2.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90"
        >
          {aberto ? "Fechar" : "Adicionar lead"}
        </button>
      </div>

      {aberto ? (
        <div className="mt-6 rounded-xl border border-dourado/25 bg-creme/5 px-6 py-6">
          <h2 className="font-display text-lg text-dourado">Novo lead</h2>
          <div className="mt-5">
            <FormularioLead />
          </div>
        </div>
      ) : null}
    </div>
  );
}
