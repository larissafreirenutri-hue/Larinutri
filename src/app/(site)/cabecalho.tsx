import Link from "next/link";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { BotaoWhatsApp } from "./whatsapp";

export function Cabecalho() {
  const insta = CONTEUDO.contato.instagram;

  return (
    <header className="sticky top-0 z-40 border-b border-dourado/10 bg-marrom/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/#inicio" className="group min-w-0 leading-none">
          <span className="block font-display text-lg text-creme transition group-hover:text-dourado">
            {CONTEUDO.marca.nome}
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.25em] text-dourado">
            {CONTEUDO.marca.profissao}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-4 sm:gap-5">
          {!ehPendente(insta) ? (
            <a
              href={`https://instagram.com/${insta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-sans text-sm text-creme/70 transition hover:text-dourado sm:block"
            >
              @{insta}
            </a>
          ) : null}
          {/* Rótulo curto no celular, para o header não estourar a largura. */}
          <BotaoWhatsApp
            rotulo="Agendar"
            className="whitespace-nowrap px-4 py-2.5 text-sm sm:hidden"
          />
          <BotaoWhatsApp
            rotulo="Agendar avaliação"
            className="hidden whitespace-nowrap px-5 py-2.5 text-sm sm:inline-block"
          />
        </div>
      </div>
    </header>
  );
}
