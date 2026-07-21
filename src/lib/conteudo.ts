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
    // O título é montado em três partes para uma palavra sair em
    // itálico dourado, como nas referências editoriais.
    tituloAntes: "Uma nova relação com a",
    tituloDestaque: "comida",
    tituloDepois: "começa aqui.",
    apoio:
      "Acompanhamento nutricional que olha o conjunto, sua rotina, seu sono, a sua vida real, não só o número da balança.",
    selo: "Atendimento on-line e domiciliar",
    // Frase antiga, mantida na aba do navegador e como reserva.
    frase: "Peso é contexto, não veredito.",
  },

  // Três passos do "como funciona".
  passos: [
    {
      titulo: "Entre em contato",
      texto:
        "Me chame no WhatsApp e conte um pouco sobre o seu momento e o que você busca.",
    },
    {
      titulo: "Avaliação inicial",
      texto:
        "Preenchemos juntos a sua anamnese, entendendo rotina, histórico, sono e preferências.",
    },
    {
      titulo: "Seu plano começa",
      texto:
        "Você recebe um plano que cabe na sua vida, e a gente ajusta toda semana pelo check-in.",
    },
  ],

  // Grade de especialidades da seção de serviços.
  especialidadesCards: [
    {
      nome: "Emagrecimento",
      texto: "Perder gordura sem passar fome nem viver de restrição.",
    },
    {
      nome: "Hipertrofia",
      texto: "Comer para construir massa e sustentar o seu treino.",
    },
    {
      nome: "Reeducação alimentar",
      texto: "Trocar a dieta que não dura por hábitos que ficam.",
    },
    {
      nome: "Saúde e qualidade de vida",
      texto: "Mais energia, sono melhor e uma relação leve com a comida.",
    },
  ],

  depoimento: {
    texto:
      "Consegui emagrecer 15 quilos sem deixar de ter momentos sociais com a minha família e sem deixar de comer o que eu gosto.",
    atribuicao: "Paciente, identidade preservada",
  },

  praticas: [
    {
      titulo: "Onde e como",
      texto:
        "Atendimento on-line para qualquer lugar, e domiciliar no formato home care.",
    },
    {
      titulo: "Como agendar",
      texto:
        "O primeiro contato é pelo WhatsApp. Combinamos horário e formato pela conversa.",
    },
    {
      titulo: "O que esperar",
      texto:
        "Um plano feito para a sua rotina, com acompanhamento de verdade toda semana.",
    },
  ],

  chamadaFinal: {
    antes: "Pronta para começar a sua",
    destaque: "mudança",
    depois: "?",
    apoio: "O primeiro passo é uma conversa. Sem compromisso.",
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
    // Retratos verticais de verdade, então o enquadramento fica no
    // centro, sem o corte lateral que a foto paisagem antiga exigia.
    foto: "/larissa-hero.jpg",
    fotoSobre: "/larissa-sobre.jpg",
    fotoPosicao: "center top",
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
