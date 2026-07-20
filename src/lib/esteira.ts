export const TRIAGENS = ["a_responder", "respondido", "analisado"] as const;
export type Triagem = (typeof TRIAGENS)[number];

export function ehTriagem(v: string): v is Triagem {
  return (TRIAGENS as readonly string[]).includes(v);
}

export const ROTULO_TRIAGEM: Record<Triagem, string> = {
  a_responder: "A responder",
  respondido: "Respondido",
  analisado: "Analisado",
};
