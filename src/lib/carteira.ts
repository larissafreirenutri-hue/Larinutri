import type { Paciente } from "./tipos";

/** Linha da view patient_scores. */
export type NotasPaciente = {
  patient_id: string;
  ultimo_em: string | null;
  nota_atual: number | null;
  nota_anterior: number | null;
  total_checkins: number;
};

export type Tendencia = "subiu" | "caiu" | "estavel" | "sem_base";

export type PacienteNaCarteira = Paciente & {
  ultimoEm: string | null;
  nota: number | null;
  delta: number | null;
  tendencia: Tendencia;
  totalCheckins: number;
};

function tendenciaDe(
  atual: number | null,
  anterior: number | null,
): { tendencia: Tendencia; delta: number | null } {
  // Sem nota, ou com um único check-in, não há o que comparar. Mostrar
  // "estável" nesse caso mentiria, então existe um estado à parte.
  if (atual === null || anterior === null) {
    return { tendencia: "sem_base", delta: null };
  }

  const delta = atual - anterior;
  if (delta === 0) return { tendencia: "estavel", delta: 0 };
  return { tendencia: delta > 0 ? "subiu" : "caiu", delta };
}

export function montarCarteira(
  pacientes: Paciente[],
  notas: NotasPaciente[],
): PacienteNaCarteira[] {
  const porPaciente = new Map(notas.map((n) => [n.patient_id, n]));

  return pacientes.map((p) => {
    const n = porPaciente.get(p.id);
    const { tendencia, delta } = tendenciaDe(
      n?.nota_atual ?? null,
      n?.nota_anterior ?? null,
    );

    return {
      ...p,
      ultimoEm: n?.ultimo_em ?? null,
      nota: n?.nota_atual ?? null,
      delta,
      tendencia,
      totalCheckins: n?.total_checkins ?? 0,
    };
  });
}

/** Remove acentos para a busca casar "Joao" com "João". */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const STATUS_CARTEIRA = [
  { chave: "ativo", rotulo: "Ativos" },
  { chave: "pausado", rotulo: "Pausados" },
  { chave: "arquivado", rotulo: "Arquivados" },
  { chave: "todos", rotulo: "Todos" },
] as const;

export type FiltroStatus = (typeof STATUS_CARTEIRA)[number]["chave"];

export function contarPorStatus(pacientes: PacienteNaCarteira[]) {
  const conta = { ativo: 0, pausado: 0, arquivado: 0, todos: pacientes.length };
  for (const p of pacientes) {
    const s = (p.status ?? "ativo") as "ativo" | "pausado" | "arquivado";
    if (s in conta) conta[s] += 1;
  }
  return conta;
}
