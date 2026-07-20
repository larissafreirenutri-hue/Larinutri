"use client";

import { useEffect, useState } from "react";

export function BotaoCopiarLink({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!copiado && !falhou) return;
    const t = setTimeout(() => {
      setCopiado(false);
      setFalhou(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [copiado, falhou]);

  async function copiar() {
    // A origem sai do próprio navegador, então o link funciona igual
    // em localhost e no domínio real, sem variável de ambiente.
    const url = `${window.location.origin}/checkin/${token}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      // navigator.clipboard exige contexto seguro. Em http fora de
      // localhost ele não existe, então mostramos a URL para copiar à mão.
      window.prompt("Copie o link de check-in:", url);
      setFalhou(true);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-live="polite"
      className="rounded-md border border-linha px-3 py-1.5 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
    >
      {copiado ? "Link copiado" : falhou ? "Copie manualmente" : "Copiar link de check-in"}
    </button>
  );
}
