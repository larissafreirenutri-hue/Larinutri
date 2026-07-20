"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gerarToken } from "@/lib/links";

export type EstadoLink = { erro?: string; token?: string };

/** Gera o link da semana para um paciente. */
export async function gerarLink(
  _anterior: EstadoLink,
  formData: FormData,
): Promise<EstadoLink> {
  const patientId = String(formData.get("patient_id") ?? "");
  const semanaBruta = String(formData.get("semana") ?? "").trim();

  if (!patientId) return { erro: "Escolha um paciente." };

  const semana = semanaBruta === "" ? null : Number(semanaBruta);
  if (semana !== null && (!Number.isInteger(semana) || semana < 1)) {
    return { erro: "A semana deve ser um número inteiro a partir de 1." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Dois links ativos para a mesma semana confundem o paciente, que
  // pode responder o antigo, e a resposta cairia na semana errada.
  const { data: jaExiste } = await supabase
    .from("checkin_links")
    .select("id")
    .eq("patient_id", patientId)
    .eq("semana", semana)
    .neq("status", "respondido")
    .gt("expira_em", new Date().toISOString())
    .maybeSingle();

  if (jaExiste) {
    return {
      erro: `Já existe um link ativo para a semana ${semana}. Apague o antigo ou gere para outra semana.`,
    };
  }

  const token = gerarToken(semana);

  const { error } = await supabase.from("checkin_links").insert({
    patient_id: patientId,
    semana,
    token,
    status: "gerado",
    owner: user.id,
  });

  if (error) {
    return { erro: `Não foi possível gerar o link. ${error.message}` };
  }

  revalidatePath("/painel/links");
  revalidatePath(`/painel/pacientes/${patientId}`);
  return { token };
}

/** Usada pelo botão Gerar check-in da ficha do paciente. */
export async function gerarLinkDoPaciente(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "");
  const semanaBruta = String(formData.get("semana") ?? "").trim();
  if (!patientId) return;

  const semana = semanaBruta === "" ? null : Number(semanaBruta);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("checkin_links").insert({
    patient_id: patientId,
    semana: Number.isInteger(semana) ? semana : null,
    token: gerarToken(Number.isInteger(semana) ? semana : null),
    status: "gerado",
    owner: user.id,
  });

  revalidatePath("/painel/links");
  revalidatePath(`/painel/pacientes/${patientId}`);
}

export async function marcarEnviado(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // Só sai de gerado. Um link já respondido não volta atrás.
  await supabase
    .from("checkin_links")
    .update({ status: "enviado" })
    .eq("id", id)
    .eq("status", "gerado");

  revalidatePath("/painel/links");
}

export async function excluirLink(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("checkin_links").delete().eq("id", id);

  revalidatePath("/painel/links");
}

/** Remove de uma vez os links vencidos que ninguém respondeu. */
export async function limparExpirados() {
  const supabase = await createClient();
  await supabase
    .from("checkin_links")
    .delete()
    .neq("status", "respondido")
    .lt("expira_em", new Date().toISOString());

  revalidatePath("/painel/links");
}

/** Gera o link da semana seguinte para o mesmo paciente. */
export async function novoLinkDaSemanaSeguinte(formData: FormData) {
  const patientId = String(formData.get("patient_id") ?? "");
  if (!patientId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existentes } = await supabase
    .from("checkin_links")
    .select("semana")
    .eq("patient_id", patientId);

  const semanas = (existentes ?? [])
    .map((l) => l.semana)
    .filter((s): s is number => typeof s === "number");

  const semana = semanas.length === 0 ? 1 : Math.max(...semanas) + 1;

  await supabase.from("checkin_links").insert({
    patient_id: patientId,
    semana,
    token: gerarToken(semana),
    status: "gerado",
    owner: user.id,
  });

  revalidatePath("/painel/links");
  revalidatePath(`/painel/pacientes/${patientId}`);
}
