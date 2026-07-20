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
      className={`rounded-lg border bg-creme/5 px-3.5 py-3 transition ${
        arrastando
          ? "border-dourado opacity-50"
          : "border-dourado/20 hover:border-dourado/45"
      } ${ocupado ? "opacity-60" : ""}`}
    >
      <Link
        href={`/painel/vendas/${lead.id}`}
        className="block font-sans text-sm text-creme transition hover:text-dourado"
      >
        {lead.nome}
      </Link>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {lead.valor !== null ? (
          <span className="font-sans text-xs tabular-nums text-dourado">
            {formatarMoeda(lead.valor)}
          </span>
        ) : null}
        {lead.origem ? (
          <span className="font-sans text-xs text-creme/40">{lead.origem}</span>
        ) : null}
      </div>

      {lead.patient_id ? (
        <span className="mt-2 inline-block rounded bg-emerald-400/15 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-emerald-200">
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
          className="w-full rounded border border-dourado/25 bg-marrom px-2 py-1.5 font-sans text-xs text-creme/70 outline-none focus:border-dourado"
        >
          {ETAPAS.map((etapa) => (
            <option key={etapa} value={etapa} className="bg-marrom">
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
          className="mt-6 rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
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
                  ? "border-dourado bg-dourado/10"
                  : final
                    ? "border-dourado/15 bg-creme/[0.02]"
                    : "border-dourado/20 bg-creme/5"
              }`}
            >
              <header className="flex items-baseline justify-between px-1 pb-3">
                <h3
                  className={`font-sans text-xs font-semibold uppercase tracking-wider ${
                    ganho
                      ? "text-emerald-200"
                      : final
                        ? "text-creme/35"
                        : "text-dourado"
                  }`}
                >
                  {etapa}
                </h3>
                <span className="font-sans text-xs tabular-nums text-creme/40">
                  {doGrupo.length}
                </span>
              </header>

              {doGrupo.length === 0 ? (
                <p className="px-1 pb-2 font-sans text-xs text-creme/25">
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
