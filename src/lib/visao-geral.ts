import type { Paciente } from "./tipos";

const DIA = 24 * 60 * 60 * 1000;

/** Sem check-in por mais tempo que isto, o paciente entra na lista de atenção. */
export const DIAS_ATENCAO = 14;

const HORA_SP = new Intl.DateTimeFormat("pt-BR", {
  hour: "numeric",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

/**
 * Saudação pelo horário de Brasília, não pelo relógio do servidor.
 * A Vercel roda em UTC, então sem fixar o fuso a Larissa veria
 * "Boa noite" no meio da tarde.
 */
export function saudacao(agora = Date.now()) {
  const hora = Number(HORA_SP.format(new Date(agora)));
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Linha da view patient_activity. */
export type AtividadePaciente = {
  patient_id: string;
  ultimo_checkin: string | null;
  total_checkins: number;
};

/** Baixa, Média e Alta viram números para poder tirar média. */
const PESO_ADESAO: Record<string, number> = { Baixa: 1, Média: 2, Alta: 3 };

function rotuloAdesao(media: number) {
  if (media < 1.67) return "Baixa";
  if (media < 2.34) return "Média";
  return "Alta";
}

export type PacienteEmAtencao = {
  id: string;
  full_name: string;
  diasSemCheckin: number | null;
};

export function calcularAdesao(valores: (string | null)[]) {
  const notas = valores
    .map((v) => (v ? PESO_ADESAO[v] : undefined))
    .filter((n): n is number => n !== undefined);

  if (notas.length === 0) return null;

  const media = notas.reduce((soma, n) => soma + n, 0) / notas.length;
  return { rotulo: rotuloAdesao(media), media, base: notas.length };
}

/** Quem está sem check-in há mais de DIAS_ATENCAO, ou nunca respondeu. */
export function pacientesEmAtencao(
  pacientes: Pick<Paciente, "id" | "full_name">[],
  atividade: AtividadePaciente[],
  agora = Date.now(),
): PacienteEmAtencao[] {
  const ultimoPorPaciente = new Map(
    atividade.map((a) => [a.patient_id, a.ultimo_checkin]),
  );
  const corte = agora - DIAS_ATENCAO * DIA;

  return pacientes
    .map((p) => {
      const ultimo = ultimoPorPaciente.get(p.id) ?? null;
      return {
        id: p.id,
        full_name: p.full_name,
        diasSemCheckin:
          ultimo === null
            ? null
            : Math.floor((agora - Date.parse(ultimo)) / DIA),
        _ts: ultimo === null ? null : Date.parse(ultimo),
      };
    })
    .filter((p) => p._ts === null || p._ts < corte)
    .sort((a, b) => {
      // Quem nunca respondeu aparece primeiro, depois os mais atrasados.
      if (a._ts === null && b._ts === null) {
        return a.full_name.localeCompare(b.full_name, "pt-BR");
      }
      if (a._ts === null) return -1;
      if (b._ts === null) return 1;
      return a._ts - b._ts;
    })
    .map(({ id, full_name, diasSemCheckin }) => ({
      id,
      full_name,
      diasSemCheckin,
    }));
}

export function contarNovos(
  pacientes: Pick<Paciente, "created_at">[],
  dias = 30,
  agora = Date.now(),
) {
  const corte = agora - dias * DIA;
  return pacientes.filter((p) => Date.parse(p.created_at) >= corte).length;
}

/** Momento atual, lido fora do corpo de qualquer componente. */
export function agora() {
  return Date.now();
}
