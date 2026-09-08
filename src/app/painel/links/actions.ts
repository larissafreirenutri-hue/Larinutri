"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gerarToken } from "@/lib/links";

export type EstadoLink = { erro?: string; token?: string; substituidos?: number };

/**
 * Cancela os links ainda em aberto do paciente, marcando como
 * 'expirado', que aqui significa substituído. Assim nunca ficam dois
 * links válidos ao mesmo tempo para a mesma pessoa. Devolve quantos
 * foram substituídos, para a tela poder avisar. Um link já respondido
 * não é tocado, pois guarda a resposta.
 */
async function invalidarLinksAbertos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
) {
  const { data } = await supabase
    .from("checkin_links")
    .update({ status: "expirado" })
    .eq("patient_id", patientId)
    .in("status", ["gerado", "enviado"])
    .select("id");

  return data?.length ?? 0;
}

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

  // Um novo link substitui qualquer link em aberto do paciente, para
  // não coexistirem dois válidos. O antigo vira cancelado.
  const substituidos = await invalidarLinksAbertos(supabase, patientId);

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
  return { token, substituidos };
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

  // Substitui qualquer link em aberto antes de criar o novo.
  await invalidarLinksAbertos(supabase, patientId);

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

/** Remove de uma vez os links cancelados, que já foram substituídos. */
export async function limparExpirados() {
  const supabase = await createClient();
  await supabase
    .from("checkin_links")
    .delete()
    .eq("status", "expirado");

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

  // Substitui qualquer link em aberto antes de criar o da semana nova.
  await invalidarLinksAbertos(supabase, patientId);

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
