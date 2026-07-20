"use client";

import { useMemo, useState } from "react";
import { formatarData, formatarPeso, formatarVariacao } from "@/lib/formato";
import type { Checkin } from "@/lib/tipos";
import { DIMENSOES_DA_FICHA, notaDe } from "@/lib/dimensoes";
import { Cartao, Vazio } from "../../ui";

type Ponto = { rotulo: string; valor: number };

const L = 620;
const A = 190;
const M = { topo: 18, base: 30, esq: 16, dir: 16 };

/** Linha em SVG puro, com escala automática e piso de faixa. */
function Grafico({
  pontos,
  cor,
  sufixo = "",
  casas = 0,
}: {
  pontos: Ponto[];
  cor: string;
  sufixo?: string;
  casas?: number;
}) {
  if (pontos.length < 2) return null;

  const valores = pontos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Faixa mínima evita que uma variação minúscula vire um pico.
  const faixa = Math.max(max - min, casas > 0 ? 1 : 2);
  const topo = max + faixa * 0.18;
  const base = min - faixa * 0.18;

  const largura = L - M.esq - M.dir;
  const altura = A - M.topo - M.base;

  const x = (i: number) => M.esq + (i / (pontos.length - 1)) * largura;
  const y = (v: number) =>
    M.topo + altura - ((v - base) / (topo - base)) * altura;

  const linha = pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ");
  const area = `${M.esq},${M.topo + altura} ${linha} ${x(pontos.length - 1)},${M.topo + altura}`;

  return (
    <svg viewBox={`0 0 ${L} ${A}`} className="mt-5 w-full" role="img">
      <polygon points={area} fill={cor} fillOpacity="0.1" />
      <polyline
        points={linha}
        fill="none"
        stroke={cor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pontos.map((p, i) => (
        <g key={`${p.rotulo}-${i}`}>
          <circle
            cx={x(i)}
            cy={y(p.valor)}
            r="3.8"
            fill="#FFFDF8"
            stroke={cor}
            strokeWidth="2.2"
          />
        </g>
      ))}
      <text x={M.esq} y={A - 8} fill="#8A7B65" fontSize="11.5" fontFamily="monospace">
        {pontos[0].rotulo}
      </text>
      <text
        x={L - M.dir}
        y={A - 8}
        textAnchor="end"
        fill="#8A7B65"
        fontSize="11.5"
        fontFamily="monospace"
      >
        {pontos[pontos.length - 1].rotulo}
        {sufixo}
      </text>
    </svg>
  );
}

function Resumo({
  primeiro,
  ultimo,
  formatarValor,
  formatarDelta,
  invertido = false,
}: {
  primeiro: number;
  ultimo: number;
  formatarValor: (n: number) => string;
  formatarDelta: (n: number) => string;
  /** Para peso, cair é bom. Para notas, subir é bom. */
  invertido?: boolean;
}) {
  const delta = ultimo - primeiro;
  const neutro = Math.abs(delta) < 0.05;
  const bom = invertido ? delta < 0 : delta > 0;

  const cor = neutro
    ? "text-neutro"
    : bom
      ? "text-emerald-700"
      : "text-mel-tinta";

  return (
    <div className="flex flex-wrap gap-8">
      <div>
        <p className="olho">Primeiro</p>
        <p className="mt-1 font-sans text-[15px] text-tinta">
          {formatarValor(primeiro)}
        </p>
      </div>
      <div>
        <p className="olho">Atual</p>
        <p className="mt-1 font-sans text-[15px] text-tinta">
          {formatarValor(ultimo)}
        </p>
      </div>
      <div>
        <p className="olho">Variação</p>
        <p className={`mt-1 font-sans text-[15px] font-semibold ${cor}`}>
          {neutro ? "estável" : formatarDelta(delta)}
        </p>
      </div>
    </div>
  );
}

export function LinhaEvolucao({ checkins }: { checkins: Checkin[] }) {
  // A lista vem do mais recente, e o gráfico lê da esquerda para a
  // direita, então a ordem se inverte aqui.
  const cronologico = useMemo(() => [...checkins].reverse(), [checkins]);
  const [dimensao, setDimensao] = useState("semana_geral");

  const pesos = cronologico
    .filter((c) => c.peso_kg !== null)
    .map((c) => ({
      rotulo: c.semana ? `s${c.semana}` : formatarData(c.created_at),
      valor: c.peso_kg as number,
    }));

  const escolhida =
    DIMENSOES_DA_FICHA.find((d) => d.campo === dimensao) ??
    DIMENSOES_DA_FICHA[9];

  const notas = cronologico
    .filter((c) => notaDe(c, dimensao) !== null)
    .map((c) => ({
      rotulo: c.semana ? `s${c.semana}` : formatarData(c.created_at),
      valor: notaDe(c, dimensao) as number,
    }));

  if (checkins.length < 2) {
    return (
      <Vazio
        titulo="Ainda não dá para ver evolução"
        texto="A evolução compara semanas. Com pelo menos dois check-ins respondidos, os gráficos aparecem aqui."
      />
    );
  }

  return (
    <div className="grid gap-5">
      <Cartao className="px-6 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-[21px] text-barra">Peso</h2>
          <span className="font-mono text-[12px] text-neutro">
            {pesos.length} {pesos.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {pesos.length < 2 ? (
          <p className="mt-4 font-sans text-[14.5px] text-neutro">
            São necessários pelo menos dois check-ins com peso informado.
          </p>
        ) : (
          <>
            <div className="mt-5">
              <Resumo
                primeiro={pesos[0].valor}
                ultimo={pesos[pesos.length - 1].valor}
                formatarValor={(n) => formatarPeso(n) ?? ""}
                formatarDelta={formatarVariacao}
                invertido
              />
            </div>
            <Grafico pontos={pesos} cor="#A9723F" casas={1} />
          </>
        )}
      </Cartao>

      <Cartao className="px-6 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-[21px] text-barra">
            Evolução das notas
          </h2>

          <label className="flex items-center gap-2">
            <span className="sr-only">Escolher dimensão</span>
            <select
              value={dimensao}
              onChange={(e) => setDimensao(e.target.value)}
              className="rounded-[10px] border border-linha bg-white px-3 py-2 font-sans text-[14px] text-tinta outline-none focus:border-vital"
            >
              {DIMENSOES_DA_FICHA.map((d) => (
                <option key={d.campo} value={d.campo}>
                  {d.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>

        {notas.length < 2 ? (
          <p className="mt-4 font-sans text-[14.5px] text-neutro">
            São necessários pelo menos dois check-ins com esta dimensão
            respondida.
          </p>
        ) : (
          <>
            <div className="mt-5">
              <Resumo
                primeiro={notas[0].valor}
                ultimo={notas[notas.length - 1].valor}
                formatarValor={(n) => `${n} de 10`}
                formatarDelta={(n) => `${n > 0 ? "+" : "−"}${Math.abs(n)}`}
              />
            </div>
            <Grafico pontos={notas} cor={escolhida.cor} />
          </>
        )}
      </Cartao>
    </div>
  );
}
