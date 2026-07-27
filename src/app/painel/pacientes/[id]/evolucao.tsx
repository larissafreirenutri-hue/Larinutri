"use client";

import { useMemo, useState } from "react";
import { formatarData, formatarPeso, formatarVariacao } from "@/lib/formato";
import type { Checkin } from "@/lib/tipos";
import { DIMENSOES_DA_FICHA, notaDe } from "@/lib/dimensoes";
import { Cartao, Vazio } from "../../ui";

type Ponto = {
  data: string; // created_at ISO, para a data no tooltip
  rotulo: string; // rótulo curto do eixo, sX ou data
  valor: number;
  alerta: boolean;
  obs: boolean;
};

const L = 620;
const A = 190;
const M = { topo: 16, base: 28, esq: 14, dir: 14 };

/**
 * Linha em SVG puro com tooltip próprio. Não há biblioteca de gráficos
 * no sistema, então o tooltip é feito à mão: um overlay capta o mouse
 * ou o toque, acha o ponto mais próximo na horizontal, e um balão HTML
 * posicionado em porcentagem acompanha, o que mantém tudo responsivo.
 */
function GraficoLinha({
  pontos,
  cor,
  formatarTip,
  escalaFixa,
}: {
  pontos: Ponto[];
  cor: string;
  formatarTip: (v: number) => string;
  // Para as dimensões, o eixo vai de 0 a 10 sempre. Para o peso, escala
  // automática com uma folga.
  escalaFixa?: { min: number; max: number };
}) {
  const [ativo, setAtivo] = useState<number | null>(null);

  const { topo, base } = useMemo(() => {
    if (escalaFixa) return { topo: escalaFixa.max, base: escalaFixa.min };
    const valores = pontos.map((p) => p.valor);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const faixa = Math.max(max - min, 1);
    return { topo: max + faixa * 0.18, base: min - faixa * 0.18 };
  }, [pontos, escalaFixa]);

  const largura = L - M.esq - M.dir;
  const altura = A - M.topo - M.base;

  const x = (i: number) =>
    pontos.length === 1
      ? M.esq + largura / 2
      : M.esq + (i / (pontos.length - 1)) * largura;
  const y = (v: number) =>
    M.topo + altura - ((v - base) / (topo - base)) * altura;

  const linha = pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ");
  const area = `${M.esq},${M.topo + altura} ${linha} ${x(pontos.length - 1)},${M.topo + altura}`;

  // Do evento para o índice do ponto mais próximo na horizontal.
  function aoMover(clientX: number, alvo: HTMLElement) {
    const rect = alvo.getBoundingClientRect();
    const fx = (clientX - rect.left) / rect.width;
    let melhor = 0;
    let dist = Infinity;
    for (let i = 0; i < pontos.length; i++) {
      const d = Math.abs(fx - x(i) / L);
      if (d < dist) {
        dist = d;
        melhor = i;
      }
    }
    setAtivo(melhor);
  }

  const p = ativo !== null ? pontos[ativo] : null;
  const px = ativo !== null ? (x(ativo) / L) * 100 : 0;
  const py = p ? (y(p.valor) / A) * 100 : 0;

  return (
    <div
      className="relative mt-4 select-none"
      onMouseMove={(e) => aoMover(e.clientX, e.currentTarget)}
      onMouseLeave={() => setAtivo(null)}
      onTouchStart={(e) => aoMover(e.touches[0].clientX, e.currentTarget)}
      onTouchMove={(e) => {
        e.preventDefault();
        aoMover(e.touches[0].clientX, e.currentTarget);
      }}
      onTouchEnd={() => setAtivo(null)}
    >
      <svg viewBox={`0 0 ${L} ${A}`} className="w-full" role="img">
        <polygon points={area} fill={cor} fillOpacity="0.1" />
        <polyline
          points={linha}
          fill="none"
          stroke={cor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Linha guia vertical no ponto ativo. */}
        {p ? (
          <line
            x1={x(ativo as number)}
            x2={x(ativo as number)}
            y1={M.topo}
            y2={M.topo + altura}
            stroke={cor}
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}

        {pontos.map((pt, i) => {
          const destaque = i === ativo;
          return (
            <circle
              key={`${pt.rotulo}-${i}`}
              cx={x(i)}
              cy={y(pt.valor)}
              r={destaque ? 5.5 : pt.alerta ? 4.2 : 3.6}
              fill={pt.alerta ? "#BC5443" : "#FFFDF8"}
              stroke={pt.alerta ? "#BC5443" : cor}
              strokeWidth="2.2"
            />
          );
        })}

        <text x={M.esq} y={A - 7} fill="#8A7B65" fontSize="11" fontFamily="monospace">
          {pontos[0].rotulo}
        </text>
        <text x={L - M.dir} y={A - 7} textAnchor="end" fill="#8A7B65" fontSize="11" fontFamily="monospace">
          {pontos[pontos.length - 1].rotulo}
        </text>
      </svg>

      {/* Tooltip. Posicionado em porcentagem, então acompanha o SVG
          responsivo. translate mantém o balão acima e centrado no ponto. */}
      {p ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-linha bg-cartao px-3 py-2 shadow-cartao"
          style={{
            left: `${Math.min(88, Math.max(12, px))}%`,
            top: `calc(${py}% - 10px)`,
          }}
        >
          <p className="whitespace-nowrap font-mono text-[11px] text-neutro">
            {formatarData(p.data)}
          </p>
          <p className="whitespace-nowrap font-sans text-[14px] font-semibold text-tinta">
            {formatarTip(p.valor)}
          </p>
          {p.alerta ? (
            <p className="mt-0.5 font-sans text-[11px] text-argila">
              alerta clínico
            </p>
          ) : p.obs ? (
            <p className="mt-0.5 font-sans text-[11px] text-neutro">
              com observação
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SetaVariacao({
  primeiro,
  ultimo,
  invertido = false,
}: {
  primeiro: number;
  ultimo: number;
  invertido?: boolean;
}) {
  const delta = ultimo - primeiro;
  const neutro = Math.abs(delta) < 0.05;
  const bom = invertido ? delta < 0 : delta > 0;
  const cor = neutro ? "text-neutro" : bom ? "text-emerald-700" : "text-mel-tinta";
  const seta = neutro ? "→" : delta > 0 ? "↑" : "↓";

  return (
    <span className={`font-sans text-[13px] font-semibold ${cor}`}>
      {seta}{" "}
      {neutro
        ? "estável"
        : Number.isInteger(delta)
          ? `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`
          : formatarVariacao(delta)}
    </span>
  );
}

/** Um card do painel: título, valor recente e o gráfico, ou o aviso. */
function CardGrafico({
  titulo,
  pontos,
  cor,
  formatarValor,
  formatarTip,
  escalaFixa,
  invertido,
  grande = false,
}: {
  titulo: string;
  pontos: Ponto[];
  cor: string;
  formatarValor: (v: number) => string;
  formatarTip: (v: number) => string;
  escalaFixa?: { min: number; max: number };
  invertido?: boolean;
  grande?: boolean;
}) {
  const recente = pontos.length ? pontos[pontos.length - 1].valor : null;

  return (
    <Cartao className={grande ? "px-6 py-6" : "px-5 py-5"}>
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={`font-display text-barra ${grande ? "text-[21px]" : "text-[16px]"}`}
        >
          {titulo}
        </h3>
        {recente !== null ? (
          <span
            className="font-mono font-bold tabular-nums"
            style={{ color: cor, fontSize: grande ? 22 : 17 }}
          >
            {formatarValor(recente)}
          </span>
        ) : null}
      </div>

      {pontos.length < 2 ? (
        <p className="mt-4 font-sans text-[13.5px] text-neutro">
          {pontos.length === 0
            ? "Sem registros desta métrica no período."
            : "Só um registro no período, ainda não dá para traçar a linha."}
        </p>
      ) : (
        <>
          {grande ? (
            <div className="mt-3">
              <SetaVariacao
                primeiro={pontos[0].valor}
                ultimo={pontos[pontos.length - 1].valor}
                invertido={invertido}
              />
              <span className="ml-2 font-mono text-[12px] text-neutro">
                desde {formatarValor(pontos[0].valor)}
              </span>
            </div>
          ) : (
            <div className="mt-1">
              <SetaVariacao
                primeiro={pontos[0].valor}
                ultimo={pontos[pontos.length - 1].valor}
                invertido={invertido}
              />
            </div>
          )}
          <GraficoLinha
            pontos={pontos}
            cor={cor}
            formatarTip={formatarTip}
            escalaFixa={escalaFixa}
          />
        </>
      )}
    </Cartao>
  );
}

const PERIODOS = [
  { chave: 6, rotulo: "6 semanas" },
  { chave: 12, rotulo: "12 semanas" },
  { chave: 0, rotulo: "Tudo" },
] as const;

export function LinhaEvolucao({ checkins }: { checkins: Checkin[] }) {
  const [periodo, setPeriodo] = useState<number>(12);

  // A lista vem do mais recente. O gráfico lê da esquerda para a
  // direita, então inverte. O período pega os últimos N check-ins, o
  // que casa com "últimas N semanas" quando os check-ins são semanais.
  const cronologico = useMemo(() => {
    const ordenado = [...checkins].reverse();
    return periodo > 0 ? ordenado.slice(-periodo) : ordenado;
  }, [checkins, periodo]);

  const rotuloDe = (c: Checkin) =>
    c.semana ? `s${c.semana}` : formatarData(c.created_at).slice(0, 5);

  const pesos: Ponto[] = cronologico
    .filter((c) => c.peso_kg !== null)
    .map((c) => ({
      data: c.created_at,
      rotulo: rotuloDe(c),
      valor: c.peso_kg as number,
      alerta: Boolean(c.alerta_clinico),
      obs: Boolean(c.observacoes),
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-[14px] text-neutro">
          Todos os indicadores ao longo do tempo. Passe o mouse ou toque num
          ponto para ver a data e o valor.
        </p>
        <div className="flex rounded-lg border border-linha bg-cartao p-0.5">
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              type="button"
              onClick={() => setPeriodo(p.chave)}
              className={`rounded-md px-3 py-1.5 font-sans text-[13px] transition ${
                periodo === p.chave
                  ? "bg-vital text-white"
                  : "text-tinta hover:bg-areia-clara"
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Peso em destaque, largura total. */}
      <div className="mt-5">
        <CardGrafico
          titulo="Peso"
          pontos={pesos}
          cor="#A9723F"
          grande
          invertido
          escalaFixa={undefined}
          formatarValor={(n) => formatarPeso(n) ?? ""}
          formatarTip={(n) => formatarPeso(n) ?? ""}
        />
      </div>

      {/* As dez dimensões, em grade. */}
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {DIMENSOES_DA_FICHA.map((d) => {
          const pontos: Ponto[] = cronologico
            .filter((c) => notaDe(c, d.campo) !== null)
            .map((c) => ({
              data: c.created_at,
              rotulo: rotuloDe(c),
              valor: notaDe(c, d.campo) as number,
              alerta: Boolean(c.alerta_clinico),
              obs: Boolean(c.observacoes),
            }));

          return (
            <CardGrafico
              key={d.campo}
              titulo={d.rotulo}
              pontos={pontos}
              cor={d.cor}
              escalaFixa={{ min: 0, max: 10 }}
              formatarValor={(n) => `${n}`}
              formatarTip={(n) => `Índice: ${n}`}
            />
          );
        })}
      </div>
    </div>
  );
}
