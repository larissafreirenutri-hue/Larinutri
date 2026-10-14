import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { diaDeHoje } from "@/lib/financeiro";
import { agora } from "@/lib/visao-geral";
import { segundaDaSemana } from "@/lib/semana";
import { FormularioRico } from "@/app/checkin/[token]/rico";
import { enviarCheckinPortal } from "./actions";

export default async function CheckinPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: paciente } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!paciente) redirect("/meu-acompanhamento");

  const segunda = segundaDaSemana(diaDeHoje(agora()));

  // O check-in aberto desta semana, pela sessão do paciente (RLS).
  const { data: link } = await supabase
    .from("checkin_links")
    .select("id, semana, status")
    .eq("patient_id", paciente.id)
    .eq("semana_inicio", segunda)
    .in("status", ["gerado", "enviado"])
    .maybeSingle();

  // Sem check-in aberto, não há o que responder. Volta para a área.
  if (!link) redirect("/meu-acompanhamento");

  const primeiro = paciente.full_name.split(" ")[0];

  return (
    <div>
      <Link
        href="/meu-acompanhamento"
        className="font-sans text-[14px] text-vital-fundo transition hover:text-vital"
      >
        ← voltar para o meu acompanhamento
      </Link>

      <div className="mt-4">
        <FormularioRico
          primeiroNome={primeiro}
          semana={link.semana ?? null}
          acaoEnvio={enviarCheckinPortal}
          campoNome="link_id"
          campoValor={link.id}
          uploadUrl="/api/portal/checkin/upload"
        />
      </div>
    </div>
  );
}
