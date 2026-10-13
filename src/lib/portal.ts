export const ACESSO_STATUS = ["sem_acesso", "convidado", "ativo"] as const;
export type AcessoStatus = (typeof ACESSO_STATUS)[number];

export const ROTULO_ACESSO: Record<AcessoStatus, string> = {
  sem_acesso: "Sem acesso",
  convidado: "Convidado",
  ativo: "Ativo",
};

/** Validade do convite de primeiro acesso, em horas. */
export const HORAS_CONVITE = 72;

/**
 * Token do convite de primeiro acesso. 32 bytes aleatórios em hex, o que
 * torna adivinhação inviável. Igual em espírito ao token de check-in.
 */
export function gerarTokenConvite(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Papel do usuário, lido do app_metadata do JWT. */
export function papelDoUsuario(
  metadata: Record<string, unknown> | undefined | null,
): "nutricionista" | "paciente" {
  return metadata?.role === "paciente" ? "paciente" : "nutricionista";
}
