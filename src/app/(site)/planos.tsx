"use client";

import { useState } from "react";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { Reveal } from "./reveal";

const numero = CONTEUDO.contato.whatsapp;

function linkWhatsApp(nome: string, meses: number) {
  if (ehPendente(numero)) return null;
  const msg = `Olá, Larissa! Tenho interesse no plano ${nome} (${meses} meses). Pode me passar mais detalhes?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

function reais(n: number) {
  return n.toLocaleString("pt-BR");
}

export function Planos() {
  // Padrão em 6 meses, que é o melhor valor por mês, como no arquivo.
  const [meses, setMeses] = useState<3 | 6>(6);

  return (
    <section id="planos" className="border-t border-dourado/10 bg-marrom">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-dourado">
            Planos de consultoria
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl text-creme sm:text-4xl">
            Escolha o seu acompanhamento.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed text-creme/70">
            Online, no consultório ou na sua casa. O plano de 6 meses tem o
            melhor valor por mês.
          </p>

          {/* Seletor de duração, atualiza os três cards de uma vez. */}
          <div className="mt-8 inline-flex rounded-full border border-dourado/25 bg-marrom-alta p-1">
            {[6, 3].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMeses(m as 3 | 6)}
                aria-pressed={meses === m}
                className={`rounded-full px-5 py-2 font-sans text-sm transition ${
                  meses === m ? "bg-dourado font-semibold text-marrom" : "text-creme/70 hover:text-creme"
                }`}
              >
                {m} meses
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {CONTEUDO.planos.map((plano, i) => {
            const preco = meses === 3 ? plano.d3 : plano.d6;
            const itens = [
              ...plano.base,
              ...(preco.retorno ? [preco.retorno] : []),
            ];
            const economia = plano.d3.mensal - plano.d6.mensal;
            const link = linkWhatsApp(plano.nome, meses);

            return (
              <Reveal key={plano.nome} delay={i * 100}>
                <div
                  className={`flex h-full flex-col rounded-3xl border px-7 py-8 ${
                    plano.destaque
                      ? "border-dourado/50 bg-marrom-alta shadow-2xl"
                      : "border-dourado/15 bg-creme/[0.03]"
                  }`}
                >
                  {plano.destaque ? (
                    <span className="mb-4 inline-block self-start rounded-full bg-dourado px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-marrom">
                      Mais exclusivo
                    </span>
                  ) : null}

                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dourado">
                    {plano.modalidade}
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-creme">
                    {plano.nome}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-creme/65">
                    {plano.descricao}
                  </p>

                  <div className="mt-6 border-y border-dourado/15 py-5">
                    <p className="font-display text-4xl text-creme">
                      R$ {reais(preco.mensal)}
                      <span className="font-sans text-base text-creme/55"> /mês</span>
                    </p>
                    <p className="mt-1 font-sans text-[13px] text-creme/55">
                      {preco.parcela}
                    </p>
                    {meses === 6 ? (
                      <p className="mt-2 font-sans text-[12px] text-dourado">
                        Economize R$ {reais(economia)} por mês no plano de 6 meses.
                      </p>
                    ) : (
                      <p className="mt-2 font-sans text-[12px] text-creme/45">
                        No plano de 6 meses sai por R$ {reais(plano.d6.mensal)} por mês.
                      </p>
                    )}
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {itens.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 font-sans text-sm text-creme/80">
                        <span className="mt-0.5 shrink-0 text-dourado">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-8 inline-block rounded-md px-6 py-3.5 text-center font-sans text-sm font-semibold transition ${
                        plano.destaque
                          ? "bg-dourado text-marrom hover:bg-dourado/90"
                          : "border border-dourado/40 text-dourado hover:bg-dourado/10"
                      }`}
                    >
                      Quero o {plano.nome}
                    </a>
                  ) : (
                    <p className="mt-8 rounded-md border border-dashed border-dourado/40 px-4 py-3 text-center font-sans text-xs text-dourado">
                      WhatsApp a configurar
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
