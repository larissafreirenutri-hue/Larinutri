"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoPaciente = { erro?: string };

/** Campo de texto opcional vira null quando vem vazio, para não gravar "". */
function opcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

function numeroOpcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function lerFormulario(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: opcional(formData.get("email")),
    phone: opcional(formData.get("phone")),
    notes: opcional(formData.get("notes")),
    objetivo: opcional(formData.get("objetivo")),
    plano_nome: opcional(formData.get("plano_nome")),
    plano_duracao: opcional(formData.get("plano_duracao")),
    plano_vence: opcional(formData.get("plano_vence")),
    restricao: opcional(formData.get("restricao")),
    peso_inicial: numeroOpcional(formData.get("peso_inicial")),
    altura: numeroOpcional(formData.get("altura")),
    sono_habitual: opcional(formData.get("sono_habitual")),
    treino_planejado: opcional(formData.get("treino_planejado")),
    meta_agua: opcional(formData.get("meta_agua")),
  };
}

export async function criarPaciente(
  _anterior: EstadoPaciente,
  formData: FormData,
): Promise<EstadoPaciente> {
  const dados = lerFormulario(formData);

  if (!dados.full_name) {
    return { erro: "O nome do paciente é obrigatório." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // owner explícito, mesmo existindo o default auth.uid() no banco.
  // A política de insert rejeita qualquer valor diferente da sessão.
  const { error } = await supabase
    .from("patients")
    .insert({ ...dados, owner: user.id });

  if (error) {
    return { erro: `Não foi possível salvar o paciente. ${error.message}` };
  }

  revalidatePath("/painel/pacientes");
  return {};
}

export async function atualizarPaciente(
  _anterior: EstadoPaciente,
  formData: FormData,
): Promise<EstadoPaciente> {
  const id = String(formData.get("id") ?? "");
  const dados = lerFormulario(formData);

  if (!id) {
    return { erro: "Paciente não identificado." };
  }
  if (!dados.full_name) {
    return { erro: "O nome do paciente é obrigatório." };
  }

  const supabase = await createClient();

  // Sem filtro por owner de propósito. O RLS já limita o alcance do update
  // às linhas da sessão, e duplicar a regra aqui daria falsa sensação
  // de que a segurança mora no código da aplicação.
  const { error } = await supabase
    .from("patients")
    .update(dados)
    .eq("id", id);

  if (error) {
    return { erro: `Não foi possível salvar as alterações. ${error.message}` };
  }

  revalidatePath("/painel/pacientes");
  redirect("/painel/pacientes");
}

export async function excluirPaciente(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("patients").delete().eq("id", id);

  revalidatePath("/painel/pacientes");
}

const STATUS_PACIENTE = ["ativo", "pausado", "arquivado"];

/** Alterna entre ativo e arquivado, sem apagar nada. */
export async function arquivarPaciente(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUS_PACIENTE.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("patients").update({ status }).eq("id", id);

  revalidatePath("/painel/pacientes");
  revalidatePath(`/painel/pacientes/${id}`);
}
