export const STATUS_LINK = [
  "gerado",
  "enviado",
  "respondido",
  "expirado",
] as const;

export type StatusLink = (typeof STATUS_LINK)[number];

export type CheckinLink = {
  id: string;
  owner: string;
  patient_id: string;
  semana: number | null;
  token: string;
  status: StatusLink;
  gerado_em: string;
  // Sem uso desde que o link deixou de expirar por prazo. Mantida por
  // compatibilidade com os registros antigos, pode ser nula.
  expira_em: string | null;
  checkin_id: string | null;
  patients?: { id: string; full_name: string } | null;
};

/**
 * Token no formato das referências, pt_597044_s12_5c5525.
 * O miolo aleatório tem 48 bits, o que torna adivinhação inviável,
 * e o resto serve para a Larissa reconhecer o link de relance.
 */
export function gerarToken(semana: number | null) {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const aleatorio = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const serie = aleatorio.slice(0, 6);
  const sufixo = aleatorio.slice(6);
  const parteSemana = semana === null ? "sx" : `s${semana}`;

  return `pt_${serie}_${parteSemana}_${sufixo}`;
}

/**
 * Status efetivo do link. O link não expira mais por tempo, então o
 * status guardado no banco é o próprio status. 'expirado' agora quer
 * dizer cancelado, quando um link mais novo substituiu este. O segundo
 * parâmetro é mantido pela assinatura antiga de quem ainda o passa.
 */
export function statusEfetivo(link: CheckinLink, _agora = Date.now()) {
  return link.status;
}

/** Sugere a próxima semana do paciente a partir do que já existe. */
export function proximaSemana(semanas: (number | null)[]) {
  const validas = semanas.filter((s): s is number => typeof s === "number");
  if (validas.length === 0) return 1;
  return Math.max(...validas) + 1;
}
