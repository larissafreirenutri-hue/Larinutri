/**
 * Ponte entre o modelo antigo de adesão, que era texto (Baixa, Média,
 * Alta), e o novo, que é nota inteira de 0 a 10.
 *
 * Os cortes seguem a regra de cor das referências: 7 ou mais é bom,
 * 5 e 6 é atenção, abaixo disso é alerta.
 */

export type RotuloNota = "Baixa" | "Média" | "Alta";

export function rotuloDaNota(nota: number): RotuloNota {
  if (nota >= 7) return "Alta";
  if (nota >= 5) return "Média";
  return "Baixa";
}

const NOTA_DO_ROTULO: Record<string, number> = {
  Baixa: 2,
  Média: 5.5,
  Alta: 8.5,
};

/** Aceita o formato novo e o antigo, e devolve sempre um rótulo. */
export function normalizarAdesao(
  valor: number | string | null | undefined,
): RotuloNota | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") return rotuloDaNota(valor);
  return valor === "Baixa" || valor === "Média" || valor === "Alta"
    ? valor
    : null;
}

/** Converte qualquer um dos dois formatos para nota de 0 a 10. */
export function notaDaAdesao(
  valor: number | string | null | undefined,
): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") return valor;
  return NOTA_DO_ROTULO[valor] ?? null;
}

/** Escolhe o valor novo, e cai no legado enquanto ele existir. */
export function adesaoDoCheckin(c: {
  adesao_plano?: number | null;
  adesao_plano_texto?: string | null;
}) {
  return c.adesao_plano ?? c.adesao_plano_texto ?? null;
}
