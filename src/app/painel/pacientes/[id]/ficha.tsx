"use client";

import { useMemo, useState } from "react";
import { formatarData, formatarPeso } from "@/lib/formato";
import type { Checkin, Paciente } from "@/lib/tipos";
import {
  DIMENSOES_DA_FICHA,
  corDaNota,
  notaDe,
  notasPreenchidas,
} from "@/lib/dimensoes";
import { Cartao, Medidor, Selo, AlertaClinico, Vazio } from "../../ui";
import { LinhaEvolucao } from "./evolucao";
import { Galeria } from "./galeria";

type Aba = "visao" | "checkins" | "evolucao";

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: "visao", rotulo: "Visão geral" },
  { chave: "checkins", rotulo: "Check-ins" },
  { chave: "evolucao", rotulo: "Evolução" },
];

function Citacao({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl bg-areia-clara px-4 py-3.5 font-sans text-[14.5px] italic leading-relaxed text-tinta">
      “{texto}”
    </p>
  );
}

/** Refeição livre, no mesmo tom leve do formulário do paciente. */
function RefeicaoLivre({ checkin }: { checkin: Checkin }) {
  // Nulo quer dizer que a pergunta não existia ou não foi respondida.
  // Nesse caso não mostra nada, em vez de afirmar que não teve.
  if (checkin.refeicao_livre === null || checkin.refeicao_livre === undefined) {
    return null;
  }

  if (!checkin.refeicao_livre) {
    return (
      <p className="rounded-xl bg-areia-clara px-4 py-3 font-sans text-[14px] text-neutro">
        Sem refeição livre nesta semana.
      </p>
    );
  }

  const qtd = checkin.refeicao_livre_qtd;

  return (
    <div className="rounded-xl bg-areia-clara px-4 py-3">
      <p className="font-sans text-[14px] font-semibold text-tinta">
        Refeição livre
        {qtd !== null && qtd !== undefined
          ? `: ${qtd} ${qtd === 1 ? "vez" : "vezes"}`
          : ""}
      </p>
      {checkin.refeicao_livre_oque ? (
        <p className="mt-1 font-sans text-[14px] leading-relaxed text-neutro">
          {checkin.refeicao_livre_oque}
        </p>
      ) : null}
    </div>
  );
}

function DadoPaciente({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-linha py-3.5 last:border-0">
      <dt className="olho shrink-0">{rotulo}</dt>
      <dd className="text-right font-sans text-[15px] text-tinta">
        {valor ?? <span className="text-tenue">não informado</span>}
      </dd>
    </div>
  );
}

