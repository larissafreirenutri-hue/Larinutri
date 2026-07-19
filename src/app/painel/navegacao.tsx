"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel", rotulo: "Pacientes" },
  { href: "/painel/checkins", rotulo: "Check-ins" },
];

export function Navegacao() {
  const caminho = usePathname();

  return (
    <nav className="mt-8 flex gap-1 border-b border-dourado/20">
      {ABAS.map((aba) => {
        // Pacientes fica ativa também nas telas de detalhe e edição.
        const ativa =
          aba.href === "/painel"
            ? caminho === "/painel" || caminho.startsWith("/painel/pacientes")
            : caminho.startsWith(aba.href);

        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-3 font-sans text-sm transition ${
              ativa
                ? "border-dourado text-dourado"
                : "border-transparent text-creme/55 hover:text-creme"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
