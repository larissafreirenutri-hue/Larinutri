"use server";

import { createClient } from "@/lib/supabase/server";

export type EstadoCheckin = { ok?: boolean; erro?: string };

const ADESAO = ["Baixa", "Média", "Alta"];
const SONO = ["Ruim", "Regular", "Boa", "Ótima"];
const FOME = ["Baixa", "Moderada", "Alta"];

/** Só deixa passar valor da lista, qualquer outra coisa vira null. */
function daLista(valor: FormDataEntryValue | null, permitidos: string[]) {
  const texto = String(valor ?? "").trim();
  return permitidos.includes(texto) ? texto : null;
}

function numeroOpcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

export async function enviarCheckin(
  _anterior: EstadoCheckin,
  formData: FormData,
): Promise<EstadoCheckin> {
  const token = String(formData.get("token") ?? "");

  if (!token) {
    return { erro: "Link inválido. Peça um novo link para a sua nutricionista." };
  }

  // O consentimento também é conferido aqui, não só no navegador.
  // Validação de front-end é conveniência, não garantia.
  if (formData.get("consentimento") !== "on") {
    return { erro: "É preciso aceitar o uso dos dados para enviar o check-in." };
  }

  const peso = numeroOpcional(formData.get("peso_kg"));
  if (peso !== null && (peso <= 0 || peso >= 500)) {
    return { erro: "Informe um peso válido, entre 1 e 499 quilos." };
  }

  const dias = numeroOpcional(formData.get("dias_atividade_fisica"));
  if (dias !== null && (!Number.isInteger(dias) || dias < 0 || dias > 7)) {
    return { erro: "Os dias de atividade física devem ser um número de 0 a 7." };
  }

  const observacoes = String(formData.get("observacoes") ?? "").trim();
  if (observacoes.length > 2000) {
    return { erro: "As observações estão muito longas, use até 2000 caracteres." };
  }

  const supabase = await createClient();

  // A função é SECURITY DEFINER e resolve o paciente pelo token.
  // O navegador nunca vê nem envia o patient_id.
  const { error } = await supabase.rpc("submit_checkin", {
    p_token: token,
    p_peso: peso,
    p_adesao: daLista(formData.get("adesao_plano"), ADESAO),
    p_sono: daLista(formData.get("qualidade_sono"), SONO),
    p_fome: daLista(formData.get("nivel_fome"), FOME),
    p_dias: dias,
    p_obs: observacoes || null,
  });

  if (error) {
    if (error.message.includes("inválido")) {
      return {
        erro: "Este link não é mais válido. Peça um novo para a sua nutricionista.",
      };
    }
    return {
      erro: "Não foi possível enviar o seu check-in. Tente novamente em instantes.",
    };
  }

  return { ok: true };
}
