"use client";

import { useState } from "react";

/**
 * Aviso mostrado uma vez, logo após a paciente criar a senha. Deixa
 * claro o endereço de login do dia a dia e convida a salvar o atalho,
 * para ela voltar sempre com facilidade.
 */
export function BemVinda({ enderecoLogin }: { enderecoLogin: string }) {
  const [aberto, setAberto] = useState(true);
  const [copiado, setCopiado] = useState(false);

  if (!aberto) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enderecoLogin);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copie o endereço de login:", enderecoLogin);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-dourado/40 bg-dourado/10 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[19px] text-barra">
          Acesso criado, bem-vinda!
        </h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar aviso"
          className="shrink-0 rounded-full p-1 text-neutro transition hover:text-tinta"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="mt-2 font-sans text-[14px] leading-relaxed text-tinta">
        Da próxima vez, entre por este endereço com o seu e-mail e a senha que
        você acabou de criar:
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="break-all rounded-md bg-cartao px-3 py-1.5 font-mono text-[13px] text-vital-fundo">
          {enderecoLogin}
        </code>
        <button
          type="button"
          onClick={copiar}
          className="rounded-md border border-linha px-3 py-1.5 font-sans text-[13px] text-vital-fundo transition hover:bg-vital/10"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>

      <p className="mt-3 font-sans text-[13.5px] leading-relaxed text-neutro">
        Dica para voltar rápido: salve esta página nos favoritos. No celular,
        toque em compartilhar e em adicionar à tela inicial, assim ela abre como
        um aplicativo. Enquanto você usar o mesmo aparelho, continua conectada.
      </p>
    </div>
  );
}
