"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CONTEUDO } from "@/lib/conteudo";
import {
  OBJETIVOS,
  MODALIDADES_ATENDIMENTO,
  QUANDO_COMECAR,
  RESPOSTAS_VAZIAS,
  mensagemWhatsAppResumo,
  type RespostasSessao,
} from "@/lib/sessao";
import { enviarSessaoEstrategica } from "./actions";

const NUMERO = CONTEUDO.contato.whatsapp;

function linkWa(mensagem: string) {
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(mensagem)}`;
}

const SOLIDO =
  "inline-flex items-center justify-center rounded-full bg-[#4a3626] px-7 py-3.5 font-sans text-sm font-semibold text-[#f4ecde] transition hover:bg-[#2e2119] disabled:cursor-not-allowed disabled:opacity-40";

type Chave = keyof RespostasSessao;

type Passo =
  | { chave: Chave; tipo: "input"; inputTipo: string; titulo: string; ajuda?: string; opcional?: boolean; placeholder?: string }
  | { chave: Chave; tipo: "textarea"; titulo: string; ajuda?: string; placeholder?: string }
  | { chave: Chave; tipo: "escolha"; titulo: string; ajuda?: string; opcoes: readonly string[] }
  | { chave: "consentimento"; tipo: "consentimento"; titulo: string };

const PASSOS: Passo[] = [
  { chave: "nome", tipo: "input", inputTipo: "text", titulo: "Para começar, como você se chama?", placeholder: "Seu nome" },
  { chave: "whatsapp", tipo: "input", inputTipo: "tel", titulo: "Qual o seu WhatsApp com DDD?", ajuda: "É por onde a Larissa vai falar com você.", placeholder: "84 99999 9999" },
  { chave: "email", tipo: "input", inputTipo: "email", titulo: "Seu e-mail, se quiser deixar.", ajuda: "Opcional, você pode pular.", opcional: true, placeholder: "voce@email.com" },
  { chave: "objetivo", tipo: "escolha", titulo: "Qual é o seu principal objetivo?", opcoes: OBJETIVOS },
  { chave: "modalidade", tipo: "escolha", titulo: "Como você prefere ser atendida?", opcoes: MODALIDADES_ATENDIMENTO },
  { chave: "tempo", tipo: "textarea", titulo: "Há quanto tempo você busca esse resultado, e já fez acompanhamento antes?", placeholder: "Conte em uma ou duas frases." },
  { chave: "trava", tipo: "textarea", titulo: "O que mais te trava hoje?", placeholder: "O que mais atrapalha no seu dia a dia." },
  { chave: "quando", tipo: "escolha", titulo: "Quando você quer começar?", opcoes: QUANDO_COMECAR },
  { chave: "consentimento", tipo: "consentimento", titulo: "Quase lá. Só falta o seu consentimento." },
];

const TOTAL = PASSOS.length;

export function Questionario() {
  const [passo, setPasso] = useState(0);
  const [r, setR] = useState<RespostasSessao>(RESPOSTAS_VAZIAS);
  const [consentimento, setConsentimento] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, iniciar] = useTransition();

  const atual = PASSOS[passo];

  function setResposta(chave: Chave, valor: string) {
    setR((v) => ({ ...v, [chave]: valor }));
  }

  /** Diz se o passo atual pode avançar, e serve para desabilitar o botão. */
  function valido(): boolean {
    if (atual.tipo === "consentimento") return consentimento;
    if (atual.tipo === "escolha") return r[atual.chave].trim().length > 0;
    const valor = r[atual.chave as Chave].trim();
    if (atual.tipo === "input") {
      if (atual.chave === "nome") return valor.length >= 2;
      if (atual.chave === "whatsapp") return valor.replace(/\D/g, "").length >= 10;
      if (atual.chave === "email") return valor === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }
    if (atual.tipo === "textarea") return valor.length >= 2;
    return true;
  }

  function avancar() {
    if (!valido()) return;
    setErro(null);
    if (passo < TOTAL - 1) setPasso((p) => p + 1);
  }

  function voltar() {
    setErro(null);
    if (passo > 0) setPasso((p) => p - 1);
  }

  function escolher(valor: string) {
    setResposta(atual.chave as Chave, valor);
    setErro(null);
    // Pequena pausa para a seleção ser vista antes de virar a tela.
    window.setTimeout(() => setPasso((p) => Math.min(p + 1, TOTAL - 1)), 160);
  }

  function enviar() {
    setErro(null);
    iniciar(async () => {
      const resultado = await enviarSessaoEstrategica({ ...r, consentimento });
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      setEnviado(true);
    });
  }

  if (enviado) {
    return <Agradecimento respostas={r} />;
  }

  const progresso = Math.round(((passo + 1) / TOTAL) * 100);

  return (
    <div className="w-full max-w-xl">
      {/* Barra de progresso */}
      <div className="mb-8">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-dourado/15">
          <div
            className="h-full rounded-full bg-dourado transition-all duration-500 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-dourado">
          Pergunta {passo + 1} de {TOTAL}
        </p>
      </div>

      <div className="min-h-[220px]">
        <h1 className="font-display text-2xl leading-snug text-creme sm:text-3xl">
          {atual.titulo}
        </h1>
        {"ajuda" in atual && atual.ajuda ? (
          <p className="mt-2 font-sans text-sm text-creme/60">{atual.ajuda}</p>
        ) : null}

        <div className="mt-6">
          {atual.tipo === "input" ? (
            <input
              type={atual.inputTipo}
              inputMode={atual.chave === "whatsapp" ? "tel" : undefined}
              autoFocus
              value={r[atual.chave as Chave]}
              onChange={(e) => setResposta(atual.chave as Chave, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  avancar();
                }
              }}
              placeholder={atual.placeholder}
              className="w-full rounded-2xl border border-dourado/25 bg-creme/[0.04] px-5 py-4 font-sans text-base text-creme outline-none transition placeholder:text-creme/35 focus:border-dourado"
            />
          ) : null}

          {atual.tipo === "textarea" ? (
            <textarea
              autoFocus
              rows={4}
              value={r[atual.chave as Chave]}
              onChange={(e) => setResposta(atual.chave as Chave, e.target.value)}
              placeholder={atual.placeholder}
              className="w-full resize-none rounded-2xl border border-dourado/25 bg-creme/[0.04] px-5 py-4 font-sans text-base text-creme outline-none transition placeholder:text-creme/35 focus:border-dourado"
            />
          ) : null}

          {atual.tipo === "escolha" ? (
            <div className="grid gap-3">
              {atual.opcoes.map((opcao) => {
                const marcada = r[atual.chave as Chave] === opcao;
                return (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => escolher(opcao)}
                    className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left font-sans text-base transition ${
                      marcada
                        ? "border-dourado bg-dourado/15 text-creme"
                        : "border-dourado/20 bg-creme/[0.03] text-creme/85 hover:border-dourado/50"
                    }`}
                  >
                    {opcao}
                    <span
                      className={`ml-3 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        marcada ? "border-dourado bg-dourado" : "border-dourado/40"
                      }`}
                    >
                      {marcada ? (
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f4ecde" strokeWidth="3.5" aria-hidden>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {atual.tipo === "consentimento" ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-dourado/20 bg-creme/[0.03] px-5 py-4">
              <input
                type="checkbox"
                checked={consentimento}
                onChange={(e) => setConsentimento(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#4a3626]"
              />
              <span className="font-sans text-sm leading-relaxed text-creme/80">
                Autorizo o contato e o uso dos meus dados para o atendimento,
                conforme a{" "}
                <Link href="/privacidade" className="text-dourado underline">
                  política de privacidade
                </Link>
                .
              </span>
            </label>
          ) : null}
        </div>
      </div>

      {erro ? (
        <p className="mt-4 rounded-xl border border-argila/40 bg-argila/10 px-4 py-3 font-sans text-sm text-argila">
          {erro}
        </p>
      ) : null}

      {/* Navegação */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={voltar}
          disabled={passo === 0}
          className="font-sans text-sm text-creme/60 transition hover:text-creme disabled:invisible"
        >
          Voltar
        </button>

        {atual.tipo === "consentimento" ? (
          <button type="button" onClick={enviar} disabled={!valido() || enviando} className={SOLIDO}>
            {enviando ? "Enviando..." : "Enviar e ver o WhatsApp"}
          </button>
        ) : atual.tipo === "escolha" ? (
          <span className="font-sans text-xs text-creme/40">Toque para escolher</span>
        ) : (
          <button
            type="button"
            onClick={avancar}
            disabled={!valido()}
            className={SOLIDO}
          >
            {atual.tipo === "input" && atual.opcional && r[atual.chave as Chave].trim() === ""
              ? "Pular"
              : "Continuar"}
          </button>
        )}
      </div>

      {/* Escape sempre visível: quem não quiser responder fala direto. */}
      <div className="mt-10 border-t border-dourado/15 pt-6 text-center">
        <a
          href={linkWa(CONTEUDO.contato.whatsappConsultoria)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-sm text-dourado underline underline-offset-4 transition hover:text-creme"
        >
          Prefiro falar direto no WhatsApp
        </a>
      </div>
    </div>
  );
}

function Agradecimento({ respostas }: { respostas: RespostasSessao }) {
  return (
    <div className="w-full max-w-xl text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-dourado/15">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#a47864" strokeWidth="2.5" aria-hidden>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-3xl text-creme">Recebi as suas respostas!</h1>
      <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-creme/70">
        A Larissa já tem o seu contexto e vai falar com você em breve. Para
        adiantar, é só me chamar no WhatsApp com o resumo já preenchido.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4">
        <a
          href={linkWa(mensagemWhatsAppResumo(respostas))}
          target="_blank"
          rel="noopener noreferrer"
          className={SOLIDO}
        >
          Chamar a Larissa no WhatsApp
        </a>
        <Link href="/" className="font-sans text-sm text-creme/55 transition hover:text-creme">
          Voltar para o site
        </Link>
      </div>
    </div>
  );
}
