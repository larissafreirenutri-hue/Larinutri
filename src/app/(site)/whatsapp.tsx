import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { Falta } from "./marcador";

/**
 * Monta o link do WhatsApp com a mensagem já preenchida. Devolve null
 * quando o número ainda está pendente, para quem chama decidir o que
 * mostrar no lugar.
 */
export function linkWhatsApp(mensagem: string): string | null {
  const numero = CONTEUDO.contato.whatsapp;
  if (ehPendente(numero)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Botão sólido do WhatsApp, o CTA principal do site. Por padrão abre a
 * conversa sobre a consultoria, o caminho de quem quer virar paciente.
 */
export function BotaoWhatsApp({
  rotulo = "Agendar avaliação",
  mensagem = CONTEUDO.contato.whatsappConsultoria,
  className = "",
}: {
  rotulo?: string;
  mensagem?: string;
  className?: string;
}) {
  const href = linkWhatsApp(mensagem);

  if (!href) {
    const numero = CONTEUDO.contato.whatsapp;
    return ehPendente(numero) ? <Falta o={numero.__pendente} /> : null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-full bg-[#4a3626] px-7 py-3.5 font-sans text-sm font-semibold text-[#f4ecde] transition hover:bg-[#2e2119] ${className}`}
    >
      {rotulo}
    </a>
  );
}
