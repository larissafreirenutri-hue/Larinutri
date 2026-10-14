/**
 * Semana do check-in, de segunda a domingo, sempre em data pura
 * AAAA-MM-DD, sem hora e sem fuso. O Date.UTC aqui só serve para a
 * aritmética de dias, nunca para exibir, então não há deslocamento.
 */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(dt: Date) {
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** A segunda-feira da semana em que a data cai. */
export function segundaDaSemana(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  const dow = dt.getUTCDay(); // 0 domingo, 1 segunda, ... 6 sabado
  const recuo = dow === 0 ? 6 : dow - 1; // dias desde a segunda
  dt.setUTCDate(dt.getUTCDate() - recuo);
  return iso(dt);
}

/** Soma dias a uma data pura. */
export function somarDias(data: string, n: number): string {
  const [a, m, d] = data.split("-").map(Number);
  return iso(new Date(Date.UTC(a, m - 1, d) + n * 86400000));
}

/** Domingo da mesma semana da segunda informada. */
export function domingoDaSemana(segunda: string): string {
  return somarDias(segunda, 6);
}
