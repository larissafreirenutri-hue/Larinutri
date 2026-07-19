"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrar, type EstadoLogin } from "./actions";

function BotaoEntrar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-md bg-dourado px-4 py-3 font-sans text-sm font-semibold tracking-wide text-marrom transition hover:bg-dourado/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export function FormularioLogin({ redirecionar }: { redirecionar: string }) {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="mt-8 space-y-5 text-left">
      <input type="hidden" name="redirecionar" value={redirecionar} />

      <div>
        <label
          htmlFor="email"
          className="block font-sans text-sm text-creme/80"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-3 font-sans text-creme placeholder:text-creme/40 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado"
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
          className="mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-3 font-sans text-creme placeholder:text-creme/40 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado"
        />
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <BotaoEntrar />
    </form>
  );
}
