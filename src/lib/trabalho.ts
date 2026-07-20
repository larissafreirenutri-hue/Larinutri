export const PRIORIDADES = ["Baixa", "Média", "Alta"] as const;
export const STATUS_TAREFA = ["pendente", "concluída"] as const;
export const FREQUENCIAS = ["Diária", "Semanal", "Mensal"] as const;

export type Prioridade = (typeof PRIORIDADES)[number];
export type StatusTarefa = (typeof STATUS_TAREFA)[number];
export type Frequencia = (typeof FREQUENCIAS)[number];

export function ehPrioridade(v: string): v is Prioridade {
  return (PRIORIDADES as readonly string[]).includes(v);
}
export function ehStatusTarefa(v: string): v is StatusTarefa {
  return (STATUS_TAREFA as readonly string[]).includes(v);
}
export function ehFrequencia(v: string): v is Frequencia {
  return (FREQUENCIAS as readonly string[]).includes(v);
}

export type Tarefa = {
  id: string;
  owner: string;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade | null;
  status: StatusTarefa;
  due_date: string | null;
  patient_id: string | null;
  created_at: string;
  completed_at: string | null;
  patients?: { id: string; full_name: string } | null;
};

export type Rotina = {
  id: string;
  owner: string;
  titulo: string;
  frequencia: Frequencia;
  ativa: boolean;
  next_due: string | null;
  created_at: string;
};

const DIA_SP = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** "2026-07-19", para comparar com colunas date sem passar por fuso. */
export function diaDeHoje(agora: number) {
  return DIA_SP.format(new Date(agora));
}

/**
 * Avança uma data YYYY-MM-DD conforme a frequência.
 * Mensal usa a aritmética do próprio Date, que já corrige 31 de janeiro
 * mais um mês para o último dia de fevereiro, em vez de estourar.
 */
export function proximaData(base: string, frequencia: Frequencia): string {
  const [ano, mes, dia] = base.split("-").map(Number);

  if (frequencia === "Diária") {
    const d = new Date(Date.UTC(ano, mes - 1, dia + 1));
    return d.toISOString().slice(0, 10);
  }

  if (frequencia === "Semanal") {
    const d = new Date(Date.UTC(ano, mes - 1, dia + 7));
    return d.toISOString().slice(0, 10);
  }

  // Mensal. Se o dia não existir no mês seguinte, cai no último dia dele.
  const alvo = new Date(Date.UTC(ano, mes, 1));
  const ultimoDia = new Date(
    Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0),
  ).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

export type ResumoTrabalho = {
  pendentes: number;
  atrasadas: number;
  concluidasNaSemana: number;
  rotinasAtivas: number;
};

export function resumirTrabalho(
  tarefas: Tarefa[],
  rotinas: Rotina[],
  agora = Date.now(),
): ResumoTrabalho {
  const hoje = diaDeHoje(agora);
  const corteSemana = agora - 7 * 24 * 60 * 60 * 1000;

  const pendentes = tarefas.filter((t) => t.status === "pendente");

  return {
    pendentes: pendentes.length,
    atrasadas: pendentes.filter(
      (t) => t.due_date !== null && t.due_date < hoje,
    ).length,
    concluidasNaSemana: tarefas.filter(
      (t) =>
        t.status === "concluída" &&
        t.completed_at !== null &&
        Date.parse(t.completed_at) >= corteSemana,
    ).length,
    rotinasAtivas: rotinas.filter((r) => r.ativa).length,
  };
}

/** Marca cada tarefa como atrasada, fora do corpo dos componentes. */
export function marcarAtrasadas(tarefas: Tarefa[], agora = Date.now()) {
  const hoje = diaDeHoje(agora);
  return tarefas.map((t) => ({
    ...t,
    atrasada:
      t.status === "pendente" && t.due_date !== null && t.due_date < hoje,
  }));
}

export type TarefaNaLista = ReturnType<typeof marcarAtrasadas>[number];

/** Rotina vencida ou vencendo hoje, para destacar na lista. */
export function marcarRotinasVencidas(rotinas: Rotina[], agora = Date.now()) {
  const hoje = diaDeHoje(agora);
  return rotinas.map((r) => ({
    ...r,
    vencida: r.ativa && r.next_due !== null && r.next_due <= hoje,
  }));
}

export type RotinaNaLista = ReturnType<typeof marcarRotinasVencidas>[number];
