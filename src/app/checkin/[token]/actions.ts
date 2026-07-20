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

/** Lê uma nota de 0 a 10, e devolve null quando vier fora da faixa. */
function nota(valor: FormDataEntryValue | null) {
  const n = Number(String(valor ?? "").trim());
  return Number.isInteger(n) && n >= 0 && n <= 10 ? n : null;
}

/** Envio pelo link tokenizado, com as dez dimensões. */
export async function enviarCheckinRico(
  _anterior: EstadoCheckin,
  formData: FormData,
): Promise<EstadoCheckin> {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { erro: "Link inválido. Peça um novo para a sua nutricionista." };
  }

  const peso = numeroOpcional(formData.get("peso_kg"));
  if (peso !== null && (peso <= 0 || peso >= 500)) {
    return { erro: "Informe um peso válido, entre 1 e 499 quilos." };
  }

  const observacoes = String(formData.get("observacoes") ?? "").trim();
  if (observacoes.length > 2000) {
    return { erro: "As observações estão muito longas, use até 2000 caracteres." };
  }

  // Sem resposta, fica nulo. O paciente não é obrigado a responder,
  // e nulo diz "não perguntado", diferente de false, que diz "não teve".
  const bruto = String(formData.get("refeicao_livre") ?? "");
  const refeicaoLivre =
    bruto === "sim" ? true : bruto === "nao" ? false : null;

  const qtdBruta = Number(String(formData.get("refeicao_livre_qtd") ?? "").trim());
  const refeicaoQtd =
    refeicaoLivre && Number.isInteger(qtdBruta) && qtdBruta >= 0 && qtdBruta <= 50
      ? qtdBruta
      : null;

  const refeicaoOque = refeicaoLivre
    ? String(formData.get("refeicao_livre_oque") ?? "").trim().slice(0, 200) || null
    : null;

  const supabase = await createClient();

  // A função é SECURITY DEFINER e resolve paciente e semana pelo link.
  // O navegador nunca envia patient_id.
  const { error } = await supabase.rpc("submit_checkin_link", {
    p_token: token,
    p_peso: peso,
    p_adesao: nota(formData.get("adesao_plano")),
    p_saciedade: nota(formData.get("saciedade")),
    p_controle: nota(formData.get("controle_vontade")),
    p_hidratacao: nota(formData.get("hidratacao")),
    p_digestao: nota(formData.get("digestao")),
    p_sono: nota(formData.get("sono")),
    p_recuperacao: nota(formData.get("recuperacao_energia")),
    p_humor: nota(formData.get("humor")),
    p_tranquilidade: nota(formData.get("tranquilidade")),
    p_geral: nota(formData.get("semana_geral")),
    p_alerta: String(formData.get("alerta_clinico") ?? "").trim() || null,
    p_obs: observacoes || null,
    p_refeicao_livre: refeicaoLivre,
    p_refeicao_qtd: refeicaoQtd,
    p_refeicao_oque: refeicaoOque,
  });

  if (error) {
    if (/invalido|inválido|expirado|respondido/i.test(error.message)) {
      return {
        erro: "Este link não é mais válido, expirou ou já foi respondido. Peça um novo para a sua nutricionista.",
      };
    }
    return {
      erro: "Não foi possível enviar o seu check-in. Tente novamente em instantes.",
    };
  }

  return { ok: true };
}
