/**
 * ============================================================
 * PAYLOAD DO CHECK-IN RICO
 *
 * Leitura e validação dos campos do formulário rico, compartilhadas
 * entre o envio por link tokenizado e o envio pelo portal logado. Um
 * lugar só, para os dois caminhos tratarem peso com vírgula, tolerância
 * de treinos e consentimento exatamente igual.
 * ============================================================
 */

export type EstadoCheckin = { ok?: boolean; erro?: string };

type ErroPostgrest = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

/**
 * Loga o erro completo no servidor e devolve uma mensagem específica em
 * português, nunca a genérica quando a causa é conhecida.
 */
export function interpretarErroCheckin(
  erro: ErroPostgrest,
  onde: string,
): string {
  console.error(`[checkin] falha ao gravar em ${onde}:`, {
    message: erro?.message,
    code: erro?.code,
    details: erro?.details,
    hint: erro?.hint,
  });

  const msg = `${erro?.message ?? ""} ${erro?.details ?? ""}`.toLowerCase();
  const code = erro?.code ?? "";

  if (/ja foi respondido|já foi respondido/.test(msg)) {
    return "Este check-in já foi respondido.";
  }
  if (/substitu/.test(msg)) {
    return "Este link foi substituído por um mais novo. Peça o link atual para a sua nutricionista.";
  }
  if (/indispon/.test(msg)) {
    return "Este check-in não está disponível. Fale com a Larissa.";
  }
  if (/inválido|invalido/.test(msg)) {
    return "Este link não é válido. Peça um novo para a sua nutricionista.";
  }

  if (
    code === "PGRST202" ||
    code === "PGRST203" ||
    /could not choose|is not unique|does not exist|não encontrada|nao encontrada|no function matches/.test(
      msg,
    )
  ) {
    return "Não foi possível registrar o seu check-in por um ajuste técnico pendente no sistema. Avise a Larissa que ela resolve rapidinho.";
  }

  if (code === "23505") {
    return "Este check-in desta semana já foi registrado. Se você respondeu duas vezes, pode ignorar esta tela.";
  }

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

/** Lê uma nota de 0 a 10, e devolve null quando vier fora da faixa. */
export function nota(valor: FormDataEntryValue | null) {
  const n = Number(String(valor ?? "").trim());
  return Number.isInteger(n) && n >= 0 && n <= 10 ? n : null;
}

/**
 * Número no formato brasileiro. Aceita vírgula ou ponto, ignora o resto.
 * Vazio vira null, que diz "não informado". 90,95 chega como 90.95.
 */
export function numeroOpcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "")
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

export type PayloadRico = {
  p_peso: number | null;
  p_adesao: number | null;
  p_saciedade: number | null;
  p_controle: number | null;
  p_hidratacao: number | null;
  p_digestao: number | null;
  p_sono: number | null;
  p_recuperacao: number | null;
  p_humor: number | null;
  p_tranquilidade: number | null;
  p_geral: number | null;
  p_alerta: string | null;
  p_obs: string | null;
  p_refeicao_livre: boolean | null;
  p_refeicao_qtd: number | null;
  p_refeicao_oque: string | null;
  p_fotos: string[];
  p_treinos_qtd: number | null;
  p_treinos_quais: string | null;
};

/**
 * Lê e valida o formulário rico. prefixoFotos restringe os caminhos de
 * foto à pasta do remetente (o token, no link, ou o id do paciente, no
 * portal), para ninguém referenciar foto de outra pessoa.
 */
export function lerPayloadRico(
  formData: FormData,
  prefixoFotos: string,
): { erro: string } | { payload: PayloadRico; log: Record<string, unknown> } {
  if (formData.get("consentimento") !== "on") {
    return { erro: "É preciso aceitar o uso dos dados para enviar o check-in." };
  }

  const peso = numeroOpcional(formData.get("peso_kg"));
  if (peso !== null && (peso <= 0 || peso >= 500)) {
    return { erro: "Informe um peso válido, entre 1 e 499 quilos, com vírgula ou ponto." };
  }

  const observacoes = String(formData.get("observacoes") ?? "").trim();
  if (observacoes.length > 2000) {
    return { erro: "As observações estão muito longas, use até 2000 caracteres." };
  }

  const bruto = String(formData.get("refeicao_livre") ?? "");
  const refeicaoLivre = bruto === "sim" ? true : bruto === "nao" ? false : null;

  const qtdBruta = Number(String(formData.get("refeicao_livre_qtd") ?? "").trim());
  const refeicaoQtd =
    refeicaoLivre && Number.isInteger(qtdBruta) && qtdBruta >= 0 && qtdBruta <= 50
      ? qtdBruta
      : null;

  const refeicaoOque = refeicaoLivre
    ? String(formData.get("refeicao_livre_oque") ?? "").trim().slice(0, 200) || null
    : null;

  const fotos = formData
    .getAll("fotos")
    .map((f) => String(f).trim())
    .filter((f) => f.length > 0 && f.startsWith(prefixoFotos))
    .slice(0, 5);

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

  const payload: PayloadRico = {
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
    // Sempre um array, mesmo vazio, para nunca mandar null sem tipo.
    p_fotos: fotos,
    p_treinos_qtd: treinosQtd,
    p_treinos_quais: treinosQuais,
  };

  const log = {
    treinos_qtd: treinosQtd,
    refeicao_livre: refeicaoLivre,
    refeicao_qtd: refeicaoQtd,
    fotos: fotos.length,
    tem_peso: peso !== null,
    obs_len: observacoes.length,
  };

  return { payload, log };
}
