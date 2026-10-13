"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { papelDoUsuario } from "@/lib/portal";

export type EstadoEntrar = { erro?: string };

/** Login do paciente. Só entra quem tem papel paciente. */
export async function entrarPaciente(
  _anterior: EstadoEntrar,
  formData: FormData,
): Promise<EstadoEntrar> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) return { erro: "Preencha o e-mail e a senha." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    // Mensagem genérica, para não revelar quais e-mails existem.
    return { erro: "E-mail ou senha incorretos." };
  }

  // Esta é a área do paciente. Uma conta de nutricionista não entra
  // aqui, é barrada e deslogada, para não misturar os mundos.
  if (papelDoUsuario(data.user.app_metadata) !== "paciente") {
    await supabase.auth.signOut();
    return {
      erro: "Esta área é do paciente. Use a tela de acesso da nutricionista.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/meu-acompanhamento");
}

export async function sairPaciente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
