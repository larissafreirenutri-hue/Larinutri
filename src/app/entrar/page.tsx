import type { Metadata } from "next";
import { FormularioEntrar } from "./form";

export const metadata: Metadata = {
  title: "Entrar, acompanhamento com a Larissa Freire",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { novo } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-marrom px-6 py-16 text-creme">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-creme">Larissa Freire</h1>
        <p className="mt-2 font-display text-lg italic text-dourado">
          Seu acompanhamento
        </p>

        <div className="mx-auto my-8 h-px w-16 bg-dourado/40" />

        <p className="font-sans text-sm text-creme/70">
          Entre para ver a sua evolução.
        </p>

        <FormularioEntrar novo={novo === "1"} />
      </div>
    </main>
  );
}