export function Ficha({
  paciente,
  checkins,
  urlsPorCheckin,
  botaoEditarDados,
}: {
  paciente: Paciente;
  /** Do mais recente para o mais antigo. */
  checkins: Checkin[];
  /** URLs assinadas das fotos, por id de check-in. */
  urlsPorCheckin: Record<string, string[]>;
  botaoEditarDados: React.ReactNode;
}) {
  const [aba, setAba] = useState<Aba>("visao");
  const [aberto, setAberto] = useState<string | null>(null);

  const ultimo = checkins[0] ?? null;

  const pesoAtual = useMemo(
    () => checkins.find((c) => c.peso_kg !== null)?.peso_kg ?? null,
    [checkins],
  );

  return (
    <>
      <nav className="mt-8 flex gap-1 border-b border-linha">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            type="button"
            onClick={() => setAba(a.chave)}
            aria-current={aba === a.chave ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-3 font-sans text-[15px] transition ${
              aba === a.chave
                ? "border-vital font-semibold text-barra"
                : "border-transparent text-neutro hover:text-tinta"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </nav>

      {aba === "visao" ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">
                {ultimo
                  ? `Último check-in · ${formatarData(ultimo.created_at)}`
                  : "Último check-in"}
              </h2>
            </header>

            <div className="px-6 py-5">
              {!ultimo ? (
                <p className="py-6 text-center font-sans text-[14.5px] text-neutro">
                  Nenhum check-in recebido ainda.
                </p>
              ) : notasPreenchidas(ultimo) === 0 ? (
                <p className="py-6 text-center font-sans text-[14.5px] text-neutro">
                  Este check-in veio pelo formulário antigo, sem as dez notas.
                  Gere um novo link para receber o modelo completo.
                </p>
              ) : (
                <>
                  {DIMENSOES_DA_FICHA.map((d) => (
                    <Medidor
                      key={d.campo}
                      rotulo={d.rotulo}
                      nota={notaDe(ultimo, d.campo)}
                      cor={d.cor}
                    />
                  ))}

                  <div className="mt-5 space-y-4">
                    <Galeria urls={urlsPorCheckin[ultimo.id] ?? []} />
                    <RefeicaoLivre checkin={ultimo} />
                    {ultimo.observacoes ? (
                      <Citacao texto={ultimo.observacoes} />
                    ) : null}
                  </div>

                  {ultimo.alerta_clinico ? (
                    <div className="mt-4">
                      <AlertaClinico texto={ultimo.alerta_clinico} />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </Cartao>

          <Cartao className="h-fit">
            <header className="flex items-center justify-between gap-3 border-b border-linha px-6 py-4">
              <h2 className="font-display text-[21px] text-barra">
                Dados do paciente
              </h2>
              {botaoEditarDados}
            </header>

            <dl className="px-6 py-2">
              <DadoPaciente
                rotulo="Peso inicial"
                valor={formatarPeso(paciente.peso_inicial ?? null)}
              />
              <DadoPaciente
                rotulo="Altura"
                valor={
                  paciente.altura
                    ? `${paciente.altura.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} m`
                    : null
                }
              />
              <DadoPaciente
                rotulo="Peso atual"
                valor={formatarPeso(pesoAtual)}
              />
              <DadoPaciente
                rotulo="Sono habitual"
                valor={paciente.sono_habitual ?? null}
              />
              <DadoPaciente
                rotulo="Treino planejado"
                valor={paciente.treino_planejado ?? null}
              />
              <DadoPaciente
                rotulo="Meta de água"
                valor={paciente.meta_agua ?? null}
              />
              <DadoPaciente
                rotulo="Restrições"
                valor={paciente.restricao ?? null}
              />
            </dl>
          </Cartao>
        </div>
      ) : null}

      {aba === "checkins" ? (
        <div className="mt-6">
          {checkins.length === 0 ? (
            <Vazio
              titulo="Nenhum check-in recebido ainda"
              texto={`Gere um link de check-in e envie para ${paciente.full_name.split(" ")[0]}. As respostas aparecem aqui.`}
            />
          ) : (
            <ul className="space-y-3">
              {checkins.map((c) => {
                const geral = notaDe(c, "semana_geral");
                const expandido = aberto === c.id;

                return (
                  <li key={c.id}>
                    <Cartao
                      className={
                        c.alerta_clinico ? "border-argila/40" : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setAberto(expandido ? null : c.id)}
                        aria-expanded={expandido}
                        className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-left"
                      >
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2.5 font-sans text-[15px] font-semibold text-tinta">
                            {c.semana ? `Semana ${c.semana}` : "Check-in"}
                            <span className="font-mono text-[12px] font-normal text-neutro">
                              {formatarData(c.created_at)}
                            </span>
                            {c.alerta_clinico ? (
                              <Selo tom="argila">alerta</Selo>
                            ) : null}
                          </p>
                          <p className="mt-1 font-sans text-[13px] text-neutro">
                            {[
                              formatarPeso(c.peso_kg),
                              `${notasPreenchidas(c)} de 10 respondidas`,
                            ]
                              .filter(Boolean)
                              .join("  ·  ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {geral !== null ? (
                            <span
                              className="font-mono text-[22px] font-bold tabular-nums"
                              style={{ color: corDaNota(geral, "#4A3220") }}
                            >
                              {geral}
                            </span>
                          ) : null}
                          <span className="font-sans text-[13px] text-vital-fundo">
                            {expandido ? "fechar" : "abrir"}
                          </span>
                        </div>
                      </button>

                      {expandido ? (
                        <div className="border-t border-linha px-6 py-5">
                          {notasPreenchidas(c) === 0 ? (
                            <p className="font-sans text-[14px] text-neutro">
                              Check-in do formulário antigo, sem as dez notas.
                            </p>
                          ) : (
                            DIMENSOES_DA_FICHA.map((d) => (
                              <Medidor
                                key={d.campo}
                                rotulo={d.rotulo}
                                nota={notaDe(c, d.campo)}
                                cor={d.cor}
                              />
                            ))
                          )}

                          <div className="mt-5 space-y-4">
                            <Galeria urls={urlsPorCheckin[c.id] ?? []} />
                            <RefeicaoLivre checkin={c} />
                            {c.observacoes ? <Citacao texto={c.observacoes} /> : null}
                          </div>

                          {c.alerta_clinico ? (
                            <div className="mt-4">
                              <AlertaClinico texto={c.alerta_clinico} />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </Cartao>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {aba === "evolucao" ? (
        <div className="mt-6">
          <LinhaEvolucao checkins={checkins} />
        </div>
      ) : null}
    </>
  );
}
