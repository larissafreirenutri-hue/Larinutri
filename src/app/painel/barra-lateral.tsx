"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AREAS = [
  { href: "/painel", rotulo: "Visão geral", icone: "◈" },
  { href: "/painel/pacientes", rotulo: "Pacientes", icone: "◕" },
  { href: "/painel/vendas", rotulo: "Vendas", icone: "◑" },
  { href: "/painel/financeiro", rotulo: "Financeiro", icone: "◐" },
  { href: "/painel/trabalho", rotulo: "Área de trabalho", icone: "◓" },
];

function estaAtiva(href: string, caminho: string) {
  // Visão geral só ativa no caminho exato, senão ficaria acesa em tudo.
  if (href === "/painel") return caminho === "/painel";
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function BarraLateral({
  email,
  botaoSair,
}: {
  email: string;
  botaoSair: React.ReactNode;
}) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);

  // Fechar no clique, e não num efeito que observa a rota. Efeito que
  // chama setState roda um render a mais e o lint reprova, com razão.
  const fechar = () => setAberta(false);

  const conteudo = (
    <div className="flex h-full flex-col">
      <Link
        href="/painel"
        onClick={fechar}
        className="block border-b border-dourado/15 px-6 py-6"
      >
        <span className="block font-display text-lg leading-tight text-creme">
          Larissa Freire
        </span>
        <span className="block font-sans text-[10px] uppercase tracking-[0.25em] text-dourado">
          Nutricionista
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {AREAS.map((area) => {
            const ativa = estaAtiva(area.href, caminho);

            return (
              <li key={area.href}>
                <Link
                  href={area.href}
                  onClick={fechar}
                  aria-current={ativa ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-sans text-sm transition ${
                    ativa
                      ? "bg-dourado/15 text-dourado"
                      : "text-creme/60 hover:bg-creme/5 hover:text-creme"
                  }`}
                >
                  <span
                    aria-hidden
                    className={ativa ? "text-dourado" : "text-creme/35"}
                  >
                    {area.icone}
                  </span>
                  {area.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-dourado/15 px-5 py-5">
        <p className="truncate font-sans text-xs text-creme/50" title={email}>
          {email}
        </p>
        <div className="mt-3">{botaoSair}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Topo do celular, com o botão de abrir */}
      <div className="flex items-center justify-between border-b border-dourado/15 px-5 py-4 md:hidden">
        <Link href="/painel" className="font-display text-base text-creme">
          Larissa Freire
        </Link>
        <button
          type="button"
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          aria-expanded={aberta}
          className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado"
        >
          Menu
        </button>
      </div>

      {/* Gaveta do celular */}
      {aberta ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberta(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-dourado/20 bg-marrom shadow-xl">
            {conteudo}
          </div>
        </div>
      ) : null}

      {/* Barra fixa do computador */}
      <aside className="hidden w-64 shrink-0 border-r border-dourado/15 md:sticky md:top-0 md:block md:h-screen">
        {conteudo}
      </aside>
    </>
  );
}
