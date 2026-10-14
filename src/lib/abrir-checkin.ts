import type { SupabaseClient } from "@supabase/supabase-js";
import { gerarToken } from "./links";

export type ResultadoAbertura = "aberto" | "ja_existia" | "erro";

/**
 * Abre o check-in de uma semana para um paciente, criando a linha em
 * checkin_links com a segunda-feira da semana. É a mesma regra que o
 * botão manual usa e que o cron usa, para o automático ser idêntico ao
 * testado. Idempotente: se já houver check-in da semana, aberto ou
 * respondido, não cria outro, e o índice único no banco é a garantia
 * final contra duplicidade, inclusive em corrida.
 *
 * O owner é passado por quem chama: a nutricionista logada, no manual,
 * ou o dono do paciente, no cron. O cliente também: a sessão, no
 * manual, ou o cliente com a Secret key, no cron.
 */
export async function abrirCheckinDaSemana(
  cliente: SupabaseClient,
  opcoes: { patientId: string; owner: string; segunda: string },
): Promise<ResultadoAbertura> {
  const { patientId, owner, segunda } = opcoes;

  // Já existe check-in desta semana, aberto ou respondido? O cancelado
  // (expirado) não conta, para dar para reabrir se preciso.
  const { data: existente } = await cliente
    .from("checkin_links")
    .select("id")
    .eq("patient_id", patientId)
    .eq("semana_inicio", segunda)
    .neq("status", "expirado")
    .maybeSingle();

  if (existente) return "ja_existia";

  // Número sequencial da semana, só para exibição, seguindo o que já há.
  const { data: semanas } = await cliente
    .from("checkin_links")
    .select("semana")
    .eq("patient_id", patientId);

  const numeros = (semanas ?? [])
    .map((l: { semana: number | null }) => l.semana)
    .filter((s: number | null): s is number => typeof s === "number");
  const semana = numeros.length === 0 ? 1 : Math.max(...numeros) + 1;

  const { error } = await cliente.from("checkin_links").insert({
    patient_id: patientId,
    semana,
    semana_inicio: segunda,
    token: gerarToken(semana),
    status: "gerado",
    owner,
  });

  if (error) {
    // Corrida com outra abertura simultânea cai no índice único.
    if ((error as { code?: string }).code === "23505") return "ja_existia";
    return "erro";
  }

  return "aberto";
}
