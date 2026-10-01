export const STATUS_RETORNO = ["pendente", "realizado", "remarcado"] as const;
export type StatusRetorno = (typeof STATUS_RETORNO)[number];

export type Retorno = {
  id: string;
  owner: string;
  patient_id: string | null;
  payment_plan_id: string | null;
  numero: number;
  data_prevista: string;
  status: StatusRetorno;
  realizado_em: string | null;
  observacoes: string | null;
  created_at: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function partes(data: string) {
  const [a, m, d] = data.split("-").map(Number);
  return { a, m, d };
}

/**
 * Soma meses a uma data pura AAAA-MM-DD, mantendo o dia e ajustando para
 * o último dia em meses mais curtos. O Date.UTC só conta tamanho de mês,
 * nunca exibe, então não há deslocamento de fuso.
 */
export function somarMeses(data: string, n: number): string {
  const { a, m, d } = partes(data);
  const total = m - 1 + n;
  const ano = a + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const dia = Math.min(d, ultimo);
  return `${ano}-${pad(mes + 1)}-${pad(dia)}`;
}

/** Soma dias a uma data pura, devolvendo outra data pura. */
export function somarDias(data: string, n: number): string {
  const { a, m, d } = partes(data);
  const dt = new Date(Date.UTC(a, m - 1, d) + n * 86400000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(
    dt.getUTCDate(),
  )}`;
}

/** Dias inteiros entre duas datas puras, b menos a. */
export function diasEntre(a: string, b: string): number {
  const pa = partes(a);
  const pb = partes(b);
  return Math.round(
    (Date.UTC(pb.a, pb.m - 1, pb.d) - Date.UTC(pa.a, pa.m - 1, pa.d)) /
      86400000,
  );
}

/** Data final do plano, o fim do período coberto. */
export function fimDoPlano(dataInicio: string, meses: number): string {
  return somarMeses(dataInicio, meses);
}

/**
 * Fração da duração onde cai o último retorno. Fica entre 80% e 85%, de
 * propósito antes do fim, para sobrar espaço para a renovação com o
 * paciente ainda ativo.
 */
export const ANCORA_ULTIMO_RETORNO = 0.82;

/**
 * Distribui os retornos em intervalos aproximadamente iguais ao longo da
 * duração do plano. O último cai por volta de 82% do caminho, e os
 * demais se espalham antes dele, sem empilhar no fim. Devolve as datas
 * previstas como datas puras AAAA-MM-DD, em ordem crescente.
 */
export function distribuirRetornos(
  dataInicio: string,
  meses: number,
  qtd: number,
): string[] {
  if (qtd <= 0) return [];
  const span = diasEntre(dataInicio, fimDoPlano(dataInicio, meses));
  const datas: string[] = [];
  for (let i = 1; i <= qtd; i++) {
    const fracao = (ANCORA_ULTIMO_RETORNO * i) / qtd;
    const dias = Math.max(1, Math.round(fracao * span));
    datas.push(somarDias(dataInicio, dias));
  }
  return datas;
}
