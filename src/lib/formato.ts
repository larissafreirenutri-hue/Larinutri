const DATA_BR = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const DATA_HORA_BR = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const DATA_EXTENSO = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function formatarData(iso: string) {
  return DATA_BR.format(new Date(iso));
}

/** Ex: "domingo, 19 de julho de 2026" */
export function formatarDataExtenso(momento: number | string) {
  return DATA_EXTENSO.format(new Date(momento));
}

export function formatarDataHora(iso: string) {
  return DATA_HORA_BR.format(new Date(iso));
}

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarMoeda(valor: number | null) {
  if (valor === null) return null;
  return MOEDA.format(valor);
}

/** Data no formato do input type="date", no fuso de Brasília. */
export function paraCampoData(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/** Peso com uma casa decimal e vírgula, como se escreve no Brasil. */
export function formatarPeso(kg: number | null) {
  if (kg === null) return null;
  return `${kg.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg`;
}

/** Variação de peso com sinal explícito, para leitura rápida. */
export function formatarVariacao(delta: number) {
  const sinal = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const valor = Math.abs(delta).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sinal}${valor} kg`;
}
