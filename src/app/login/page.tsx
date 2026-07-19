import type { Metadata } from "next";
import { FormularioLogin } from "./form";

export const metadata: Metadata = {
  title: "Entrar, Larissa Freire Nutricionista",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirecionar?: string }>;
}) {
  const { redirecionar } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-creme">Larissa Freire</h1>
        <p className="mt-2 font-display text-lg italic text-dourado">
          Nutricionista
        </p>

        <div className="mx-auto my-8 h-px w-16 bg-dourado/40" />

        <p className="font-sans text-sm text-creme/70">
          Acesso restrito ao painel de acompanhamento.
        </p>

        <FormularioLogin redirecionar={redirecionar ?? "/painel"} />
      </div>
    </main>
  );
}
