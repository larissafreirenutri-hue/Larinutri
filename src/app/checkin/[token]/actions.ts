"use server";

import { createClient } from "@/lib/supabase/server";

export type EstadoCheckin = { ok?: boolean; erro?: string };

type ErroPostgrest = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

/**
 * Loga o erro completo no servidor (aparece nos logs da Vercel) e
 * devolve uma mensagem específica em português, nunca a genérica quando
 * a causa é conhecida. É por aqui que paramos de adivinhar: o log diz
 * exatamente em que passo e por quê falhou.
 */
function interpretarErroCheckin(erro: ErroPostgrest, onde: string): string {
  console.error(`[checkin] falha ao gravar em ${onde}:`, {
    message: erro?.message,
    code: erro?.code,
    details: erro?.details,
    hint: erro?.hint,
  });

  const msg = `${erro?.message ?? ""} ${erro?.details ?? ""}`.toLowerCase();
  const code = erro?.code ?? "";

  // Mensagens vindas do raise da função, cada situação com o seu texto.
  if (/ja foi respondido|já foi respondido/.test(msg)) {
    return "Este check-in já foi respondido.";
  }
  if (/substitu/.test(msg)) {
    return "Este link foi substituído por um mais novo. Peça o link atual para a sua nutricionista.";
  }
  if (/inválido|invalido/.test(msg)) {
    return "Este link não é válido. Peça um novo para a sua nutricionista.";
  }

  // A função não foi encontrada, ou existe em mais de uma versão. Isso
  // aponta para a migração que corrige a sobrecarga ainda não rodada.
  if (
    code === "PGRST202" ||
    code === "PGRST203" ||
    /could not choose|is not unique|does not exist|não encontrada|nao encontrada|no function matches/.test(
      msg,
    )
  ) {
    return "Não foi possível registrar o seu check-in por um ajuste técnico pendente no sistema. Avise a Larissa que ela resolve rapidinho.";
  }

  // Este check-in já foi gravado, violação de unicidade.
  if (code === "23505") {
    return "Este check-in já foi registrado. Se você respondeu duas vezes, pode ignorar esta tela.";
  }

  // Violação de restrição de coluna. O nome da constraint vem no erro,
  // então dá para dizer exatamente qual campo ficou fora do aceito.
  if (code?.startsWith("23")) {
    if (/atividade|dias_atividade/.test(msg)) {
      return "O número de vezes de atividade física ficou fora do aceito. Use um número de 0 a 21.";
    }
    if (/peso/.test(msg)) {
      return "O peso informado ficou fora do aceito. Use um valor entre 1 e 499, com vírgula ou ponto.";
    }
    if (/notas|saciedade|hidratacao|digestao|tranquilidade|semana_geral|adesao/.test(msg)) {
      return "Alguma nota ficou fora de 0 a 10. Ajuste os controles e tente de novo.";
    }
    if (/refeicao/.test(msg)) {
      return "A quantidade de refeições livres ficou fora do aceito. Use um número de 0 a 50.";
    }
    if (/fotos/.test(msg)) {
      return "Foram anexadas fotos demais. O limite é de 5 fotos por check-in.";
    }
    return "Algum campo ficou com um valor fora do esperado. Revise as respostas e tente enviar de novo.";
  }

  return "Não foi possível enviar o seu check-in agora. Tente de novo em instantes. Se persistir, avise a Larissa.";
}

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
    return { erro: interpretarErroCheckin(error, "submit_checkin") };
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

  // Conferido aqui também, não só no navegador. Validação de front-end
  // é conveniência, e dado de saúde não entra sem autorização.
  if (formData.get("consentimento") !== "on") {
    return { erro: "É preciso aceitar o uso dos dados para enviar o check-in." };
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

  // Os caminhos vêm dos campos escondidos, já enviados ao storage.
  // O teto de cinco é reforçado aqui, não só no navegador.
  const fotos = formData
    .getAll("fotos")
    .map((f) => String(f).trim())
    .filter((f) => f.length > 0 && f.startsWith(`${token}/`))
    .slice(0, 5);

  // Tolerante de propósito: qualquer número vira um inteiro entre 0 e
  // 21, em vez de recusar. Campo vazio fica nulo, que diz "não
  // respondido". Assim ninguém trava por ter treinado muitas vezes.
  const treinosBruto = String(formData.get("treinos_qtd") ?? "").trim();
  const treinosNum = treinosBruto === "" ? null : Math.round(Number(treinosBruto));
  const treinosQtd =
    treinosNum === null || !Number.isFinite(treinosNum)
      ? null
      : Math.min(21, Math.max(0, treinosNum));
  const treinosQuais =
    treinosQtd && treinosQtd > 0
      ? String(formData.get("treinos_quais") ?? "").trim().slice(0, 300) || null
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
    // Sempre um array, mesmo vazio, para a chamada nunca mandar um null
    // sem tipo em p_fotos. Isso evita a ambiguidade de sobrecarga que
    // fazia o envio sem foto falhar, e é inofensivo quando não há foto.
    p_fotos: fotos,
    p_treinos_qtd: treinosQtd,
    p_treinos_quais: treinosQuais,
  });

  if (error) {
    // Retrato do payload sem dado sensível, só o formato e as faixas,
    // para comparar um envio que falha com um que passa e achar o campo.
    // Nada de peso, texto livre ou caminho de foto entra no log.
    console.error("[checkin] payload que falhou (sem dado sensível):", {
      treinos_qtd: treinosQtd,
      refeicao_livre: refeicaoLivre,
      refeicao_qtd: refeicaoQtd,
      fotos: fotos.length,
      tem_peso: peso !== null,
      obs_len: observacoes.length,
      alerta_len: String(formData.get("alerta_clinico") ?? "").trim().length,
    });
    return { erro: interpretarErroCheckin(error, "submit_checkin_link") };
  }

  return { ok: true };
}
