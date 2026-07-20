"use client";

import { useEffect, useState } from "react";
import { FormularioPaciente } from "./formulario-paciente";

/**
 * Botão do cabeçalho, como na referência. O formulário abre numa
 * camada sobreposta, e não abaixo do botão, porque na carteira ele
 * vive dentro do cabeçalho e empurraria a tabela inteira.
 */
export function NovoPaciente() {
  const [aberto, setAberto] = useState(false);

  // Fechar com Esc é o que qualquer pessoa tenta primeiro.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-vital px-5 py-3 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105"
      >
        <span aria-hidden className="text-[17px] leading-none">
          +
        </span>
        Novo paciente
      </button>

      {aberto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Novo paciente"
          className="fixed inset-0 z-[60] overflow-y-auto"
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="fixed inset-0 bg-barra/45"
          />

          <div className="relative mx-auto my-10 w-full max-w-2xl px-5">
            <div className="rounded-[20px] border border-linha bg-cartao px-6 py-6 shadow-cartao">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="olho">Carteira</p>
                  <h2 className="mt-1.5 font-display text-[24px] text-barra">
                    Novo paciente
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="rounded-[10px] border border-linha px-3 py-1.5 font-sans text-[13.5px] text-neutro transition hover:text-tinta"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-6">
                <FormularioPaciente aoSalvar={() => setAberto(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
