"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CONTEUDO } from "@/lib/conteudo";

const NUMERO = CONTEUDO.contato.whatsapp;
const linkDireto = `https://wa.me/${NUMERO}?text=${encodeURIComponent(
  CONTEUDO.contato.whatsappConsultoria,
)}`;

/**
 * CTA principal da consultoria. Não leva direto a lugar nenhum: abre um
 * modal com dois caminhos equilibrados, o WhatsApp na hora ou a
 * avaliação estratégica. A opção rápida nunca fica escondida, para não
 * criar atrito com quem quer só chamar no WhatsApp.
 */
export function CtaConsultoria({
  rotulo = "Agendar avaliação",
  className = "",
}: {
  rotulo?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`inline-block rounded-full bg-[#4a3626] px-7 py-3.5 font-sans text-sm font-semibold text-[#f4ecde] transition hover:bg-[#2e2119] ${className}`}
      >
        {rotulo}
      </button>

      {aberto
        ? createPortal(
            // Portal para o body porque o cabeçalho tem backdrop-filter,
            // o que tornaria o position:fixed relativo a ele. A classe
            // sitio reaplica o tema claro, já que fora do wrapper do site
            // os tokens voltariam ao padrão do painel.
            <div className="sitio">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Como você prefere começar"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-dourado/20 bg-[#fbf6ee] p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dourado">
                  Consultoria nutricional
                </p>
                <h2 className="mt-2 font-display text-2xl text-creme">
                  Como você prefere começar?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="shrink-0 rounded-full p-1 text-creme/50 transition hover:text-creme"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {/* Opção B, recomendada, mas sem bloquear a opção A */}
              <Link
                href="/sessao-estrategica"
                className="group rounded-2xl border border-dourado/40 bg-dourado/10 p-5 transition hover:border-dourado"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg text-creme">
                    Fazer a avaliação estratégica
                  </h3>
                  <span className="shrink-0 rounded-full bg-dourado px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#4a3626]">
                    Recomendado
                  </span>
                </div>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-creme/70">
                  Responda algumas perguntas rápidas e já adiante o seu
                  atendimento com a Larissa.
                </p>
              </Link>

              {/* Opção A, o caminho rápido, sempre visível */}
              <a
                href={linkDireto}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-dourado/20 bg-creme/[0.03] p-5 transition hover:border-dourado/50"
              >
                <h3 className="font-display text-lg text-creme">
                  Falar agora no WhatsApp
                </h3>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-creme/70">
                  Conversa rápida e direta, sem perguntas.
                </p>
              </a>
            </div>
          </div>
        </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
