"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Marca } from "./marca";
import {
  IconeTriagem,
  IconeEsteira,
  IconeLinks,
  IconePacientes,
  IconeVisao,
  IconeVendas,
  IconeFinanceiro,
  IconeTrabalho,
  IconeAjustes,
} from "./icones";

/**
 * Ordem das referências, com as áreas das fases anteriores inseridas
 * antes de Ajustes, que fecha a lista.
 */
const ITENS = [
  { href: "/painel", rotulo: "Triagem", Icone: IconeTriagem },
  { href: "/painel/esteira", rotulo: "Esteira", Icone: IconeEsteira },
  { href: "/painel/links", rotulo: "Links", Icone: IconeLinks },
  { href: "/painel/pacientes", rotulo: "Pacientes", Icone: IconePacientes },
  { href: "/painel/visao-geral", rotulo: "Visão geral", Icone: IconeVisao },
  { href: "/painel/vendas", rotulo: "Vendas", Icone: IconeVendas },
  { href: "/painel/financeiro", rotulo: "Financeiro", Icone: IconeFinanceiro },
  { href: "/painel/trabalho", rotulo: "Trabalho", Icone: IconeTrabalho },
  { href: "/painel/ajustes", rotulo: "Ajustes", Icone: IconeAjustes },
];

function ativo(href: string, caminho: string) {
  // A Triagem mora em /painel, então só acende no caminho exato.
  // Por prefixo, ela ficaria acesa em todas as telas do painel.
  if (href === "/painel") return caminho === "/painel";
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function BarraTopo({ botaoSair }: { botaoSair: React.ReactNode }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <header className="sticky top-0 z-50 bg-barra/[0.97] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1500px] items-center gap-4 px-5 py-2.5">
        <Link href="/painel" onClick={fechar} className="shrink-0">
          <Marca />
        </Link>

        {/*
          Nove itens não cabem em telas médias junto com marca e
          alternador. A rolagem horizontal preserva o desenho das
          referências em vez de esconder itens num menu.
        */}
        <nav className="hidden min-w-0 flex-1 overflow-x-auto sem-barra lg:block">
          <ul className="flex items-center gap-0.5">
            {ITENS.map(({ href, rotulo, Icone }) => {
              const aceso = ativo(href, caminho);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={aceso ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 font-sans text-[15px] transition ${
                      aceso
                        ? "bg-vital font-medium text-sobre-escuro-forte"
                        : "text-sobre-escuro/75 hover:bg-sobre-escuro-forte/8 hover:text-sobre-escuro-forte"
                    }`}
                  >
                    <Icone />
                    {rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">
          <AlternadorPerfil />
          {botaoSair}
        </div>

        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-label="Abrir menu"
          className="ml-auto rounded-full border border-sobre-escuro/25 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dourado lg:hidden"
        >
          Menu
        </button>
      </div>

      {aberto ? (
        <div className="border-t border-sobre-escuro/10 px-5 pb-5 lg:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {ITENS.map(({ href, rotulo, Icone }) => (
              <Link
                key={href}
                href={href}
                onClick={fechar}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 font-sans text-sm transition ${
                  ativo(href, caminho)
                    ? "bg-vital text-sobre-escuro-forte"
                    : "text-sobre-escuro/75"
                }`}
              >
                <Icone />
                {rotulo}
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
    <div className="flex items-center rounded-xl bg-sobre-escuro-forte/10 p-1">
      <span className="rounded-lg bg-sobre-escuro-forte px-3.5 py-1.5 font-sans text-[13px] font-medium text-barra">
        Nutricionista
      </span>
      <span
        title="Em breve"
        className="cursor-not-allowed px-3.5 py-1.5 font-sans text-[13px] text-sobre-escuro/45"
      >
        Paciente
      </span>
    </div>
  );
}
