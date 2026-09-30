"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parcelaVencimento } from "@/lib/planos";

export type EstadoPlano = { erro?: string; ok?: boolean };

/** Aceita "219,90" e "219.90", devolve número ou null. */
function moeda(valor: FormDataEntryValue | null) {
  const bruto = String(valor ?? "").trim();
  if (bruto === "") return null;
  const limpo = bruto
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function inteiro(valor: FormDataEntryValue | null) {
  const n = Number(String(valor ?? "").trim());
  return Number.isInteger(n) ? n : null;
}

/**
 * Cria o plano e gera as parcelas de uma vez, como receitas pendentes,
 * uma por mês, com vencimento no dia escolhido de cada mês.
 */
export async function criarPlano(
  _anterior: EstadoPlano,
  formData: FormData,
): Promise<EstadoPlano> {
  const patientId = String(formData.get("patient_id") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const valorMensal = moeda(formData.get("valor_mensal"));
  const meses = inteiro(formData.get("meses"));
  const diaBruto = inteiro(formData.get("dia_vencimento"));
  const dataInicio = String(formData.get("data_inicio") ?? "").trim();

  if (!patientId) return { erro: "Escolha o paciente." };
  if (valorMensal === null || valorMensal <= 0) {
    return { erro: "Informe um valor mensal válido, como 219,90." };
  }
  if (meses === null || meses < 1 || meses > 60) {
    return { erro: "A quantidade de meses deve ser um número de 1 a 60." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) {
    return { erro: "Informe a data de início." };
  }
  const diaVencimento =
    diaBruto === null ? null : Math.min(28, Math.max(1, diaBruto));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: paciente } = await supabase
    .from("patients")
    .select("full_name")
    .eq("id", patientId)
    .maybeSingle();

  if (!paciente) return { erro: "Paciente não encontrado." };
  const primeiroNome = String(paciente.full_name).split(" ")[0];

  const { data: plano, error: erroPlano } = await supabase
    .from("payment_plans")
    .insert({
      owner: user.id,
      patient_id: patientId,
      descricao,
      valor_mensal: valorMensal,
      meses,
      dia_vencimento: diaVencimento,
      data_inicio: dataInicio,
      status: "ativo",
    })
    .select("id")
    .single();

  if (erroPlano || !plano) {
    return { erro: "Não foi possível criar o plano. Tente de novo." };
  }

  const parcelas = Array.from({ length: meses }, (_, i) => ({
    owner: user.id,
    tipo: "receita" as const,
    descricao: `Mensalidade, parcela ${i + 1} de ${meses}, ${primeiroNome}`,
    valor: valorMensal,
    categoria: "Mensalidade",
    patient_id: patientId,
    status: "pendente" as const,
    vencimento: parcelaVencimento(dataInicio, i, diaVencimento),
    pago_em: null,
    payment_plan_id: plano.id,
    parcela_num: i + 1,
  }));

  const { error: erroParcelas } = await supabase
    .from("transactions")
    .insert(parcelas);

  if (erroParcelas) {
    // Sem as parcelas o plano fica vazio, então desfaz para não deixar
    // um plano fantasma sem nenhuma mensalidade.
    await supabase.from("payment_plans").delete().eq("id", plano.id);
    return { erro: "Não foi possível gerar as parcelas. Tente de novo." };
  }

  revalidatePath("/painel/financeiro");
  revalidatePath(`/painel/pacientes/${patientId}`);
  return { ok: true };
}

/**
 * Cancela o plano sem apagar o que já foi pago. As parcelas ainda
 * pendentes são removidas, para saírem do a receber, e o histórico das
 * pagas permanece.
 */
export async function cancelarPlano(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  await supabase
    .from("transactions")
    .delete()
    .eq("payment_plan_id", id)
    .neq("status", "pago");

  await supabase
    .from("payment_plans")
    .update({ status: "cancelado" })
    .eq("id", id);

  revalidatePath("/painel/financeiro");
  if (patientId) revalidatePath(`/painel/pacientes/${patientId}`);
}

/**
 * Edita o plano. Ajusta a descrição e, quando muda o valor mensal,
 * propaga o novo valor para as parcelas ainda pendentes. O que já foi
 * pago não muda, para não reescrever o histórico.
 */
export async function editarPlano(
  _anterior: EstadoPlano,
  formData: FormData,
): Promise<EstadoPlano> {
  const id = String(formData.get("id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!id) return { erro: "Plano não identificado." };

  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const valorMensal = moeda(formData.get("valor_mensal"));
  if (valorMensal === null || valorMensal <= 0) {
    return { erro: "Informe um valor mensal válido, como 219,90." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_plans")
    .update({ descricao, valor_mensal: valorMensal })
    .eq("id", id);

  if (error) return { erro: "Não foi possível salvar o plano." };

  // O novo valor vale para as próximas parcelas, as ainda não pagas.
  await supabase
    .from("transactions")
    .update({ valor: valorMensal })
    .eq("payment_plan_id", id)
    .neq("status", "pago");

  revalidatePath("/painel/financeiro");
  if (patientId) revalidatePath(`/painel/pacientes/${patientId}`);
  return { ok: true };
}
