"use server";

import { createClient } from "@/lib/supabase/server";
import {
  TODAS_PERGUNTAS,
  objetivoDasRespostas,
  type Pergunta,
} from "@/lib/anamnese";

export type EstadoAnamnese = { ok?: boolean; erro?: string };

function valorDaPergunta(p: Pergunta, formData: FormData): unknown {
  if (p.tipo === "multipla") {
    const marcados = formData
      .getAll(p.chave)
      .map((v) => String(v))
      .filter(Boolean);
    return marcados;
  }
  if (p.tipo === "escala") {
    const n = Number(String(formData.get(p.chave) ?? "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return String(formData.get(p.chave) ?? "").trim();
}

function temResposta(p: Pergunta, valor: unknown): boolean {
  if (p.tipo === "multipla") return Array.isArray(valor) && valor.length > 0;
  if (p.tipo === "escala") return typeof valor === "number";
  return typeof valor === "string" && valor.length > 0;
}

export async function enviarAnamnese(
  _anterior: EstadoAnamnese,
  formData: FormData,
): Promise<EstadoAnamnese> {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { erro: "Link inválido. Peça um novo para a sua nutricionista." };
  }

  if (formData.get("consentimento") !== "on") {
    return { erro: "É preciso aceitar o uso dos dados para enviar a anamnese." };
  }

  const respostas: Record<string, unknown> = {};

  for (const p of TODAS_PERGUNTAS) {
    const valor = valorDaPergunta(p, formData);

    if (p.obrigatorio && !temResposta(p, valor)) {
      return {
        erro: `Falta responder: ${p.rotulo}`,
      };
    }

    respostas[p.chave] = valor;

    // Campo livre do "Outro", guardado numa chave irmã.
    if (p.temOutro) {
      const outro = String(formData.get(`${p.chave}_outro`) ?? "").trim();
      if (outro) respostas[`${p.chave}_outro`] = outro;
    }
  }

  // Texto de objetivo derivado, para a função do banco preencher o
  // campo do paciente sem ter que interpretar o array.
  respostas.objetivo_texto = objetivoDasRespostas(respostas);

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_anamnese_link", {
    p_token: token,
    p_respostas: respostas,
  });

  if (error) {
    if (/invalido|inválido|expirado|respondido/i.test(error.message)) {
      return {
        erro: "Este link não é mais válido, expirou ou já foi respondido. Peça um novo para a sua nutricionista.",
      };
    }
    return {
      erro: "Não foi possível enviar a sua anamnese. Tente novamente em instantes.",
    };
  }

  return { ok: true };
}
