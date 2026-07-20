/**
 * ============================================================
 * CONTEÚDO DO SITE PÚBLICO
 *
 * Este é o único arquivo que você precisa editar para preencher
 * o site. Onde houver pendente("..."), troque a chamada inteira
 * por um texto entre aspas.
 *
 * Antes:   crn: pendente("número do CRN, ex: CRN-3 12345"),
 * Depois:  crn: "CRN-3 12345",
 *
 * Enquanto for pendente, o site mostra um aviso dourado visível
 * no lugar, impossível de passar despercebido em produção.
 * ============================================================
 */

export type Pendente = { __pendente: string };
export type Texto = string | Pendente;

export function pendente(oQueFalta: string): Pendente {
  return { __pendente: oQueFalta };
}

export function ehPendente(valor: Texto): valor is Pendente {
  return typeof valor !== "string";
}

/** Lista tudo que ainda falta, para o aviso de desenvolvimento. */
export function pendencias(): string[] {
  const achados: string[] = [];

  const varrer = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    if ("__pendente" in obj) {
      achados.push((obj as Pendente).__pendente);
      return;
    }
    Object.values(obj).forEach(varrer);
  };

  varrer(CONTEUDO);
  return achados;
}

export const CONTEUDO = {
  marca: {
    nome: "Larissa Freire",
    profissao: "Nutricionista",
    // Aparece na aba do navegador e no Google.
    descricaoSite:
      "Acompanhamento nutricional individual, com check-in semanal e ajustes contínuos no seu plano.",
  },

  hero: {
    // Frase recuperada do protótipo antigo, é a voz dela.
    frase: "Peso é contexto, não veredito.",
    apoio:
      "Acompanhamento nutricional que olha o conjunto, sua adesão, seu sono, sua digestão e sua rotina, não só o número da balança.",
  },

  sobre: {
    titulo: "Sobre mim",
    // Escreva em primeira pessoa, de 2 a 4 parágrafos.
    // Separe os parágrafos com uma linha em branco.
    texto: `Me formei em nutrição pela UFRN em 2026, movida por uma convicção simples. A alimentação muda a vida das pessoas, e ela não precisa ser sofrimento para funcionar.

O que me trouxe para cá foi enxergar o quanto uma dieta impossível de seguir atrapalha mais do que ajuda. Um plano que não cabe na sua rotina você abandona na terceira semana, e ainda fica com a sensação de ter falhado. Eu trabalho no contrário disso, montando um plano que conversa com a sua vida real, com o seu trabalho, a sua casa e as suas vontades.

Acompanho pessoas que querem mudar de verdade, se sentir melhor consigo mesmas e manter uma rotina equilibrada. Sem neurose, sem lista de alimentos proibidos, e com resultado que aparece justamente porque você consegue sustentar.

Se é isso que você procura, vamos conversar.`,
    // O registro sai depois da colação de grau, em 30 de julho de 2026.
    // Enquanto estiver pendente, o selo simplesmente não aparece no
    // site, em vez de mostrar um aviso de campo vazio ao visitante.
    crn: pendente("número do CRN-6, disponível após a colação"),
    especialidades: ["Nutrição Clínica", "Nutrição Esportiva"] as string[],
    foto: "/larissa.jpg",
    // A foto original é paisagem. Este ajuste centraliza a Larissa
    // no corte vertical, senão ela fica deslocada para a direita.
    fotoPosicao: "57% center",
  },

  servicos: {
    titulo: "Como funciona o acompanhamento",
    // Estes três textos foram derivados da copy do protótipo antigo.
    // Confira se descrevem mesmo o que você oferece, e ajuste à vontade.
    itens: [
      {
        nome: "Avaliação inicial",
        texto:
          "Começamos entendendo a sua rotina por inteiro. Peso de partida, como anda o seu sono, o treino que cabe na sua semana e a sua meta de água. É a base do plano, e você preenche uma vez só.",
      },
      {
        nome: "Check-in semanal",
        texto:
          "Toda semana você responde um formulário curto, uns três minutos, sobre adesão, fome, sono e como foi a semana. É rápido de propósito, porque o que importa é a constância.",
      },
      {
        nome: "Ajuste contínuo",
        texto:
          "Eu leio cada resposta e ajusto o seu plano com base no conjunto, não em um número isolado. Variação de peso sozinha não diz se você avançou.",
      },
    ],
  },

  contato: {
    titulo: "Vamos conversar",
    apoio:
      "Me conte um pouco sobre o seu momento e o que você busca. Respondo pessoalmente.",
    whatsapp: "5584999480167",
    instagram: "larissafreirep",
    email: "larissafreirenutri@gmail.com",
    atendimento: "On-line e domiciliar, no formato home care",
  },

  privacidade: {
    // Quem responde pelos dados perante a LGPD.
    responsavel: "Larissa Freire, nutricionista",
    // E-mail para pedidos de acesso, correção ou exclusão de dados.
    emailEncarregado: "larissafreirenutri@gmail.com",
    atualizadoEm: "19 de julho de 2026",
  },
} as const;
