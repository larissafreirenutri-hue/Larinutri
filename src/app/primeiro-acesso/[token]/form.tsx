"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { definirSenha, type EstadoPrimeiroAcesso } from "./actions";

const campo =
  "mt-1.5 w-full rounded-md border border-dourado/25 bg-creme/[0.05] px-4 py-3 font-sans text-sm text-creme outline-none transition placeholder:text-creme/35 focus:border-dourado";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-md bg-dourado px-4 py-3 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Criando acesso..." : "Criar senha e entrar"}
    </button>
  );
}

export function FormularioPrimeiroAcesso({ token }: { token: string }) {
  const [estado, acao] = useActionState<EstadoPrimeiroAcesso, FormData>(
    definirSenha,
    {},
  );

  return (
    <form action={acao} className="mt-8 space-y-4 text-left">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="senha" className="block font-sans text-sm text-creme/80">
          Crie uma senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="pelo menos 8 caracteres"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="confirma" className="block font-sans text-sm text-creme/80">
          Repita a senha
        </label>
        <input
          id="confirma"
          name="confirma"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="digite de novo"
          className={campo}
        />
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-argila/40 bg-argila/10 px-4 py-2.5 font-sans text-sm text-argila"
        >
          {estado.erro}
        </p>
      ) : null}

      <Botao />
    </form>
  );
}
