"use client";

import { useState } from "react";
import { FormularioPaciente } from "./formulario-paciente";

/**
 * O formulário fica recolhido para a lista não nascer empurrada
 * para baixo. Abre no clique e continua sendo o mesmo formulário.
 */
export function NovoPaciente() {
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
          {aberto ? "Fechar" : "Adicionar paciente"}
        </button>
      </div>

      {aberto ? (
        <div className="mt-6 rounded-xl border border-dourado/25 bg-creme/5 px-6 py-6">
          <h2 className="font-display text-lg text-dourado">Novo paciente</h2>
          <div className="mt-5">
            <FormularioPaciente />
          </div>
        </div>
      ) : null}
    </div>
  );
}
