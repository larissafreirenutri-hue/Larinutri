"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type EstadoCheckin,
  interpretarErroCheckin,
  lerPayloadRico,
} from "@/lib/checkin-payload";

/**
 * Envio do check-in pela sessão do paciente logado. Não há token: o id
 * do link vem do formulário e a função no banco confere que ele é de um
 * paciente cujo auth_user_id é o próprio chamador.
 */
export async function enviarCheckinPortal(
  _anterior: EstadoCheckin,
  formData: FormData,
): Promise<EstadoCheckin> {
  const linkId = String(formData.get("link_id") ?? "").trim();
  if (!linkId) {
    return { erro: "Não encontramos o seu check-in da semana. Recarregue a página." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sua sessão expirou. Entre de novo para enviar." };
  }

  const { data: paciente } = await supabase
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!paciente) {
    return { erro: "Acompanhamento não encontrado. Fale com a Larissa." };
  }

  // As fotos são escopadas pela pasta do próprio paciente.
  const lido = lerPayloadRico(formData, `${paciente.id}/`);
  if ("erro" in lido) return { erro: lido.erro };

  const { error } = await supabase.rpc("submit_checkin_portal", {
    p_link_id: linkId,
    ...lido.payload,
  });

  if (error) {
    console.error("[checkin portal] payload que falhou:", lido.log);
    return { erro: interpretarErroCheckin(error, "submit_checkin_portal") };
  }

  // A área volta a refletir o estado novo, com o destaque dando lugar
  // ao agradecimento da semana.
  revalidatePath("/meu-acompanhamento");
  return { ok: true };
}
