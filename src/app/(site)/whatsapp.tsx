import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { Falta } from "./marcador";

const MENSAGEM = "Olá, Larissa. Vim pelo site e gostaria de saber mais sobre o acompanhamento nutricional.";

/** Link do WhatsApp com mensagem já preenchida, ou o aviso de pendência. */
export function BotaoWhatsApp({
  rotulo = "Falar no WhatsApp",
  className = "",
}: {
  rotulo?: string;
  className?: string;
}) {
  const numero = CONTEUDO.contato.whatsapp;

  if (ehPendente(numero)) {
    return <Falta o={numero.__pendente} />;
  }

  return (
    <a
      href={`https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-md bg-dourado px-7 py-3.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 ${className}`}
    >
      {rotulo}
    </a>
  );
}
