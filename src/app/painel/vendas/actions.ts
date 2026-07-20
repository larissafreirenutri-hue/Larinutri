"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ehEtapa,
  ETAPA_GANHO,
  TIPOS_INTERACAO,
  type Lead,
} from "@/lib/vendas";

export type EstadoLead = { erro?: string };

function opcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

/** Aceita "1.234,56" e "1234.56", devolve número ou null. */
function moedaOpcional(valor: FormDataEntryValue | null) {
  const bruto = String(valor ?? "").trim();
  if (bruto === "") return null;

  const limpo = bruto
    .replace(/[^\d.,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function lerLead(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    email: opcional(formData.get("email")),
    phone: opcional(formData.get("phone")),
    origem: opcional(formData.get("origem")),
    valor: moedaOpcional(formData.get("valor")),
    observacoes: opcional(formData.get("observacoes")),
  };
}

export async function criarLead(
  _anterior: EstadoLead,
  formData: FormData,
): Promise<EstadoLead> {
  const dados = lerLead(formData);
  if (!dados.nome) {
    return { erro: "O nome do contato é obrigatório." };
  }

  const etapaBruta = String(formData.get("etapa") ?? "Novo");
  const etapa = ehEtapa(etapaBruta) ? etapaBruta : "Novo";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("leads")
    .insert({ ...dados, etapa, owner: user.id });

  if (error) {
    return { erro: `Não foi possível salvar o lead. ${error.message}` };
  }

  revalidatePath("/painel/vendas");
  return {};
}

export async function atualizarLead(
  _anterior: EstadoLead,
  formData: FormData,
): Promise<EstadoLead> {
  const id = String(formData.get("id") ?? "");
  const dados = lerLead(formData);

  if (!id) return { erro: "Lead não identificado." };
  if (!dados.nome) return { erro: "O nome do contato é obrigatório." };

  const etapaBruta = String(formData.get("etapa") ?? "");
  const etapa = ehEtapa(etapaBruta) ? etapaBruta : undefined;

  const supabase = await createClient();

  // Sem filtro por owner de propósito. O RLS já limita o alcance,
  // e duplicar a regra aqui daria falsa sensação de que a segurança
  // mora no código da aplicação.
  const { error } = await supabase
    .from("leads")
    .update(etapa ? { ...dados, etapa } : dados)
    .eq("id", id);

  if (error) {
    return { erro: `Não foi possível salvar as alterações. ${error.message}` };
  }

  revalidatePath("/painel/vendas");
  revalidatePath(`/painel/vendas/${id}`);
  return {};
}

/** Usada pelo arraste do kanban e pelo seletor de etapa no celular. */
export async function moverEtapa(id: string, etapa: string) {
  if (!ehEtapa(etapa)) return { erro: "Etapa inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ etapa }).eq("id", id);

  if (error) return { erro: "Não foi possível mover o lead." };

  revalidatePath("/painel/vendas");
  revalidatePath(`/painel/vendas/${id}`);
  return {};
}

export async function excluirLead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);

  revalidatePath("/painel/vendas");
  redirect("/painel/vendas");
}

export async function registrarInteracao(
  _anterior: EstadoLead,
  formData: FormData,
): Promise<EstadoLead> {
  const leadId = String(formData.get("lead_id") ?? "");
  if (!leadId) return { erro: "Lead não identificado." };

  const tipoBruto = String(formData.get("tipo") ?? "");
  const tipo = (TIPOS_INTERACAO as readonly string[]).includes(tipoBruto)
    ? tipoBruto
    : null;

  const descricao = opcional(formData.get("descricao"));
  const dataBruta = String(formData.get("occurred_at") ?? "").trim();

  if (!tipo && !descricao) {
    return { erro: "Escolha um tipo ou escreva uma descrição." };
  }

  // O input date devolve só a data. Fixo meio-dia para a interação não
  // pular de dia ao ser convertida para UTC.
  const occurred_at = dataBruta
    ? new Date(`${dataBruta}T12:00:00-03:00`).toISOString()
    : new Date().toISOString();

  if (Number.isNaN(Date.parse(occurred_at))) {
    return { erro: "Data inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    tipo,
    descricao,
    occurred_at,
    owner: user.id,
  });

  if (error) {
    return { erro: `Não foi possível registrar a interação. ${error.message}` };
  }

  revalidatePath(`/painel/vendas/${leadId}`);
  return {};
}

export async function excluirInteracao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const leadId = String(formData.get("lead_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("lead_activities").delete().eq("id", id);

  revalidatePath(`/painel/vendas/${leadId}`);
}

export async function transformarEmPaciente(
  _anterior: EstadoLead,
  formData: FormData,
): Promise<EstadoLead> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Lead não identificado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dados } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!dados) return { erro: "Lead não encontrado." };
  const lead = dados as Lead;

  if (lead.patient_id) {
    return { erro: "Este lead já foi transformado em paciente." };
  }
  if (lead.etapa !== ETAPA_GANHO) {
    return { erro: "Só leads em Fechado ganho viram paciente." };
  }

  const { data: paciente, error: erroPaciente } = await supabase
    .from("patients")
    .insert({
      full_name: lead.nome,
      email: lead.email,
      phone: lead.phone,
      notes: lead.observacoes,
      owner: user.id,
    })
    .select("id")
    .single();

  if (erroPaciente || !paciente) {
    return {
      erro: `Não foi possível criar o paciente. ${erroPaciente?.message ?? ""}`,
    };
  }

  const { error: erroVinculo } = await supabase
    .from("leads")
    .update({ patient_id: paciente.id })
    .eq("id", id);

  if (erroVinculo) {
    // O paciente já existe, então avisar é melhor que fingir sucesso.
    return {
      erro: "O paciente foi criado, mas o vínculo com o lead falhou. Confira na lista de pacientes.",
    };
  }

  revalidatePath("/painel/vendas");
  revalidatePath(`/painel/vendas/${id}`);
  revalidatePath("/painel/pacientes");
  redirect(`/painel/pacientes/${paciente.id}`);
}
