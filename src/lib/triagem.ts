const DIA = 24 * 60 * 60 * 1000;

/** Queda de duas notas ou mais conta como regressão relevante. */
export const QUEDA_RELEVANTE = 2;

const DIA_SEMANA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: "America/Sao_Paulo",
});

const DIA_MES = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function diaDaSemana(agora: number) {
  return DIA_SEMANA.format(new Date(agora));
}

export type SemanaEngajamento = {
  rotulo: string;
  enviados: number;
  respondidos: number;
};

/**
 * Agrupa os links por semana, das mais antigas para a mais recente.
 * Cada balde começa no domingo, que é quando a Larissa faz a triagem.
 */
export function engajamentoPorSemana(
  links: { gerado_em: string; status: string }[],
  agora: number,
  quantas = 6,
): SemanaEngajamento[] {
  // O dia da semana sai da data já convertida para Brasília, senão
  // perto da meia-noite o balde cairia no dia errado.
  const dataSP = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(agora));

  const diaSemana = new Date(`${dataSP}T12:00:00Z`).getUTCDay();
  const inicioDestaSemana = Date.parse(`${dataSP}T00:00:00-03:00`) - diaSemana * DIA;

  const baldes: SemanaEngajamento[] = [];
  for (let i = quantas - 1; i >= 0; i--) {
    const inicio = inicioDestaSemana - i * 7 * DIA;
    baldes.push({
      rotulo: DIA_MES.format(new Date(inicio)),
      enviados: 0,
      respondidos: 0,
    });
  }

  for (const link of links) {
    const t = Date.parse(link.gerado_em);
    const idade = Math.floor((inicioDestaSemana - t) / (7 * DIA));
    // idade 0 é a semana atual, quanto maior mais antiga.
    const indice = quantas - 1 - idade;
    if (indice < 0 || indice >= quantas) continue;

    baldes[indice].enviados += 1;
    if (link.status === "respondido") baldes[indice].respondidos += 1;
  }

  return baldes;
}

export function diasAte(dataISO: string, agora: number) {
  return Math.ceil((Date.parse(dataISO) - agora) / DIA);
}
