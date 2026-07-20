export const ETAPAS = [
  "Novo",
  "Contato feito",
  "Avaliação agendada",
  "Proposta enviada",
  "Fechado ganho",
  "Fechado perdido",
] as const;

export type Etapa = (typeof ETAPAS)[number];

export const ETAPA_GANHO: Etapa = "Fechado ganho";
export const ETAPA_PERDIDO: Etapa = "Fechado perdido";

/** As duas últimas encerram o funil, o resto é negociação em aberto. */
export const ETAPAS_FINAIS: Etapa[] = [ETAPA_GANHO, ETAPA_PERDIDO];
export const ETAPAS_ATIVAS: Etapa[] = ETAPAS.filter(
  (e) => !ETAPAS_FINAIS.includes(e),
);

export function ehEtapa(valor: string): valor is Etapa {
  return (ETAPAS as readonly string[]).includes(valor);
}

export const TIPOS_INTERACAO = [
  "Ligação",
  "Mensagem",
  "Reunião",
  "Nota",
] as const;

export type TipoInteracao = (typeof TIPOS_INTERACAO)[number];

export type Lead = {
  id: string;
  owner: string;
  nome: string;
  email: string | null;
  phone: string | null;
  origem: string | null;
  etapa: Etapa;
  valor: number | null;
  observacoes: string | null;
  patient_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Interacao = {
  id: string;
  owner: string;
  lead_id: string;
  tipo: TipoInteracao | null;
  descricao: string | null;
  occurred_at: string;
};

export type ResumoEtapa = {
  etapa: Etapa;
  quantidade: number;
  valor: number;
};

export type ResumoVendas = {
  emNegociacao: number;
  valorEmNegociacao: number;
  ganhosNoMes: number;
  valorGanhoNoMes: number;
  porEtapa: ResumoEtapa[];
  /** Ganhos sobre o total de finalizados. Null quando nada finalizou. */
  taxaConversao: number | null;
  finalizados: number;
};

/** Início do mês corrente no horário de Brasília, devolvido em UTC. */
function inicioDoMes(agora: number) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(agora));
  // partes vem como "2026-07"
  return Date.parse(`${partes}-01T00:00:00-03:00`);
}

export function resumirVendas(leads: Lead[], agora = Date.now()): ResumoVendas {
  const corteMes = inicioDoMes(agora);

  const porEtapa: ResumoEtapa[] = ETAPAS.map((etapa) => {
    const doGrupo = leads.filter((l) => l.etapa === etapa);
    return {
      etapa,
      quantidade: doGrupo.length,
      valor: doGrupo.reduce((soma, l) => soma + (l.valor ?? 0), 0),
    };
  });

  const ativos = leads.filter((l) => !ETAPAS_FINAIS.includes(l.etapa));

  const ganhosNoMes = leads.filter(
    (l) => l.etapa === ETAPA_GANHO && Date.parse(l.updated_at) >= corteMes,
  );

  const ganhos = leads.filter((l) => l.etapa === ETAPA_GANHO).length;
  const perdidos = leads.filter((l) => l.etapa === ETAPA_PERDIDO).length;
  const finalizados = ganhos + perdidos;

  return {
    emNegociacao: ativos.length,
    valorEmNegociacao: ativos.reduce((soma, l) => soma + (l.valor ?? 0), 0),
    ganhosNoMes: ganhosNoMes.length,
    valorGanhoNoMes: ganhosNoMes.reduce((soma, l) => soma + (l.valor ?? 0), 0),
    porEtapa,
    taxaConversao: finalizados === 0 ? null : ganhos / finalizados,
    finalizados,
  };
}
