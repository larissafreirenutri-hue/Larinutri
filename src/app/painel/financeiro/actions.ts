"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehStatus, ehTipo, diaDeHoje } from "@/lib/financeiro";

export type EstadoLancamento = { erro?: string };

function opcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

/** Aceita só uma data pura AAAA-MM-DD, senão devolve null. */
function dataPura(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
}

/**
 * Fecha o plano quando não sobra parcela pendente. Chamada depois de
 * marcar uma parcela como paga. Um plano sem parcelas pendentes está
 * concluído. Se ainda houver, garante que ele fique ativo.
 */
async function conciliarPlano(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
) {
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("payment_plan_id", planId)
    .neq("status", "pago");

  await supabase
    .from("payment_plans")
    .update({ status: (count ?? 0) === 0 ? "concluido" : "ativo" })
    .eq("id", planId)
    .neq("status", "cancelado");
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
    // A data é a informada, ou hoje, como data pura sem fuso.
    pago_em:
      dados.status === "pago"
        ? (dataPura(formData.get("pago_em")) ?? diaDeHoje(Date.now()))
        : null,
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
  // A data informada no formulário tem prioridade, para poder corrigir.
  const informada = dataPura(formData.get("pago_em"));
  if (dados.status === "pendente") pago_em = null;
  else if (informada) pago_em = informada;
  else if (!pago_em) pago_em = diaDeHoje(Date.now());

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

/**
 * Marca um lançamento como pago com a data real informada. Não assume
 * hoje sozinho, a data vem do formulário, já preenchida com hoje mas
 * editável. Se for parcela de um plano, concilia o plano ao final.
 */
export async function marcarComoPago(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const pago_em = dataPura(formData.get("pago_em")) ?? diaDeHoje(Date.now());

  const { data: linha } = await supabase
    .from("transactions")
    .update({ status: "pago", pago_em })
    .eq("id", id)
    .select("payment_plan_id")
    .maybeSingle();

  if (linha?.payment_plan_id) {
    await conciliarPlano(supabase, linha.payment_plan_id);
  }

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel/pacientes", "layout");
}

/**
 * Corrige a data real de um pagamento já marcado como pago, sem mudar o
 * status. Serve para quando a Larissa erra a data e precisa ajustar.
 */
export async function atualizarPagamento(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const pago_em = dataPura(formData.get("pago_em"));
  if (!id || !pago_em) return;

  const supabase = await createClient();
  await supabase
    .from("transactions")
    .update({ pago_em })
    .eq("id", id)
    .eq("status", "pago");

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel/pacientes", "layout");
}

export async function excluirLancamento(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);

  revalidatePath("/painel/financeiro");
}
