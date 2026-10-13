"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarTokenConvite, HORAS_CONVITE } from "@/lib/portal";

export type EstadoAcesso = { erro?: string; token?: string };

/**
 * Gera um convite de primeiro acesso para o paciente. Não cria senha
 * nem conta ainda, só o token temporário que a Larissa envia pelo
 * WhatsApp. A conta nasce quando o paciente define a própria senha.
 */
export async function criarAcesso(
  _anterior: EstadoAcesso,
  formData: FormData,
): Promise<EstadoAcesso> {
  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!patientId) return { erro: "Paciente não identificado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS garante que só volta se o paciente for desta nutricionista.
  const { data: paciente } = await supabase
    .from("patients")
    .select("id, email, acesso_status, auth_user_id")
    .eq("id", patientId)
    .maybeSingle();

  if (!paciente) return { erro: "Paciente não encontrado." };
  if (!paciente.email) {
    return {
      erro: "Cadastre o e-mail do paciente antes de criar o acesso, é o login dele.",
    };
  }
  if (paciente.auth_user_id) {
    return { erro: "Este paciente já tem acesso ativo ao portal." };
  }

  const token = gerarTokenConvite();
  const expira = new Date(Date.now() + HORAS_CONVITE * 60 * 60 * 1000);

  // Limpa convites antigos ainda pendentes, para só um link valer.
  await supabase
    .from("patient_invites")
    .delete()
    .eq("patient_id", patientId)
    .is("consumido_em", null);

  const { error: erroConvite } = await supabase.from("patient_invites").insert({
    owner: user.id,
    patient_id: patientId,
    token,
    expira_em: expira.toISOString(),
  });

  if (erroConvite) {
    return { erro: "Não foi possível gerar o convite. Tente de novo." };
  }

  await supabase
    .from("patients")
    .update({ acesso_status: "convidado" })
    .eq("id", patientId);

  revalidatePath(`/painel/pacientes/${patientId}`);
  revalidatePath("/painel/pacientes");
  return { token };
}

/**
 * Revoga o acesso do paciente. Apaga a conta de auth, desfaz o vínculo
 * e os convites pendentes, e volta o status para sem acesso. O
 * histórico clínico do paciente permanece intacto.
 */
export async function revogarAcesso(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!patientId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: paciente } = await supabase
    .from("patients")
    .select("id, auth_user_id")
    .eq("id", patientId)
    .maybeSingle();

  if (!paciente) return;

  // A exclusão da conta de auth exige a Secret key. O profile sai em
  // cascata com o usuário.
  if (paciente.auth_user_id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(paciente.auth_user_id);
  }

  await supabase
    .from("patient_invites")
    .delete()
    .eq("patient_id", patientId)
    .is("consumido_em", null);

  await supabase
    .from("patients")
    .update({ auth_user_id: null, acesso_status: "sem_acesso" })
    .eq("id", patientId);

  revalidatePath(`/painel/pacientes/${patientId}`);
  revalidatePath("/painel/pacientes");
}
