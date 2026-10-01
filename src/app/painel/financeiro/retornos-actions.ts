"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { diaDeHoje } from "@/lib/financeiro";

/** Aceita só uma data pura AAAA-MM-DD. */
function dataPura(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
}

/**
 * Marca um retorno como realizado, guardando a data real em
 * realizado_em. A data vem do formulário, já preenchida com hoje mas
 * editável, para a Larissa informar quando o retorno de fato aconteceu.
 */
export async function marcarRetornoRealizado(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const realizado_em = dataPura(formData.get("realizado_em")) ?? diaDeHoje(Date.now());

  await supabase
    .from("retornos")
    .update({ status: "realizado", realizado_em })
    .eq("id", id);

  revalidatePath("/painel");
  if (patientId) revalidatePath(`/painel/pacientes/${patientId}`);
}

/**
 * Remarca um retorno para uma nova data prevista. O status vira
 * remarcado, para ficar claro que a data saiu do planejado original.
 */
export async function remarcarRetorno(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  const data_prevista = dataPura(formData.get("data_prevista"));
  if (!id || !data_prevista) return;

  const supabase = await createClient();
  await supabase
    .from("retornos")
    .update({ status: "remarcado", data_prevista })
    .eq("id", id);

  revalidatePath("/painel");
  if (patientId) revalidatePath(`/painel/pacientes/${patientId}`);
}
