import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormularioPrimeiroAcesso } from "./form";

export const metadata: Metadata = {
  title: "Primeiro acesso, Larissa Freire Nutricionista",
};

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-marrom px-6 py-16 text-creme">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-creme">Larissa Freire</h1>
        <p className="mt-2 font-display text-lg italic text-dourado">
          Acompanhamento nutricional
        </p>
        <div className="mx-auto my-8 h-px w-16 bg-dourado/40" />
        {children}
      </div>
    </main>
  );
}

export default async function PrimeiroAcessoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: convite } = await admin
    .from("patient_invites")
    .select("patient_id, expira_em, consumido_em")
    .eq("token", token)
    .maybeSingle();

  const valido =
    convite &&
    !convite.consumido_em &&
    new Date(convite.expira_em).getTime() >= Date.now();

  if (!valido) {
    return (
      <Moldura>
        <h2 className="font-display text-xl text-creme">Link indisponível</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-creme/70">
          Este link de primeiro acesso não é mais válido, expirou ou já foi
          usado. Peça um novo para a Larissa pelo WhatsApp.
        </p>
      </Moldura>
    );
  }

  const { data: paciente } = await admin
    .from("patients")
    .select("full_name")
    .eq("id", convite.patient_id)
    .maybeSingle();

  const primeiro = (paciente?.full_name ?? "").split(" ")[0] || "você";

  return (
    <Moldura>
      <p className="font-sans text-sm text-creme/70">
        Olá, {primeiro}! Crie a sua senha para acompanhar a sua evolução.
      </p>
      <FormularioPrimeiroAcesso token={token} />
    </Moldura>
  );
}
