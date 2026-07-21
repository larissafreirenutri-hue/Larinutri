import Link from "next/link";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";

export function Rodape() {
  const crn = CONTEUDO.sobre.crn;
  const insta = CONTEUDO.contato.instagram;

  return (
    <footer className="border-t border-dourado/15 bg-marrom px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6">
        <div>
          <p className="font-display text-base text-creme">
            {CONTEUDO.marca.nome}
          </p>
          <p className="mt-1 font-sans text-xs text-creme/45">
            {CONTEUDO.marca.profissao}
            {!ehPendente(crn) ? `  ·  ${crn}` : ""}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {!ehPendente(insta) ? (
            <a
              href={`https://instagram.com/${insta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-creme/55 transition hover:text-dourado"
            >
              @{insta}
            </a>
          ) : null}
          <Link
            href="/privacidade"
            className="font-sans text-xs text-creme/55 transition hover:text-dourado"
          >
            Política de privacidade
          </Link>
          <Link
            href="/login"
            className="font-sans text-xs text-creme/35 transition hover:text-dourado"
          >
            Área da nutricionista
          </Link>
        </nav>
      </div>
    </footer>
  );
}
