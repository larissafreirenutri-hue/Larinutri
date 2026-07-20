"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel/pacientes", rotulo: "Pacientes" },
  { href: "/painel/pacientes/checkins", rotulo: "Check-ins" },
];

export function SubNavegacao() {
  const caminho = usePathname();

  return (
    <nav className="mt-6 flex gap-1 border-b border-linha">
      {ABAS.map((aba) => {
        // A lista de pacientes só fica ativa no caminho exato, senão
        // ficaria acesa também na aba de check-ins.
        const ativa =
          aba.href === "/painel/pacientes"
            ? caminho === aba.href
            : caminho.startsWith(aba.href);

        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-3 font-sans text-sm transition ${
              ativa
                ? "border-vital text-vital-fundo"
                : "border-transparent text-neutro hover:text-tinta"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
