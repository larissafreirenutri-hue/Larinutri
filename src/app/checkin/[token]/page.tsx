import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FormularioCheckin } from "./formulario";

export const metadata: Metadata = {
  title: "Check-in, Larissa Freire Nutricionista",
  // Link privado, não deve entrar em buscador nenhum.
  robots: { index: false, follow: false },
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function LinkInvalido() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-3xl text-creme">
          Link inválido ou expirado
        </h1>
        <div className="mx-auto my-8 h-px w-16 bg-dourado/40" />
        <p className="font-sans text-sm leading-relaxed text-creme/70">
          Não encontramos um check-in para este endereço. Confira se o link foi
          copiado por inteiro, ou peça um novo para a sua nutricionista.
        </p>
      </div>
    </main>
  );
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Formato conferido antes de ir ao banco, senão o Postgres devolve
  // erro de cast em vez de uma página amigável.
  if (!UUID.test(token)) {
    return <LinkInvalido />;
  }

  const supabase = await createClient();
  const { data: primeiroNome, error } = await supabase.rpc(
    "get_checkin_patient",
    { p_token: token },
  );

  if (error || !primeiroNome) {
    return <LinkInvalido />;
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <header className="text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-dourado">
          Check-in
        </p>
        <h1 className="mt-5 font-display text-3xl text-creme">
          Olá, {primeiroNome}
        </h1>
        <div className="mx-auto my-7 h-px w-16 bg-dourado/40" />
      </header>

      <FormularioCheckin token={token} primeiroNome={primeiroNome} />

      <p className="mt-10 text-center font-sans text-xs text-creme/40">
        Larissa Freire, Nutricionista
      </p>
    </main>
  );
}
