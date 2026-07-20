"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Marca } from "./marca";

/** Itens centrais, na ordem das referências. */
const ITENS = [
  { href: "/painel/triagem", rotulo: "Triagem" },
  { href: "/painel/esteira", rotulo: "Esteira" },
  { href: "/painel/links", rotulo: "Links" },
  { href: "/painel/pacientes", rotulo: "Pacientes" },
  { href: "/painel/ajustes", rotulo: "Ajustes" },
];

/**
 * As áreas construídas nas fases C a F não aparecem nas referências,
 * mas continuam existindo. Ficam num menu Mais para não sumirem.
 */
const EXTRAS = [
  { href: "/painel", rotulo: "Visão geral" },
  { href: "/painel/vendas", rotulo: "Vendas" },
  { href: "/painel/financeiro", rotulo: "Financeiro" },
  { href: "/painel/trabalho", rotulo: "Área de trabalho" },
];

function ativo(href: string, caminho: string) {
  if (href === "/painel") return caminho === "/painel";
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function BarraTopo({ botaoSair }: { botaoSair: React.ReactNode }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);

  const fechar = () => {
    setAberto(false);
    setMaisAberto(false);
  };

  const linkClasse = (href: string) =>
    `rounded-full px-4 py-2 font-sans text-sm transition ${
      ativo(href, caminho)
        ? "bg-sobre-escuro-forte/15 font-medium text-sobre-escuro-forte"
        : "text-sobre-escuro/70 hover:text-sobre-escuro-forte"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-barra/[0.97] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/painel" onClick={fechar}>
          <Marca />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {ITENS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClasse(item.href)}>
              {item.rotulo}
            </Link>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMaisAberto((m) => !m)}
              aria-expanded={maisAberto}
              className="rounded-full px-4 py-2 font-sans text-sm text-sobre-escuro/70 transition hover:text-sobre-escuro-forte"
            >
              Mais
            </button>

            {maisAberto ? (
              <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-linha bg-cartao py-1 shadow-cartao">
                {EXTRAS.map((extra) => (
                  <Link
                    key={extra.href}
                    href={extra.href}
                    onClick={fechar}
                    className={`block px-4 py-2.5 font-sans text-sm transition hover:bg-areia-clara ${
                      ativo(extra.href, caminho)
                        ? "text-vital-fundo"
                        : "text-tinta"
                    }`}
                  >
                    {extra.rotulo}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <AlternadorPerfil />
          {botaoSair}
        </div>

        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-label="Abrir menu"
          className="rounded-full border border-sobre-escuro/25 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dourado lg:hidden"
        >
          Menu
        </button>
      </div>

      {aberto ? (
        <div className="border-t border-sobre-escuro/10 px-5 pb-5 lg:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {[...ITENS, ...EXTRAS].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={fechar}
                className={`rounded-lg px-4 py-2.5 font-sans text-sm transition ${
                  ativo(item.href, caminho)
                    ? "bg-sobre-escuro-forte/15 text-sobre-escuro-forte"
                    : "text-sobre-escuro/70"
                }`}
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-sobre-escuro/10 pt-4">
            <AlternadorPerfil />
            {botaoSair}
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** O modo Paciente ainda não existe, então avisa em vez de enganar. */
function AlternadorPerfil() {
  return (
    <div className="flex items-center rounded-full bg-sobre-escuro-forte/10 p-1">
      <span className="rounded-full bg-sobre-escuro-forte/90 px-3.5 py-1.5 font-sans text-xs font-medium text-barra">
        Nutricionista
      </span>
      <span
        title="Em breve"
        className="cursor-not-allowed px-3.5 py-1.5 font-sans text-xs text-sobre-escuro/40"
      >
        Paciente
      </span>
    </div>
  );
}
