"use client";

import { useEffect, useRef, useState } from "react";

const MAX_FOTOS = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

type Foto = {
  id: string;
  arquivo: File;
  previa: string;
  estado: "enviando" | "pronta" | "erro";
  caminho?: string;
  erro?: string;
};

export function FotosDaSemana({ token }: { token: string }) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  // Dois inputs: um para a galeria, sem capture, e um para a câmera,
  // com capture. Sem o capture no da galeria, o celular oferece o menu
  // nativo com Galeria, Câmera e Arquivos.
  const galeriaRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // As prévias são URLs de objeto e precisam ser liberadas, senão
  // ficam ocupando memória do navegador até a aba fechar.
  useEffect(() => {
    return () => {
      fotos.forEach((f) => URL.revokeObjectURL(f.previa));
    };
    // Só na desmontagem, de propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prontas = fotos.filter((f) => f.estado === "pronta");

  async function enviarUma(foto: Foto, indice: number) {
    try {
      const resposta = await fetch(`/api/checkin/${token}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: foto.arquivo.type,
          tamanho: foto.arquivo.size,
          indice,
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha no envio.");

      // O navegador manda o arquivo direto para a URL assinada, sem
      // passar pelo nosso servidor.
      const envio = await fetch(dados.urlAssinada, {
        method: "PUT",
        headers: { "Content-Type": foto.arquivo.type },
        body: foto.arquivo,
      });

      if (!envio.ok) throw new Error("Não foi possível enviar a foto.");

      setFotos((atual) =>
        atual.map((f) =>
          f.id === foto.id
            ? { ...f, estado: "pronta", caminho: dados.caminho }
            : f,
        ),
      );
    } catch (e) {
      const mensagem =
        e instanceof Error ? e.message : "Não foi possível enviar a foto.";
      setFotos((atual) =>
        atual.map((f) =>
          f.id === foto.id ? { ...f, estado: "erro", erro: mensagem } : f,
        ),
      );
    }
  }

  function escolher(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    setAviso(null);

    const espaco = MAX_FOTOS - fotos.length;
    if (espaco <= 0) {
      setAviso(`Você já anexou o máximo de ${MAX_FOTOS} fotos.`);
      return;
    }

    const escolhidas = Array.from(lista);
    if (escolhidas.length > espaco) {
      setAviso(
        `Dá para anexar mais ${espaco} ${espaco === 1 ? "foto" : "fotos"}. As demais foram ignoradas.`,
      );
    }

    const aceitas: Foto[] = [];
    for (const arquivo of escolhidas.slice(0, espaco)) {
      if (!TIPOS.includes(arquivo.type)) {
        setAviso("Só aceitamos imagens JPEG, PNG ou WebP.");
        continue;
      }
      if (arquivo.size > MAX_BYTES) {
        setAviso(`${arquivo.name} passa de 10 MB. Tente uma foto menor.`);
        continue;
      }
      aceitas.push({
        id: crypto.randomUUID(),
        arquivo,
        previa: URL.createObjectURL(arquivo),
        estado: "enviando",
      });
    }

    if (aceitas.length === 0) return;

    const base = fotos.length;
    setFotos((atual) => [...atual, ...aceitas]);
    aceitas.forEach((f, i) => enviarUma(f, base + i));

    // Limpa as entradas para a mesma foto poder ser escolhida de novo
    // depois de removida.
    if (galeriaRef.current) galeriaRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function remover(id: string) {
    setFotos((atual) => {
      const alvo = atual.find((f) => f.id === id);
      if (alvo) URL.revokeObjectURL(alvo.previa);
      return atual.filter((f) => f.id !== id);
    });
    setAviso(null);
  }

  return (
    <section className="mb-4 rounded-[18px] border border-linha bg-cartao p-[22px] shadow-cartao">
      <h2 className="font-display text-[19px] text-barra">Fotos da semana</h2>
      <p className="mb-4 mt-[3px] font-sans text-[13px] text-neutro">
        Se quiser, envie até {MAX_FOTOS} fotos. Elas ajudam a sua nutri a
        enxergar o que a balança não mostra. É opcional, e só ela vê.
      </p>

      {/* Os caminhos já enviados viajam com o formulário. */}
      {prontas.map((f) => (
        <input key={f.id} type="hidden" name="fotos" value={f.caminho} />
      ))}

      {fotos.length > 0 ? (
        <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.id} className="relative">
              <span className="block aspect-square overflow-hidden rounded-xl border border-linha bg-areia-clara">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.previa}
                  alt=""
                  className={`h-full w-full object-cover transition ${
                    f.estado === "pronta" ? "" : "opacity-55"
                  }`}
                />
              </span>

              {f.estado === "enviando" ? (
                <span className="absolute inset-0 grid place-items-center rounded-xl bg-barra/35 font-mono text-[11px] text-white">
                  enviando
                </span>
              ) : null}

              {f.estado === "erro" ? (
                <span className="absolute inset-0 grid place-items-center rounded-xl bg-argila/80 px-1 text-center font-mono text-[10px] leading-tight text-white">
                  falhou
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => remover(f.id)}
                aria-label="Remover foto"
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-linha bg-white font-sans text-[15px] leading-none text-tinta shadow-cartao"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {fotos.length < MAX_FOTOS ? (
        <>
          {/* Galeria: sem capture, abre o seletor de fotos do celular. */}
          <input
            ref={galeriaRef}
            id="fotos-galeria"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => escolher(e.target.files)}
            className="sr-only"
          />
          {/* Câmera: com capture, abre direto a câmera para tirar na hora. */}
          <input
            ref={cameraRef}
            id="fotos-camera"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => escolher(e.target.files)}
            className="sr-only"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="fotos-galeria"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-linha bg-white px-4 py-2.5 font-sans text-[14.5px] text-tinta transition hover:border-vital/50"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <rect x="3" y="4" width="18" height="15" rx="2" />
                <path d="M3 15l5-4 4 3 3-3 6 5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="9" r="1.4" />
              </svg>
              Escolher da galeria
            </label>

            <label
              htmlFor="fotos-camera"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-linha bg-white px-4 py-2.5 font-sans text-[14.5px] text-tinta transition hover:border-vital/50"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M4 8h3l1.5-2h7L18 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
              Tirar foto
            </label>

            <span className="font-mono text-[12px] text-neutro">
              {fotos.length} de {MAX_FOTOS}
            </span>
          </div>
        </>
      ) : (
        <p className="font-mono text-[12.5px] text-neutro">
          {MAX_FOTOS} de {MAX_FOTOS} fotos anexadas.
        </p>
      )}

      {aviso ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-mel/40 bg-mel-suave px-4 py-3 font-sans text-[13.5px] text-mel-tinta"
        >
          {aviso}
        </p>
      ) : null}

      {fotos.some((f) => f.estado === "erro") ? (
        <p className="mt-3 font-sans text-[13px] text-argila">
          Alguma foto não subiu. Remova e tente de novo, ou siga sem ela. O
          resto do check-in é enviado normalmente.
        </p>
      ) : null}
    </section>
  );
}
