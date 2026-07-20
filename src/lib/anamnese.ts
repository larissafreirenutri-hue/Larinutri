/**
 * Definição das perguntas da anamnese. O formulário público e a aba
 * da ficha leem daqui, então a ordem, os rótulos e as opções vivem num
 * lugar só. As respostas são guardadas em jsonb com estas chaves.
 */

export type TipoPergunta =
  | "texto"
  | "textoLongo"
  | "numero"
  | "data"
  | "unica"
  | "multipla"
  | "escala";

export type Pergunta = {
  chave: string;
  rotulo: string;
  tipo: TipoPergunta;
  obrigatorio?: boolean;
  opcoes?: string[];
  // Acrescenta uma opção "Outro" com campo de texto livre.
  temOutro?: boolean;
  dica?: string;
  min?: number;
  max?: number;
};

export type Secao = {
  chave: string;
  titulo: string;
  apoio: string;
  perguntas: Pergunta[];
};

const MORADORES = [
  "Marido, esposa ou companheiro",
  "Filhos",
  "Pai ou mãe",
  "Irmãos",
];

export const SECOES_ANAMNESE: Secao[] = [
  {
    chave: "identificacao",
    titulo: "Identificação",
    apoio: "Vamos começar te conhecendo.",
    perguntas: [
      { chave: "nome_completo", rotulo: "Nome completo", tipo: "texto", obrigatorio: true },
      {
        chave: "sexo",
        rotulo: "Sexo biológico",
        tipo: "unica",
        obrigatorio: true,
        opcoes: ["Feminino", "Masculino"],
      },
      { chave: "nascimento", rotulo: "Data de nascimento", tipo: "data" },
      { chave: "peso", rotulo: "Peso atual, em quilos", tipo: "texto", obrigatorio: true, dica: "Ex: 72,4" },
      { chave: "altura", rotulo: "Altura, em metros", tipo: "texto", obrigatorio: true, dica: "Ex: 1,65" },
    ],
  },
  {
    chave: "objetivos",
    titulo: "Objetivos",
    apoio: "O que te trouxe até aqui e onde você quer chegar.",
    perguntas: [
      {
        chave: "objetivos",
        rotulo: "Quais são os seus objetivos principais?",
        tipo: "multipla",
        obrigatorio: true,
        temOutro: true,
        opcoes: [
          "Perder peso ou gordura",
          "Ganhar peso ou massa",
          "Melhorar a forma física geral",
          "Melhor qualidade de vida",
          "Performance esportiva",
        ],
      },
      {
        chave: "objetivos_porque",
        rotulo: "Por que esses objetivos são importantes para você?",
        tipo: "textoLongo",
      },
      {
        chave: "obstaculos",
        rotulo:
          "O que você acha que tem ficado no seu caminho e vem te impedindo de chegar nos seus objetivos?",
        tipo: "multipla",
        temOutro: true,
        opcoes: [
          "Não sei o que ou quanto comer",
          "Falta de constância",
          "Falta de organização ou rotina bagunçada",
          "Comer emocional",
          "Falta de acompanhamento",
          "Autossabotagem",
        ],
      },
      {
        chave: "preocupacoes",
        rotulo:
          "Cite as três preocupações mais importantes ou urgentes sobre a sua saúde, corpo, hábitos, capacidade física ou bem-estar.",
        tipo: "textoLongo",
      },
      {
        chave: "tentativas",
        rotulo:
          "Você já tentou algo no passado para mudar hábitos, saúde, alimentação ou corpo?",
        tipo: "texto",
      },
      {
        chave: "nota_habitos",
        rotulo: "Que nota você daria para os seus hábitos alimentares hoje?",
        tipo: "escala",
        min: 1,
        max: 10,
      },
      {
        chave: "nota_habitos_porque",
        rotulo: "Por que você se deu essa nota?",
        tipo: "textoLongo",
      },
    ],
  },
  {
    chave: "rotina",
    titulo: "Rotina e casa",
    apoio: "O seu dia a dia influencia direto no que vai funcionar para você.",
    perguntas: [
      {
        chave: "exercicio",
        rotulo:
          "Você se exercita regularmente? Quais esportes ou exercícios, quantas vezes por semana e quantas horas por dia?",
        tipo: "textoLongo",
        obrigatorio: true,
      },
      {
        chave: "nivel_rotina",
        rotulo: "Como você classificaria a sua rotina diária fora dos treinos?",
        tipo: "unica",
        obrigatorio: true,
        temOutro: true,
        opcoes: [
          "Muito sedentária",
          "Pouco ativa",
          "Moderadamente ativa",
          "Muito ativa",
        ],
      },
      {
        chave: "moram_com_voce",
        rotulo: "Quem mora com você?",
        tipo: "multipla",
        temOutro: true,
        opcoes: MORADORES,
      },
      {
        chave: "quem_cozinha",
        rotulo: "Quem cozinha mais na sua casa?",
        tipo: "multipla",
        temOutro: true,
        opcoes: [...MORADORES, "Eu mesmo", "Cozinheira ou auxiliar"],
      },
      {
        chave: "quem_compra",
        rotulo: "Quem faz a maioria das compras de suprimentos?",
        tipo: "multipla",
        temOutro: true,
        opcoes: [...MORADORES, "Eu mesmo", "Cozinheira ou auxiliar"],
      },
      { chave: "profissao", rotulo: "Qual é a sua profissão?", tipo: "texto" },
      {
        chave: "tempo_trabalho",
        rotulo: "Quanto tempo você passa diariamente no trabalho?",
        tipo: "texto",
      },
    ],
  },
  {
    chave: "saude",
    titulo: "Histórico de saúde",
    apoio: "Tudo aqui é confidencial e ajuda a montar um plano seguro.",
    perguntas: [
      {
        chave: "condicoes",
        rotulo:
          "Você ou alguém da família já foi diagnosticado com condição médica significante ou lesão? Se sim, quais?",
        tipo: "texto",
      },
      {
        chave: "restricao",
        rotulo: "Alguma restrição alimentar, alergia ou intolerância?",
        tipo: "texto",
        obrigatorio: true,
        dica: "Se não houver, escreva Nenhuma",
      },
      {
        chave: "substancias",
        rotulo:
          "Faz uso de bebida alcoólica, tabaco ou outras substâncias? Com que frequência?",
        tipo: "texto",
      },
      {
        chave: "medicacao",
        rotulo:
          "Você usa alguma medicação, prescrita ou por conta própria? Por exemplo estimulantes, ergogênicos, antidepressivos, anticoncepcionais.",
        tipo: "texto",
      },
    ],
  },
  {
    chave: "sono",
    titulo: "Sono",
    apoio: "O sono conversa com a fome, o humor e a recuperação.",
    perguntas: [
      {
        chave: "horas_sono",
        rotulo: "Em média, quantas horas você dorme por noite?",
        tipo: "unica",
        opcoes: [
          "Menos de 5",
          "5 a 6",
          "6 a 7",
          "7 a 8",
          "8 a 9",
          "Mais de 9",
          "Varia muito",
        ],
      },
      {
        chave: "qualidade_sono",
        rotulo: "Como você considera a qualidade do seu sono?",
        tipo: "unica",
        opcoes: [
          "Muito ruim, acordo cansado quase sempre",
          "Ruim, durmo mal com frequência",
          "Regular, alguns dias bons e outros ruins",
          "Boa, acordo descansado na maioria dos dias",
          "Excelente, durmo muito bem",
        ],
      },
      {
        chave: "rotina_sono",
        rotulo:
          "Que horas você costuma acordar e dormir? Conte um pouco da sua rotina diária.",
        tipo: "textoLongo",
      },
    ],
  },
  {
    chave: "prontidao",
    titulo: "Prontidão e preferências",
    apoio: "Reta final. Isto guia o plano alimentar inicial.",
    perguntas: [
      {
        chave: "pronto",
        rotulo:
          "O quão pronto você está para mudar hábitos e comportamentos?",
        tipo: "escala",
        min: 1,
        max: 10,
      },
      {
        chave: "quer",
        rotulo: "O quanto você quer mudar os seus hábitos?",
        tipo: "escala",
        min: 1,
        max: 10,
      },
      {
        chave: "capaz",
        rotulo: "O quanto você se acha capaz de mudar os seus hábitos?",
        tipo: "escala",
        min: 1,
        max: 10,
      },
      {
        chave: "comidas_quer",
        rotulo:
          "Cite comidas que você quer no planejamento e que não podem faltar.",
        tipo: "textoLongo",
        obrigatorio: true,
      },
      {
        chave: "comidas_nao_quer",
        rotulo: "Cite comidas que você não quer no planejamento.",
        tipo: "textoLongo",
        obrigatorio: true,
      },
      {
        chave: "frutas",
        rotulo:
          "Quais frutas você normalmente tem em casa e gosta de comer?",
        tipo: "textoLongo",
      },
      {
        chave: "dia_comum",
        rotulo:
          "Descreva como são as suas refeições num dia comum, café, almoço, jantar e lanches. Quanto mais detalhes, melhor, porque o planejamento inicial parte desse histórico.",
        tipo: "textoLongo",
        obrigatorio: true,
      },
    ],
  },
];

