import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FormularioCheckin } from "./formulario";
import { FormularioRico } from "./rico";
import { Folha } from "@/app/painel/marca";

export const metadata: Metadata = {
  title: "Check-in, Larissa Freire Nutricionista",
  // Link privado, não deve entrar em buscador nenhum.
  robots: { index: false, follow: false },
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Barra() {
  return (
    <div className="bg-barra/[0.97]">
      <div className="mx-auto flex max-w-[640px] items-center gap-2.5 px-5 py-3">
        <Folha />
        <span className="leading-none">
          <span className="block font-display text-[19px] font-semibold text-sobre-escuro-forte">
            Larissa Freire
          </span>
          <span className="mt-[3px] block font-mono text-[9px] uppercase tracking-[0.14em] text-dourado">
            Nutricionista
          </span>
        </span>
      </div>
    </div>
  );
}

function LinkInvalido() {
  return (
    <>
      <Barra />
      <main className="mx-auto my-12 max-w-[520px] px-5">
        <div className="rounded-[20px] border border-linha bg-cartao px-8 py-10 text-center shadow-cartao">
          <h1 className="font-display text-[26px] text-barra">
            Link inválido ou expirado
          </h1>
          <p className="mt-3 font-sans text-[15px] leading-relaxed text-neutro">
            Não encontramos um check-in aberto para este endereço. O link pode
            já ter sido respondido, ter passado dos 7 dias, ou ter sido copiado
            pela metade. Peça um novo para a sua nutricionista.
          </p>
        </div>
      </main>
    </>
  );
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Dois formatos convivem. UUID é o link antigo, preso ao paciente e
  // sem prazo. O formato pt_..._s12_... é o link semanal da etapa 2.
  // Manter os dois evita quebrar links já enviados a pacientes.
  if (UUID.test(token)) {
    const { data: primeiroNome, error } = await supabase.rpc(
      "get_checkin_patient",
      { p_token: token },
    );

    if (error || !primeiroNome) return <LinkInvalido />;

    return (
      <>
        <Barra />
        <main className="mx-auto w-full max-w-[640px] flex-1 px-5 py-6">
          <FormularioCheckin token={token} primeiroNome={primeiroNome} />
        </main>
      </>
    );
  }

  const { data, error } = await supabase.rpc("get_checkin_link", {
    p_token: token,
  });

  const linha = Array.isArray(data) ? data[0] : null;
  if (error || !linha?.primeiro_nome) return <LinkInvalido />;

  return (
    <>
      <Barra />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 py-6">
        <FormularioRico
          token={token}
          primeiroNome={linha.primeiro_nome}
          semana={linha.semana ?? null}
        />
      </main>
    </>
  );
}
