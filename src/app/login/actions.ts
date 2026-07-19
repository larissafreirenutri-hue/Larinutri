"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { erro?: string };

/** Só aceita redirecionamento interno, para evitar open redirect. */
function destinoSeguro(valor: FormDataEntryValue | null) {
  const caminho = typeof valor === "string" ? valor : "";
  return caminho.startsWith("/") && !caminho.startsWith("//")
    ? caminho
    : "/painel";
}

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha o e-mail e a senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    // Mensagem genérica de propósito, para não revelar quais e-mails existem.
    return { erro: "E-mail ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  redirect(destinoSeguro(formData.get("redirecionar")));
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
