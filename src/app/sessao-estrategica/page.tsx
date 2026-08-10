import type { Metadata } from "next";
import Link from "next/link";
import { CONTEUDO } from "@/lib/conteudo";
import { Questionario } from "./questionario";

export const metadata: Metadata = {
  title: `Avaliação estratégica, ${CONTEUDO.marca.nome}`,
  description:
    "Responda algumas perguntas rápidas e adiante o seu atendimento com a Larissa.",
};

export default function SessaoEstrategicaPage() {
  return (
    <main className="sitio flex min-h-screen flex-col bg-marrom text-creme">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-6">
        <Link href="/" className="leading-none">
          <span className="block font-display text-lg text-creme">
            {CONTEUDO.marca.nome}
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.25em] text-dourado">
            {CONTEUDO.marca.profissao}
          </span>
        </Link>
        <Link
          href="/"
          className="font-sans text-sm text-creme/55 transition hover:text-creme"
        >
          Fechar
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Questionario />
      </div>
    </main>
  );
}
