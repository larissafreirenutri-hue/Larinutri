"use client";

import { useEffect } from "react";

/**
 * Rede instável no celular ou um erro de renderização deixavam o
 * paciente numa tela crua de "This page couldn't load". Este limite de
 * erro troca isso por uma mensagem em português com um botão de tentar
 * de novo, que quase sempre resolve quando é oscilação de conexão.
 */
export default function ErroCheckin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[checkin] erro na tela de check-in:", error);
  }, [error]);

  return (
    <main className="mx-auto my-12 max-w-[520px] px-5">
      <div className="rounded-[20px] border border-linha bg-cartao px-8 py-10 text-center shadow-cartao">
        <h1 className="font-display text-[26px] text-barra">
          A página não carregou por completo
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-neutro">
          Pode ter sido uma oscilação na sua conexão. Toque em tentar de novo.
          Se não abrir, feche e abra o link mais uma vez, ou peça o link atual
          para a sua nutricionista.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-full bg-[#4a3626] px-7 py-3 font-sans text-[14px] font-semibold text-[#f4ecde] transition hover:bg-[#2e2119]"
        >
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
