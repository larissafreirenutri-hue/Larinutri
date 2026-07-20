import type { Checkin, Paciente } from "./tipos";

/** Abaixo disso o peso é considerado estável, é oscilação normal. */
const LIMIAR_ESTAVEL = 0.5;

/** Um check-in nos últimos 7 dias marca o paciente como recente. */
export const DIAS_RECENTE = 7;

export type Tendencia = "subiu" | "desceu" | "estavel";

export type ResumoPaciente = {
  totalCheckins: number;
  ultimoEm: string | null;
  pesoAtual: number | null;
  pesoInicial: number | null;
  variacao: number | null;
  tendencia: Tendencia | null;
  mediaDiasAtividade: number | null;
  adesaoRecente: string | null;
  recente: boolean;
};

export type PacienteComResumo = Paciente & { resumo: ResumoPaciente };

function tendenciaDe(variacao: number): Tendencia {
  if (Math.abs(variacao) < LIMIAR_ESTAVEL) return "estavel";
  return variacao > 0 ? "subiu" : "desceu";
}

/**
 * Consolida a lista de check-ins de um paciente. Espera receber em
 * qualquer ordem, a função ordena por conta própria.
 */
export function resumir(
  checkins: Checkin[],
  agora = Date.now(),
): ResumoPaciente {
  const ordenados = [...checkins].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );

  const vazio: ResumoPaciente = {
    totalCheckins: 0,
    ultimoEm: null,
    pesoAtual: null,
    pesoInicial: null,
    variacao: null,
    tendencia: null,
    mediaDiasAtividade: null,
    adesaoRecente: null,
    recente: false,
  };

  if (ordenados.length === 0) return vazio;

  const comPeso = ordenados.filter((c) => c.peso_kg !== null);
  const pesoInicial = comPeso.length > 0 ? comPeso[0].peso_kg : null;
  const pesoAtual =
    comPeso.length > 0 ? comPeso[comPeso.length - 1].peso_kg : null;

  // Variação só faz sentido com dois pesos distintos no tempo.
  const variacao =
    comPeso.length > 1 && pesoAtual !== null && pesoInicial !== null
      ? pesoAtual - pesoInicial
      : null;

  const dias = ordenados
    .map((c) => c.dias_atividade_fisica)
    .filter((d): d is number => d !== null);

  const adesoes = ordenados.filter((c) => c.adesao_plano !== null);

  const ultimo = ordenados[ordenados.length - 1];
  const idadeEmDias =
    (agora - Date.parse(ultimo.created_at)) / (1000 * 60 * 60 * 24);

  return {
    totalCheckins: ordenados.length,
    ultimoEm: ultimo.created_at,
    pesoAtual,
    pesoInicial,
    variacao,
    tendencia: variacao === null ? null : tendenciaDe(variacao),
    mediaDiasAtividade:
      dias.length > 0
        ? dias.reduce((soma, d) => soma + d, 0) / dias.length
        : null,
    adesaoRecente:
      adesoes.length > 0 ? adesoes[adesoes.length - 1].adesao_plano : null,
    recente: idadeEmDias <= DIAS_RECENTE,
  };
}

/**
 * Marca cada check-in como recente ou não. O relógio é lido aqui, e
 * não no componente, porque chamada impura em corpo de render é
 * antipadrão e o lint reprova, com razão.
 */
export function marcarRecentes<T extends { created_at: string }>(
  lista: T[],
  agora = Date.now(),
): (T & { recente: boolean })[] {
  const corte = agora - DIAS_RECENTE * 24 * 60 * 60 * 1000;
  return lista.map((item) => ({
    ...item,
    recente: Date.parse(item.created_at) >= corte,
  }));
}

/** Junta pacientes com os check-ins deles, em uma passada só. */
export function juntarResumos(
  pacientes: Paciente[],
  checkins: Checkin[],
  agora = Date.now(),
): PacienteComResumo[] {
  const porPaciente = new Map<string, Checkin[]>();

  for (const c of checkins) {
    const lista = porPaciente.get(c.patient_id);
    if (lista) lista.push(c);
    else porPaciente.set(c.patient_id, [c]);
  }

  return pacientes.map((p) => ({
    ...p,
    resumo: resumir(porPaciente.get(p.id) ?? [], agora),
  }));
}
