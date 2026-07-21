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
  //
  // O select devolve as linhas de fato alteradas. Sem ele, um update
  // barrado pelo RLS afeta zero linhas e mesmo assim retorna sem erro,
  // que foi o que escondeu este bug por tanto tempo.
  const { data, error } = await supabase
    .from("checkins")
    .update({
      triagem: destino,
      analisado_em: destino === "analisado" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[esteira] moverTriagem falhou:", error.message);
    return { erro: "Não foi possível mover o check-in." };
  }

  if (!data || data.length === 0) {
    // Sem erro e sem linha alterada quase sempre é o RLS negando.
    console.error("[esteira] moverTriagem não alterou nenhuma linha, id:", id);
    return {
      erro: "Não foi possível mover o check-in. Tente novamente.",
    };
  }

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
