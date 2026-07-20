"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gerarTokenAnamnese } from "@/lib/anamnese";

/** Gera o link de anamnese, recusando se já houver um ativo. */
export async function gerarAnamnese(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "");
  if (!patientId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Dois links ativos confundem o paciente. Se já existe um aberto e no
  // prazo, não cria outro.
  const { data: ativo } = await supabase
    .from("anamnese_links")
    .select("id")
    .eq("patient_id", patientId)
    .neq("status", "respondido")
    .gt("expira_em", new Date().toISOString())
    .maybeSingle();

  if (ativo) {
    revalidatePath(`/painel/pacientes/${patientId}`);
    return;
  }

  await supabase.from("anamnese_links").insert({
    patient_id: patientId,
    token: gerarTokenAnamnese(),
    status: "gerado",
    owner: user.id,
  });

  revalidatePath(`/painel/pacientes/${patientId}`);
}

export async function marcarAnamneseEnviada(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("anamnese_links")
    .update({ status: "enviado" })
    .eq("id", id)
    .eq("status", "gerado");

  revalidatePath(`/painel/pacientes/${patientId}`);
}

export async function excluirAnamneseLink(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("anamnese_links").delete().eq("id", id);

  revalidatePath(`/painel/pacientes/${patientId}`);
}
