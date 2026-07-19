import Link from "next/link";
import { CONTEUDO } from "@/lib/conteudo";

const SECOES = [
  { href: "/#sobre", rotulo: "Sobre" },
  { href: "/#servicos", rotulo: "Acompanhamento" },
  { href: "/#contato", rotulo: "Contato" },
];

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-dourado/15 bg-marrom/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
        <Link href="/#inicio" className="group">
          <span className="block font-display text-lg leading-tight text-creme transition group-hover:text-dourado">
            {CONTEUDO.marca.nome}
          </span>
          <span className="block font-sans text-[10px] uppercase tracking-[0.25em] text-dourado">
            {CONTEUDO.marca.profissao}
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {SECOES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="font-sans text-sm text-creme/70 transition hover:text-dourado"
            >
              {s.rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
