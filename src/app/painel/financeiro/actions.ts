"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehStatus, ehTipo } from "@/lib/financeiro";

export type EstadoLancamento = { erro?: string };

function opcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

/** Aceita "1.234,56" e "1234.56". */
function moeda(valor: FormDataEntryValue | null) {
  const bruto = String(valor ?? "").trim();
  if (bruto === "") return null;

  const limpo = bruto
    .replace(/[^\d.,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function lerLancamento(formData: FormData) {
  const tipoBruto = String(formData.get("tipo") ?? "");
  const statusBruto = String(formData.get("status") ?? "");

  const tipo = ehTipo(tipoBruto) ? tipoBruto : null;
  const status = ehStatus(statusBruto) ? statusBruto : "pago";
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = moeda(formData.get("valor"));
  const vencimento = opcional(formData.get("vencimento"));
  const patientId = opcional(formData.get("patient_id"));

  return {
    tipo,
    status,
    descricao,
    valor,
    categoria: opcional(formData.get("categoria")),
    // Vínculo com paciente só faz sentido em receita.
    patient_id: tipo === "receita" ? patientId : null,
    // Vencimento só importa enquanto está pendente.
    vencimento: status === "pendente" ? vencimento : null,
  };
}

function validar(dados: ReturnType<typeof lerLancamento>) {
  if (!dados.tipo) return "Escolha entre receita e despesa.";
  if (!dados.descricao) return "A descrição é obrigatória.";
  if (dados.valor === null) return "Informe um valor válido, maior ou igual a zero.";
  if (dados.status === "pendente" && !dados.vencimento) {
    return "Lançamento pendente precisa de uma data de vencimento.";
  }
  return null;
}

export async function criarLancamento(
  _anterior: EstadoLancamento,
  formData: FormData,
): Promise<EstadoLancamento> {
  const dados = lerLancamento(formData);
  const erro = validar(dados);
  if (erro) return { erro };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("transactions").insert({
    ...dados,
    // Já nasce pago quando marcado assim, para entrar no caixa do mês.
    pago_em: dados.status === "pago" ? new Date().toISOString() : null,
    owner: user.id,
  });

  if (error) {
    return { erro: `Não foi possível salvar o lançamento. ${error.message}` };
  }

  revalidatePath("/painel/financeiro");
  return {};
}

export async function atualizarLancamento(
  _anterior: EstadoLancamento,
  formData: FormData,
): Promise<EstadoLancamento> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Lançamento não identificado." };

  const dados = lerLancamento(formData);
  const erro = validar(dados);
  if (erro) return { erro };

  const supabase = await createClient();

  // Volta a pendente limpa a data de pagamento, senão o caixa contaria
  // um dinheiro que voltou a não ter entrado.
  const { data: atual } = await supabase
    .from("transactions")
    .select("pago_em, status")
    .eq("id", id)
    .maybeSingle();

  let pago_em: string | null = atual?.pago_em ?? null;
  if (dados.status === "pendente") pago_em = null;
  if (dados.status === "pago" && !pago_em) pago_em = new Date().toISOString();

  const { error } = await supabase
    .from("transactions")
    .update({ ...dados, pago_em })
    .eq("id", id);

  if (error) {
    return { erro: `Não foi possível salvar as alterações. ${error.message}` };
  }

  revalidatePath("/painel/financeiro");
  return {};
}

export async function marcarComoPago(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("transactions")
    .update({ status: "pago", pago_em: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/painel/financeiro");
}

export async function excluirLancamento(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);

  revalidatePath("/painel/financeiro");
}
