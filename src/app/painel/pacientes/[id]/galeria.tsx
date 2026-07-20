"use client";

import { useEffect, useState } from "react";

/**
 * Miniaturas das fotos do check-in. As URLs chegam prontas do servidor,
 * assinadas e com prazo curto. O caminho no storage nunca é exposto.
 */
export function Galeria({ urls }: { urls: string[] }) {
  const [aberta, setAberta] = useState<string | null>(null);

  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberta(null);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta]);

  if (urls.length === 0) return null;

  return (
    <div>
      <p className="olho mb-2.5">
        {urls.length} {urls.length === 1 ? "foto" : "fotos"} da semana
      </p>

      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {urls.map((url, i) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setAberta(url)}
              className="block aspect-square w-full overflow-hidden rounded-xl border border-linha bg-areia-clara transition hover:border-vital/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1} do check-in`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {aberta ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto do check-in"
          className="fixed inset-0 z-[70] grid place-items-center p-4"
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberta(null)}
            className="absolute inset-0 bg-barra/80"
          />
          <div className="relative max-h-full w-full max-w-3xl overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aberta}
              alt="Foto do check-in em tamanho maior"
              className="mx-auto max-h-[85vh] w-auto rounded-xl"
            />
            <button
              type="button"
              onClick={() => setAberta(null)}
              className="absolute right-3 top-3 rounded-full bg-white/90 px-3.5 py-1.5 font-sans text-[13.5px] text-tinta"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
