import type { Metadata } from "next";
import { FormularioRedefinir } from "./form";

export const metadata: Metadata = {
  title: "Nova senha, acompanhamento com a Larissa Freire",
};

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-marrom px-6 py-16 text-creme">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-creme">Nova senha</h1>
        <div className="mx-auto my-8 h-px w-16 bg-dourado/40" />
        <p className="font-sans text-sm text-creme/70">
          Escolha a sua nova senha de acesso.
        </p>
        <FormularioRedefinir />
      </div>
    </main>
  );
}
