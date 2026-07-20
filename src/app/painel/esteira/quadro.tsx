"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatarData } from "@/lib/formato";
import { corDaNota } from "@/lib/dimensoes";
import { Avatar } from "../marca";
import { Selo } from "../ui";
import { TRIAGENS, ROTULO_TRIAGEM } from "@/lib/esteira";
import { moverTriagem } from "./actions";

export type CartaoCheckin = {
  id: string;
  patient_id: string;
  nome: string;
  data: string;
  geral: number | null;
  alerta: boolean;
  triagem: string;
};

export type CartaoPendente = {
  id: string;
  patient_id: string;
  nome: string;
  data: string;
  status: string;
};

const COLUNAS = [
  { chave: "a_responder", rotulo: "A responder" },
  { chave: "respondido", rotulo: "Respondido" },
  { chave: "analisado", rotulo: "Analisado" },
] as const;

export function Quadro({
  pendentes,
  checkins,
}: {
  pendentes: CartaoPendente[];
  checkins: CartaoCheckin[];
}) {
  const router = useRouter();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function mover(id: string, destino: string) {
    setErro(null);
    iniciar(async () => {
      const r = await moverTriagem(id, destino);
      if (r?.erro) setErro(r.erro);
    });
  }

  const contagem = (chave: string) =>
    chave === "a_responder"
      ? pendentes.length
      : checkins.filter((c) => c.triagem === chave).length;

  return (
    <>
      {erro ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {erro}
        </p>
      ) : null}

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {COLUNAS.map((coluna) => {
          const recebeArraste = coluna.chave !== "a_responder";

          return (
            <section
              key={coluna.chave}
              onDragOver={
                recebeArraste
                  ? (e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setAlvo(coluna.chave);
                    }
                  : undefined
              }
              onDragLeave={() =>
                setAlvo((a) => (a === coluna.chave ? null : a))
              }
              onDrop={
                recebeArraste
                  ? (e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain");
                      setAlvo(null);
                      setArrastando(null);
                      if (id) mover(id, coluna.chave);
                    }
                  : undefined
              }
              className={`rounded-[18px] border p-4 transition ${
                alvo === coluna.chave
                  ? "border-vital bg-vital/10"
                  : "border-linha bg-areia-clara/45"
              }`}
            >
              <header className="flex items-center justify-between px-1 pb-4">
                <h2 className="font-display text-[19px] text-barra">
                  {coluna.rotulo}
                </h2>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-cartao px-2 font-mono text-[12px] text-neutro">
                  {contagem(coluna.chave)}
                </span>
              </header>

              {coluna.chave === "a_responder" ? (
                <>
                  <p className="mb-3 rounded-lg bg-cartao/70 px-3 py-2 font-sans text-[12.5px] leading-snug text-neutro">
                    Sai daqui quando o paciente responder. Não dá para
                    arrastar.
                  </p>
                  {pendentes.length === 0 ? (
                    <p className="px-1 pb-2 font-sans text-[13.5px] text-tenue">
                      Ninguém pendente. Todos responderam.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                    {pendentes.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-[14px] border border-linha bg-cartao px-4 py-3.5 shadow-cartao"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/painel/pacientes/${p.patient_id}`)
                          }
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <Avatar nome={p.nome} tamanho="sm" />
                          <span className="font-sans text-[15px] font-semibold text-tinta">
                            {p.nome}
                          </span>
                        </button>

                        <p className="mt-2.5 flex items-center gap-2.5">
                          <span className="font-mono text-[12.5px] text-neutro">
                            {formatarData(p.data)}
                          </span>
                          <Selo tom={p.status === "enviado" ? "mel" : "neutro"}>
                            não respondido
                          </Selo>
                          {p.status === "gerado" ? (
                            <span className="font-sans text-[12px] text-tenue">
                              ainda não enviado
                            </span>
                          ) : null}
                        </p>
                      </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <ListaCheckins
                  cartoes={checkins.filter((c) => c.triagem === coluna.chave)}
                  arrastando={arrastando}
                  onArrastar={setArrastando}
                  onMover={mover}
                  ocupado={ocupado}
                  aoAbrir={(id) => router.push(`/painel/pacientes/${id}`)}
                />
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-5 font-mono text-[12.5px] text-neutro">
        Dica: no computador, arraste os cartões entre Respondido e Analisado.
        No celular, use o seletor dentro do cartão.
      </p>
    </>
  );
}

function ListaCheckins({
  cartoes,
  arrastando,
  onArrastar,
  onMover,
  ocupado,
  aoAbrir,
}: {
  cartoes: CartaoCheckin[];
  arrastando: string | null;
  onArrastar: (id: string | null) => void;
  onMover: (id: string, destino: string) => void;
  ocupado: boolean;
  aoAbrir: (patientId: string) => void;
}) {
  if (cartoes.length === 0) {
    return (
      <p className="px-1 pb-2 font-sans text-[13.5px] text-tenue">Vazio</p>
    );
  }

  return (
    <ul className="space-y-3">
      {cartoes.map((c) => (
        <li
          key={c.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", c.id);
            e.dataTransfer.effectAllowed = "move";
            onArrastar(c.id);
          }}
          onDragEnd={() => onArrastar(null)}
          className={`rounded-[14px] border bg-cartao px-4 py-3.5 shadow-cartao transition ${
            arrastando === c.id
              ? "border-vital opacity-50"
              : c.alerta
                ? "border-argila/45"
                : "border-linha"
          } ${ocupado ? "opacity-60" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => aoAbrir(c.patient_id)}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <Avatar nome={c.nome} tamanho="sm" />
              <span className="truncate font-sans text-[15px] font-semibold text-tinta">
                {c.nome}
              </span>
            </button>

            {c.alerta ? <Selo tom="argila">alerta</Selo> : null}
          </div>

          <p className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[12.5px] text-neutro">
              {formatarData(c.data)}
            </span>
            {c.geral !== null ? (
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[12.5px] font-bold text-white"
                style={{ backgroundColor: corDaNota(c.geral, "#4A3220") }}
              >
                geral {c.geral}
              </span>
            ) : (
              <span className="rounded-md bg-areia px-2 py-0.5 font-mono text-[12.5px] text-neutro">
                sem nota
              </span>
            )}
          </p>

          {/* Alternativa ao arraste. O arraste nativo não funciona em
              tela de toque, e a esteira precisa servir no celular. */}
          <label className="mt-3 block">
            <span className="sr-only">Mover {c.nome} de coluna</span>
            <select
              value={c.triagem}
              disabled={ocupado}
              onChange={(e) => onMover(c.id, e.target.value)}
              className="w-full rounded-[10px] border border-linha bg-white px-2.5 py-1.5 font-sans text-[13px] text-neutro outline-none focus:border-vital"
            >
              {TRIAGENS.map((t) => (
                <option key={t} value={t}>
                  {ROTULO_TRIAGEM[t]}
                </option>
              ))}
            </select>
          </label>
        </li>
      ))}
    </ul>
  );
}
