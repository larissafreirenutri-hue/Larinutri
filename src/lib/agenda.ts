import type { Tarefa, Rotina, Subitem } from "./trabalho";

/**
 * A agenda agrega três fontes num tipo comum de evento: tarefas,
 * rotinas e vencimentos de plano. A camada diz de onde veio, para a
 * cor, o ícone e o filtro de ligar e desligar.
 */
export type Camada = "tarefa" | "rotina" | "plano";

export type Evento = {
  id: string;
  camada: Camada;
  titulo: string;
  dia: string; // YYYY-MM-DD, no fuso de Brasília
  hora: string | null; // HH:MM, só tarefas
  concluida: boolean;
  atrasada: boolean;
  prioridade: string | null;
  patientId: string | null;
  pacienteNome: string | null;
  itens: Subitem[];
  // Guarda a tarefa original, para as ações de check, subitem e mover.
  tarefa: Tarefa | null;
};

/** Cor de cada camada e prioridade, na paleta do sistema. */
export const COR_CAMADA: Record<Camada, string> = {
  tarefa: "#A9723F",
  rotina: "#4C7CC9",
  plano: "#C99A3A",
};

export const COR_PRIORIDADE: Record<string, string> = {
  Alta: "#BC5443",
  Média: "#E0A32E",
  Baixa: "#8A7B65",
};

const FUSO = "America/Sao_Paulo";

/** Data YYYY-MM-DD de um instante, no fuso de Brasília. */
export function diaISO(momento: number | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FUSO,
  }).format(momento);
}

/** HH:MM a partir de um valor time do Postgres, ou null. */
function horaCurta(t: string | null | undefined) {
  if (!t) return null;
  const m = String(t).match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

export function montarEventos({
  tarefas,
  rotinas,
  planos,
  hoje,
}: {
  tarefas: Tarefa[];
  rotinas: Rotina[];
  planos: { id: string; full_name: string; plano_vence: string }[];
  hoje: string;
}): Evento[] {
  const eventos: Evento[] = [];

  for (const t of tarefas) {
    if (!t.due_date) continue;
    const concluida = t.status === "concluída";
    eventos.push({
      id: `t-${t.id}`,
      camada: "tarefa",
      titulo: t.titulo,
      dia: t.due_date,
      hora: horaCurta(t.due_time),
      concluida,
      atrasada: !concluida && t.due_date < hoje,
      prioridade: t.prioridade ?? null,
      patientId: t.patient_id ?? null,
      pacienteNome: t.patients?.full_name ?? null,
      itens: t.itens ?? [],
      tarefa: t,
    });
  }

  for (const r of rotinas) {
    if (!r.ativa || !r.next_due) continue;
    eventos.push({
      id: `r-${r.id}`,
      camada: "rotina",
      titulo: r.titulo,
      dia: r.next_due,
      hora: null,
      concluida: false,
      atrasada: false,
      prioridade: null,
      patientId: null,
      pacienteNome: null,
      itens: [],
      tarefa: null,
    });
  }

  for (const p of planos) {
    if (!p.plano_vence) continue;
    eventos.push({
      id: `p-${p.id}`,
      camada: "plano",
      titulo: `Plano de ${p.full_name.split(" ")[0]} vence`,
      dia: p.plano_vence,
      hora: null,
      concluida: false,
      atrasada: false,
      prioridade: null,
      patientId: p.id,
      pacienteNome: p.full_name,
      itens: [],
      tarefa: null,
    });
  }

  return eventos;
}

/** Ordena os eventos de um dia: sem hora primeiro, depois por hora. */
export function ordenarDoDia(eventos: Evento[]) {
  return [...eventos].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    if (!a.hora && b.hora) return -1;
    if (a.hora && !b.hora) return 1;
    if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

export type Visao = "mes" | "semana" | "dia" | "agenda";
