import { CONTEUDO, ehPendente } from "@/lib/conteudo";

const MENSAGEM =
  "Olá, Larissa. Vim pelo site e gostaria de saber mais sobre o acompanhamento nutricional.";

/** Botão fixo no canto, visível durante toda a rolagem. */
export function WhatsAppFlutuante() {
  const numero = CONTEUDO.contato.whatsapp;
  if (ehPendente(numero)) return null;

  return (
    <a
      href={`https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition hover:scale-105 hover:brightness-105 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden>
        <path d="M17.6 6.3A7.9 7.9 0 0 0 12 4a7.9 7.9 0 0 0-6.8 11.9L4 20l4.2-1.1A7.9 7.9 0 0 0 12 20a7.9 7.9 0 0 0 5.6-13.7zM12 18.5a6.6 6.6 0 0 1-3.4-.9l-.2-.1-2.5.7.7-2.4-.2-.3A6.6 6.6 0 1 1 12 18.5zm3.6-4.9c-.2-.1-1.2-.6-1.3-.6-.2-.1-.3-.1-.4.1l-.6.7c-.1.1-.2.1-.4 0a5.4 5.4 0 0 1-1.6-1 6 6 0 0 1-1.1-1.4c-.1-.2 0-.3.1-.4l.3-.4.2-.3v-.4l-.6-1.4c-.1-.4-.3-.3-.4-.3h-.4a.7.7 0 0 0-.5.2 2 2 0 0 0-.7 1.6 3.6 3.6 0 0 0 .8 1.9 8.2 8.2 0 0 0 3.1 2.8c1.1.4 1.5.5 2 .4.3 0 1-.4 1.2-.8.1-.4.1-.8.1-.9z" />
      </svg>
    </a>
  );
}
