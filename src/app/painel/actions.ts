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

function lerFormulario(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: opcional(formData.get("email")),
    phone: opcional(formData.get("phone")),
    notes: opcional(formData.get("notes")),
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

  revalidatePath("/painel");
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

  revalidatePath("/painel");
  redirect("/painel");
}

export async function excluirPaciente(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("patients").delete().eq("id", id);

  revalidatePath("/painel");
}
