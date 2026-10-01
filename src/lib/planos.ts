import type { Lancamento } from "./financeiro";

export const STATUS_PLANO = ["ativo", "concluido", "cancelado"] as const;
export type StatusPlano = (typeof STATUS_PLANO)[number];

export const MODALIDADES = ["online", "presencial", "domiciliar"] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  online: "Online",
  presencial: "Presencial",
  domiciliar: "Domiciliar",
};

export type PlanoPagamento = {
  id: string;
  owner: string;
  patient_id: string | null;
  descricao: string | null;
  valor_mensal: number;
  meses: number;
  dia_vencimento: number | null;
  data_inicio: string;
  status: StatusPlano;
  modalidade: Modalidade | null;
  qtd_retornos: number;
  created_at: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Vencimento da parcela como data pura AAAA-MM-DD, sem hora e sem fuso.
 * indice é o deslocamento em meses a partir da data de início, começando
 * em zero. O dia é o escolhido, ajustado para o último dia quando o mês
 * for mais curto. O Date.UTC aqui só serve para contar quantos dias tem
 * o mês, nunca para exibir, então não há risco de deslocamento de fuso.
 */
export function parcelaVencimento(
  dataInicio: string,
  indice: number,
  diaVencimento: number | null,
): string {
  const [aStr, mStr, dStr] = dataInicio.split("-");
  const anoBase = Number(aStr);
  const mesBase = Number(mStr) - 1; // 0 a 11
  const diaAlvo = diaVencimento ?? Number(dStr);

  const total = mesBase + indice;
  const ano = anoBase + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12; // 0 a 11, sempre positivo

  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const dia = Math.min(Math.max(diaAlvo, 1), ultimoDia);

  return `${ano}-${pad(mes + 1)}-${pad(dia)}`;
}

export type ResumoPlano = {
  total: number;
  recebido: number;
  aReceber: number;
  pagasQtd: number;
  faltamQtd: number;
};

/** Resumo do plano a partir das suas parcelas e do valor mensal. */
export function resumirPlano(
  parcelas: Lancamento[],
  valorMensal: number,
  meses: number,
): ResumoPlano {
  const pagas = parcelas.filter((p) => p.status === "pago");
  const pendentes = parcelas.filter((p) => p.status !== "pago");

  return {
    total: valorMensal * meses,
    recebido: pagas.reduce((s, p) => s + p.valor, 0),
    aReceber: pendentes.reduce((s, p) => s + p.valor, 0),
    pagasQtd: pagas.length,
    faltamQtd: pendentes.length,
  };
}