export const TODAS_PERGUNTAS = SECOES_ANAMNESE.flatMap((s) => s.perguntas);

/** Deriva o texto de objetivo para preencher o campo do paciente. */
export function objetivoDasRespostas(
  respostas: Record<string, unknown>,
): string {
  const lista = respostas.objetivos;
  const partes: string[] = Array.isArray(lista)
    ? lista.filter((x): x is string => typeof x === "string")
    : [];
  const outro = respostas.objetivos_outro;
  if (typeof outro === "string" && outro.trim()) partes.push(outro.trim());
  return partes.join(", ");
}

export const STATUS_LINK_ANAMNESE = [
  "gerado",
  "enviado",
  "respondido",
  "expirado",
] as const;

export type StatusLinkAnamnese = (typeof STATUS_LINK_ANAMNESE)[number];

export type AnamneseLink = {
  id: string;
  owner: string;
  patient_id: string;
  token: string;
  status: StatusLinkAnamnese;
  gerado_em: string;
  expira_em: string;
  anamnese_id: string | null;
};

export type Anamnese = {
  id: string;
  owner: string;
  patient_id: string;
  respostas: Record<string, unknown>;
  substituida_em: string | null;
  created_at: string;
};

/** Token de anamnese, sem semana. Prefixo am para distinguir do check-in. */
export function gerarTokenAnamnese() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `am_${hex.slice(0, 6)}_${hex.slice(6)}`;
}

/** Status efetivo, considerando a expiração. */
export function statusEfetivoAnamnese(link: AnamneseLink, agora = Date.now()) {
  if (link.status === "respondido") return "respondido";
  if (Date.parse(link.expira_em) <= agora) return "expirado";
  return link.status;
}
