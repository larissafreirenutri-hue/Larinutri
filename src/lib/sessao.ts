/**
 * ============================================================
 * SESSÃO ESTRATÉGICA
 *
 * Questionário curto de qualificação do site público. Não é
 * anamnese clínica. As opções e os textos ficam aqui para que o
 * formulário no navegador e a gravação do lead no servidor
 * concordem sempre, sem listas duplicadas que saem de sincronia.
 * ============================================================
 */

export const OBJETIVOS = [
  "Perder peso ou gordura",
  "Ganhar massa muscular",
  "Saúde e qualidade de vida",
  "Performance esportiva",
  "Reeducação alimentar",
  "Outro",
] as const;

export const MODALIDADES_ATENDIMENTO = [
  "Online",
  "Presencial no consultório",
  "Domiciliar",
] as const;

export const QUANDO_COMECAR = [
  "Essa semana",
  "Esse mês",
  "Só pesquisando por enquanto",
] as const;

export type RespostasSessao = {
  nome: string;
  whatsapp: string;
  email: string;
  objetivo: string;
  modalidade: string;
  tempo: string;
  trava: string;
  quando: string;
};

export const RESPOSTAS_VAZIAS: RespostasSessao = {
  nome: "",
  whatsapp: "",
  email: "",
  objetivo: "",
  modalidade: "",
  tempo: "",
  trava: "",
  quando: "",
};

/** Só deixa passar valor que esteja na lista, senão devolve vazio. */
export function daLista(valor: string, permitidos: readonly string[]): string {
  const t = (valor ?? "").trim();
  return permitidos.includes(t) ? t : "";
}

/**
 * Monta o texto que vai para observacoes do lead, legível para a
 * Larissa ler de bate pronto no funil de Vendas.
 */
export function observacoesLegiveis(r: RespostasSessao): string {
  return [
    `Objetivo principal: ${r.objetivo || "não informado"}`,
    `Modalidade preferida: ${r.modalidade || "não informada"}`,
    `Tempo de busca e histórico: ${r.tempo || "não informado"}`,
    `Principal obstáculo hoje: ${r.trava || "não informado"}`,
    `Quando quer começar: ${r.quando || "não informado"}`,
    `E-mail: ${r.email || "não informado"}`,
  ].join("\n");
}

/**
 * Mensagem de WhatsApp com um resumo das respostas, aberta na tela
 * de agradecimento para a pessoa mandar com um toque.
 */
export function mensagemWhatsAppResumo(r: RespostasSessao): string {
  return [
    "Oi Larissa, acabei de fazer a avaliação estratégica no site.",
    r.nome ? `Meu nome é ${r.nome}.` : "",
    r.objetivo ? `Meu objetivo é ${r.objetivo.toLowerCase()}.` : "",
    r.modalidade ? `Prefiro atendimento ${r.modalidade.toLowerCase()}.` : "",
    r.quando ? `Quero começar: ${r.quando.toLowerCase()}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
