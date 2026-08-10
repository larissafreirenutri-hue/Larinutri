import { CONTEUDO, ehPendente } from "@/lib/conteudo";

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
