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

export function formatarData(iso: string) {
  return DATA_BR.format(new Date(iso));
}

export function formatarDataHora(iso: string) {
  return DATA_HORA_BR.format(new Date(iso));
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
