import type { Checkin } from "./tipos";

/**
 * As dez dimensões do check-in, com rótulo, cor e as âncoras das
 * pontas. Tudo saiu da referência checkin-amanda-santiago-semana-12.
 * A ordem aqui é a ordem em que aparecem na ficha e no formulário.
 */
export type Dimensao = {
  chave: keyof Checkin;
  campo: string;
  rotulo: string;
  cor: string;
  baixo: string;
  alto: string;
  secao: "alimentacao" | "treino" | "bemestar" | "fechamento";
};

export const DIMENSOES: Dimensao[] = [
  {
    chave: "adesao_plano",
    campo: "adesao_plano",
    rotulo: "Adesão ao plano",
    cor: "#A9723F",
    baixo: "furei tudo",
    alto: "segui certinho",
    secao: "alimentacao",
  },
  {
    chave: "saciedade",
    campo: "saciedade",
    rotulo: "Saciedade",
    cor: "#3FA9C4",
    baixo: "fome o tempo todo",
    alto: "bem saciado",
    secao: "alimentacao",
  },
  {
    chave: "controle_vontade",
    campo: "controle_vontade",
    rotulo: "Controle da vontade",
    cor: "#7C6BD1",
    baixo: "vontade extrema",
    alto: "no controle",
    secao: "alimentacao",
  },
  {
    chave: "hidratacao",
    campo: "hidratacao",
    rotulo: "Hidratação",
    cor: "#2FA3B8",
    baixo: "longe da meta",
    alto: "bati a meta",
    secao: "alimentacao",
  },
  {
    chave: "recuperacao_energia",
    campo: "recuperacao_energia",
    rotulo: "Recuperação e energia",
    cor: "#5FAE5A",
    baixo: "exausto",
    alto: "recuperado",
    secao: "treino",
  },
  {
    chave: "digestao",
    campo: "digestao",
    rotulo: "Digestão",
    cor: "#C99A3A",
    baixo: "muito ruim",
    alto: "ótima",
    secao: "bemestar",
  },
  {
    chave: "sono",
    campo: "sono",
    rotulo: "Sono",
    cor: "#4C7CC9",
    baixo: "péssimo",
    alto: "excelente",
    secao: "bemestar",
  },
  {
    chave: "humor",
    campo: "humor",
    rotulo: "Humor",
    cor: "#E0812E",
    baixo: "muito baixo",
    alto: "ótimo",
    secao: "bemestar",
  },
  {
    chave: "tranquilidade",
    campo: "tranquilidade",
    rotulo: "Tranquilidade",
    cor: "#8AA24A",
    baixo: "muito estresse",
    alto: "tranquilo",
    secao: "bemestar",
  },
  {
    chave: "semana_geral",
    campo: "semana_geral",
    rotulo: "Semana no geral",
    cor: "#4A3220",
    baixo: "péssima",
    alto: "excelente",
    secao: "fechamento",
  },
];

/** Ordem em que a ficha lista as dimensões, igual à referência. */
export const ORDEM_FICHA: Dimensao["campo"][] = [
  "adesao_plano",
  "saciedade",
  "controle_vontade",
  "hidratacao",
  "digestao",
  "sono",
  "recuperacao_energia",
  "humor",
  "tranquilidade",
  "semana_geral",
];

export const DIMENSOES_DA_FICHA = ORDEM_FICHA.map(
  (campo) => DIMENSOES.find((d) => d.campo === campo) as Dimensao,
);

const MEL = "#E0A32E";
const ARGILA = "#BC5443";

/**
 * A cor da nota segue a regra da referência: 7 ou mais usa a cor da
 * dimensão, 5 e 6 vira âmbar, abaixo disso vira vermelho tijolo.
 */
export function corDaNota(nota: number, corDaDimensao: string) {
  if (nota >= 7) return corDaDimensao;
  if (nota >= 5) return MEL;
  return ARGILA;
}

export function notaDe(checkin: Checkin, campo: string): number | null {
  const valor = (checkin as unknown as Record<string, unknown>)[campo];
  return typeof valor === "number" ? valor : null;
}

/** Quantas das dez dimensões foram respondidas. */
export function notasPreenchidas(checkin: Checkin) {
  return DIMENSOES_DA_FICHA.filter((d) => notaDe(checkin, d.campo) !== null)
    .length;
}
