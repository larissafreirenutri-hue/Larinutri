"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatarMoeda } from "@/lib/formato";
import {
  ETAPAS,
  ETAPAS_FINAIS,
  ETAPA_GANHO,
  type Etapa,
  type Lead,
} from "@/lib/vendas";
import { moverEtapa } from "./actions";

function CartaoLead({
  lead,
  arrastando,
  onArrastar,
  onMover,
  ocupado,
}: {
  lead: Lead;
  arrastando: boolean;
  onArrastar: (id: string | null) => void;
  onMover: (id: string, etapa: string) => void;
  ocupado: boolean;
}) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onArrastar(lead.id);
      }}
      onDragEnd={() => onArrastar(null)}
      className={`rounded-lg border bg-cartao px-3.5 py-3 transition ${
        arrastando
          ? "border-vital opacity-50"
          : "border-linha hover:border-linha"
      } ${ocupado ? "opacity-60" : ""}`}
    >
      <Link
        href={`/painel/vendas/${lead.id}`}
        className="block font-sans text-sm text-tinta transition hover:text-vital-fundo"
      >
        {lead.nome}
      </Link>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {lead.valor !== null ? (
          <span className="font-sans text-xs tabular-nums text-vital-fundo">
            {formatarMoeda(lead.valor)}
          </span>
        ) : null}
        {lead.origem ? (
          <span className="font-sans text-xs text-neutro">{lead.origem}</span>
        ) : null}
      </div>

      {lead.patient_id ? (
        <span className="mt-2 inline-block rounded bg-emerald-50 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-emerald-700">
          já é paciente
        </span>
      ) : null}

      {/* Alternativa ao arraste, indispensável no toque. O arraste
          nativo do HTML não funciona em tela sensível ao toque. */}
      <label className="mt-2.5 block">
        <span className="sr-only">Mover {lead.nome} para outra etapa</span>
        <select
          value={lead.etapa}
          disabled={ocupado}
          onChange={(e) => onMover(lead.id, e.target.value)}
          className="w-full rounded border border-linha bg-cartao px-2 py-1.5 font-sans text-xs text-neutro outline-none focus:border-vital"
        >
          {ETAPAS.map((etapa) => (
            <option key={etapa} value={etapa} className="bg-cartao">
              {etapa}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}

export function Quadro({ leads }: { leads: Lead[] }) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<Etapa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function mover(id: string, etapa: string) {
    setErro(null);
    iniciar(async () => {
      const r = await moverEtapa(id, etapa);
      if (r?.erro) setErro(r.erro);
    });
  }

  return (
    <>
      {erro ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {erro}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {ETAPAS.map((etapa) => {
          const doGrupo = leads.filter((l) => l.etapa === etapa);
          const final = ETAPAS_FINAIS.includes(etapa);
          const ganho = etapa === ETAPA_GANHO;

          return (
            <section
              key={etapa}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setAlvo(etapa);
              }}
              onDragLeave={() => setAlvo((a) => (a === etapa ? null : a))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setAlvo(null);
                setArrastando(null);
                if (id) mover(id, etapa);
              }}
              className={`rounded-xl border p-3 transition ${
                alvo === etapa
                  ? "border-vital bg-vital/10"
                  : final
                    ? "border-linha bg-areia-clara/40"
                    : "border-linha bg-cartao"
              }`}
            >
              <header className="flex items-baseline justify-between px-1 pb-3">
                <h3
                  className={`font-sans text-xs font-semibold uppercase tracking-wider ${
                    ganho
                      ? "text-emerald-700"
                      : final
                        ? "text-neutro"
                        : "text-vital-fundo"
                  }`}
                >
                  {etapa}
                </h3>
                <span className="font-sans text-xs tabular-nums text-neutro">
                  {doGrupo.length}
                </span>
              </header>

              {doGrupo.length === 0 ? (
                <p className="px-1 pb-2 font-sans text-xs text-neutro">
                  Vazio
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {doGrupo.map((lead) => (
                    <CartaoLead
                      key={lead.id}
                      lead={lead}
                      arrastando={arrastando === lead.id}
                      onArrastar={setArrastando}
                      onMover={mover}
                      ocupado={pendente}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
