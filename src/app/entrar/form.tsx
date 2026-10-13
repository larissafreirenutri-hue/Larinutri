"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrarPaciente, type EstadoEntrar } from "./actions";

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
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export function FormularioEntrar({ novo }: { novo: boolean }) {
  const [estado, acao] = useActionState<EstadoEntrar, FormData>(
    entrarPaciente,
    {},
  );

  return (
    <form action={acao} className="mt-8 space-y-4 text-left">
      {novo ? (
        <p className="rounded-md border border-dourado/30 bg-dourado/10 px-4 py-2.5 font-sans text-sm text-dourado">
          Sua senha foi criada. Entre com o seu e-mail e a senha nova.
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="block font-sans text-sm text-creme/80">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="senha" className="block font-sans text-sm text-creme/80">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          placeholder="sua senha"
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

      <p className="pt-2 text-center">
        <Link
          href="/esqueci-senha"
          className="font-sans text-sm text-dourado underline underline-offset-4 transition hover:text-creme"
        >
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
