"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const campo =
  "mt-1.5 w-full rounded-md border border-dourado/25 bg-creme/[0.05] px-4 py-3 font-sans text-sm text-creme outline-none transition placeholder:text-creme/35 focus:border-dourado";

export function FormularioEsqueci() {
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function enviar(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    setCarregando(true);
    const supabase = createClient();
    // O erro é engolido de propósito, para não revelar quais e-mails
    // existem. A tela confirma o envio de qualquer forma.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setCarregando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mt-8 rounded-md border border-dourado/30 bg-dourado/10 px-5 py-4 text-left">
        <p className="font-sans text-sm leading-relaxed text-creme/85">
          Se este e-mail tiver uma conta, enviamos um link para redefinir a
          senha. Confira a sua caixa de entrada e o spam.
        </p>
        <p className="mt-3 font-sans text-sm text-creme/70">
          Não chegou? Peça para a Larissa gerar um novo acesso pelo WhatsApp.
        </p>
        <Link
          href="/entrar"
          className="mt-4 inline-block font-sans text-sm text-dourado underline underline-offset-4"
        >
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={enviar} className="mt-8 space-y-4 text-left">
      <div>
        <label htmlFor="email" className="block font-sans text-sm text-creme/80">
          Seu e-mail
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

      <button
        type="submit"
        disabled={carregando}
        className="mt-2 w-full rounded-md bg-dourado px-4 py-3 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:opacity-60"
      >
        {carregando ? "Enviando..." : "Enviar link de recuperação"}
      </button>

      <p className="pt-2 text-center">
        <Link
          href="/entrar"
          className="font-sans text-sm text-dourado underline underline-offset-4 transition hover:text-creme"
        >
          Voltar para entrar
        </Link>
      </p>
    </form>
  );
}
