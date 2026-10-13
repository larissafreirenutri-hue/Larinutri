"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const campo =
  "mt-1.5 w-full rounded-md border border-dourado/25 bg-creme/[0.05] px-4 py-3 font-sans text-sm text-creme outline-none transition placeholder:text-creme/35 focus:border-dourado";

export function FormularioRedefinir() {
  const [pronto, setPronto] = useState(false);
  const [temSessao, setTemSessao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // O link de recuperação estabelece a sessão ao abrir a página. Aqui
    // confirmamos que ela existe antes de deixar trocar a senha.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setTemSessao(true);
      setPronto(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "PASSWORD_RECOVERY" || sessao) setTemSessao(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function salvar(formData: FormData) {
    const senha = String(formData.get("senha") ?? "");
    const confirma = String(formData.get("confirma") ?? "");
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirma) {
      setErro("As senhas não são iguais. Confira e tente de novo.");
      return;
    }

    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro("Não foi possível trocar a senha. Abra o link do e-mail de novo.");
      return;
    }
    setOk(true);
  }

  if (!pronto) {
    return <p className="mt-8 font-sans text-sm text-creme/60">Carregando...</p>;
  }

  if (ok) {
    return (
      <div className="mt-8 rounded-md border border-dourado/30 bg-dourado/10 px-5 py-4 text-left">
        <p className="font-sans text-sm leading-relaxed text-creme/85">
          Senha trocada com sucesso.
        </p>
        <Link
          href="/meu-acompanhamento"
          className="mt-4 inline-block rounded-md bg-dourado px-4 py-2.5 font-sans text-sm font-semibold text-marrom"
        >
          Ir para o meu acompanhamento
        </Link>
      </div>
    );
  }

  if (!temSessao) {
    return (
      <div className="mt-8 rounded-md border border-argila/40 bg-argila/10 px-5 py-4 text-left">
        <p className="font-sans text-sm leading-relaxed text-creme/85">
          Este link de recuperação não é válido ou expirou. Peça um novo na tela
          de entrar, em esqueci minha senha.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-4 inline-block font-sans text-sm text-dourado underline underline-offset-4"
        >
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <form action={salvar} className="mt-8 space-y-4 text-left">
      <div>
        <label htmlFor="senha" className="block font-sans text-sm text-creme/80">
          Nova senha
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
          Repita a nova senha
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

      {erro ? (
        <p
          role="alert"
          className="rounded-md border border-argila/40 bg-argila/10 px-4 py-2.5 font-sans text-sm text-argila"
        >
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={salvando}
        className="mt-2 w-full rounded-md bg-dourado px-4 py-3 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:opacity-60"
      >
        {salvando ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
