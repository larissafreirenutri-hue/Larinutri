"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ehTriagem } from "@/lib/esteira";

/** Move um check-in entre as colunas da esteira. */
export async function moverTriagem(id: string, destino: string) {
  if (!ehTriagem(destino)) return { erro: "Coluna inválida." };

  const supabase = await createClient();

  // analisado_em marca quando a Larissa fechou a análise, e é limpo se
  // ela devolver o cartão para a coluna anterior.
  const { error } = await supabase
    .from("checkins")
    .update({
      triagem: destino,
      analisado_em: destino === "analisado" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { erro: "Não foi possível mover o check-in." };

  revalidatePath("/painel/esteira");
  revalidatePath("/painel");
  return {};
}

/** Recado da nutricionista sobre o check-in. */
export async function salvarComentario(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const comentario = String(formData.get("comentario_nutri") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("checkins")
    .update({ comentario_nutri: comentario || null })
    .eq("id", id);

  revalidatePath("/painel/esteira");
}
