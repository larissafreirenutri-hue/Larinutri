"use client";

import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarData, formatarDataExtenso } from "@/lib/formato";
import type { Rotina, Tarefa } from "@/lib/trabalho";
import {
  COR_CAMADA,
  COR_PRIORIDADE,
  diaISO,
  montarEventos,
  ordenarDoDia,
  type Camada,
  type Evento,
  type Visao,
} from "@/lib/agenda";
import { ItemTarefa, type TarefaLocal } from "./item-tarefa";
import { adicionarRapida, adiarTarefa } from "./actions";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const SEG = { weekStartsOn: 1 as const };

// String YYYY-MM-DD para Date ao meio-dia, para os cálculos de date-fns
// não escorregarem de dia por causa de fuso.
const dia = (s: string) => parseISO(`${s}T12:00:00`);

const VISOES: { chave: Visao; rotulo: string }[] = [
  { chave: "mes", rotulo: "Mês" },
  { chave: "semana", rotulo: "Semana" },
  { chave: "dia", rotulo: "Dia" },
  { chave: "agenda", rotulo: "Agenda" },
];

const CAMADAS: { chave: Camada; rotulo: string }[] = [
  { chave: "tarefa", rotulo: "Tarefas" },
  { chave: "rotina", rotulo: "Rotinas" },
  { chave: "plano", rotulo: "Planos" },
];

export function Agenda({
  tarefas: tarefasProp,
  rotinas,
  planos,
  pacientes,
  hoje,
  agora,
}: {
  tarefas: Tarefa[];
  rotinas: Rotina[];
  planos: { id: string; full_name: string; plano_vence: string }[];
  pacientes: { id: string; full_name: string }[];
  hoje: string;
  agora: number;
}) {
  const router = useRouter();

  // Tarefas locais para o check, subitens e mover reagirem na hora.
  const normaliza = (l: Tarefa[]): TarefaLocal[] =>
    l.map((t) => ({ ...t, itens: t.itens ?? [] }));
  const [tarefas, setTarefas] = useState<TarefaLocal[]>(normaliza(tarefasProp));
  const assinatura = tarefasProp
    .map((t) => `${t.id}:${t.status}:${t.due_date}:${(t.itens ?? []).length}`)
    .join("|");
  const [vista, setVista] = useState(assinatura);
  if (assinatura !== vista) {
    setTarefas(normaliza(tarefasProp));
    setVista(assinatura);
  }

  const [visao, setVisao] = useState<Visao>("mes");
  const escolhaFeita = useRef(false);
  // No celular a grade de mês fica apertada, então a Agenda é o padrão.
  // Só ajusta na montagem, e nunca por cima de uma escolha do usuário.
  useEffect(() => {
    if (!escolhaFeita.current && window.matchMedia("(max-width: 640px)").matches) {
      setVisao("agenda");
    }
  }, []);

  const [cursor, setCursor] = useState(hoje);
  const [selecionado, setSelecionado] = useState(hoje);
  const [ligadas, setLigadas] = useState<Record<Camada, boolean>>({
    tarefa: true,
    rotina: true,
    plano: true,
  });

  function escolherVisao(v: Visao) {
    escolhaFeita.current = true;
    setVisao(v);
  }

  function atualizarLocal(id: string, muda: Partial<TarefaLocal>) {
    setTarefas((l) => l.map((t) => (t.id === id ? { ...t, ...muda } : t)));
  }

  const eventos = useMemo(
    () =>
      montarEventos({ tarefas, rotinas, planos, hoje }).filter(
        (e) => ligadas[e.camada],
      ),
    [tarefas, rotinas, planos, hoje, ligadas],
  );

  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>();
    for (const e of eventos) {
      const lista = m.get(e.dia) ?? [];
      lista.push(e);
      m.set(e.dia, lista);
    }
    return m;
  }, [eventos]);

  const cursorDate = dia(cursor);
  const titulo =
    visao === "mes"
      ? format(cursorDate, "MMMM 'de' yyyy", { locale: ptBR })
      : visao === "dia"
        ? formatarDataExtenso(dia(selecionado).getTime())
        : visao === "semana"
          ? `Semana de ${format(startOfWeek(cursorDate, SEG), "d 'de' MMM", { locale: ptBR })}`
          : "Próximos dias";

  function navegar(delta: number) {
    if (visao === "mes") setCursor(diaISO(addMonths(cursorDate, delta)));
    else if (visao === "semana") setCursor(diaISO(addWeeks(cursorDate, delta)));
    else if (visao === "dia") {
      const novo = diaISO(addDays(dia(selecionado), delta));
      setSelecionado(novo);
      setCursor(novo);
    } else setCursor(diaISO(addDays(cursorDate, delta * 7)));
  }

  function irHoje() {
    setCursor(hoje);
    setSelecionado(hoje);
  }

  function moverPara(id: string, novaData: string) {
    const anterior = tarefas.find((t) => t.id === id)?.due_date ?? null;
    atualizarLocal(id, { due_date: novaData });
    startTransicao(async () => {
      const r = await adiarTarefa(id, novaData);
      if (r?.erro) {
        atualizarLocal(id, { due_date: anterior });
        setErroGeral(r.erro);
      }
    });
  }
  const [, startTransicao] = useTransition();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  return (
    <section className="mt-8">
      {/* Barra de controle */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={irHoje}
          className="rounded-lg border border-linha bg-cartao px-4 py-2 font-sans text-sm text-tinta transition hover:border-vital/50"
        >
          Hoje
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => navegar(-1)} aria-label="Anterior" className="grid h-9 w-9 place-items-center rounded-lg border border-linha bg-cartao text-tinta transition hover:border-vital/50">
            ‹
          </button>
          <button type="button" onClick={() => navegar(1)} aria-label="Próximo" className="grid h-9 w-9 place-items-center rounded-lg border border-linha bg-cartao text-tinta transition hover:border-vital/50">
            ›
          </button>
        </div>

        <h2 className="font-display text-xl capitalize text-barra">{titulo}</h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-linha bg-cartao p-0.5">
            {VISOES.map((v) => (
              <button
                key={v.chave}
                type="button"
                onClick={() => escolherVisao(v.chave)}
                className={`rounded-md px-3 py-1.5 font-sans text-[13px] transition ${
                  visao === v.chave ? "bg-vital text-white" : "text-tinta hover:bg-areia-clara"
                }`}
              >
                {v.rotulo}
              </button>
            ))}
          </div>
          <NovaTarefa
            pacientes={pacientes}
            diaPadrao={selecionado}
            onCriada={() => router.refresh()}
          />
        </div>
      </div>

      {/* Filtros de camada */}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {CAMADAS.map((c) => (
          <label key={c.chave} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={ligadas[c.chave]}
              onChange={(e) => setLigadas((l) => ({ ...l, [c.chave]: e.target.checked }))}
              className="h-3.5 w-3.5 accent-[#A9723F]"
            />
            <span className="flex items-center gap-1.5 font-sans text-[13px] text-neutro">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_CAMADA[c.chave] }} />
              {c.rotulo}
            </span>
          </label>
        ))}
      </div>

      {erroGeral ? (
        <p role="alert" className="mt-3 rounded-lg border border-argila/35 bg-argila-suave px-4 py-2 font-sans text-sm text-argila">
          {erroGeral}
        </p>
      ) : null}

      <div className="mt-5">
        {visao === "mes" ? (
          <VisaoMes
            cursor={cursorDate}
            hoje={hoje}
            porDia={porDia}
            onAbrirDia={(d) => {
              setSelecionado(d);
              escolherVisao("dia");
            }}
            onMover={moverPara}
          />
        ) : null}

        {visao === "semana" ? (
          <VisaoSemana
            cursor={cursorDate}
            hoje={hoje}
            porDia={porDia}
            onAbrirDia={(d) => {
              setSelecionado(d);
              escolherVisao("dia");
            }}
            onMover={moverPara}
            onCriada={() => router.refresh()}
          />
        ) : null}

        {visao === "dia" ? (
          <VisaoDia
            diaSel={selecionado}
            hoje={hoje}
            eventos={ordenarDoDia(porDia.get(selecionado) ?? [])}
            atrasadas={eventos.filter((e) => e.atrasada)}
            momento={agora}
            onLocal={atualizarLocal}
            onMover={(id) => moverPara(id, hoje)}
            onCriada={() => router.refresh()}
          />
        ) : null}

        {visao === "agenda" ? (
          <VisaoAgenda
            hoje={hoje}
            porDia={porDia}
            eventos={eventos}
            onAbrirDia={(d) => {
              setSelecionado(d);
              escolherVisao("dia");
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

// ============================================================
// Item compacto, para mês, semana e agenda
// ============================================================

function ItemCompacto({
  ev,
  arrastavel = false,
}: {
  ev: Evento;
  arrastavel?: boolean;
}) {
  const cor =
    ev.camada === "tarefa" && ev.prioridade
      ? COR_PRIORIDADE[ev.prioridade] ?? COR_CAMADA.tarefa
      : COR_CAMADA[ev.camada];

  const conteudo = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ev.atrasada ? "#BC5443" : cor }} />
      {ev.hora ? <span className="shrink-0 font-mono text-[10px] text-neutro">{ev.hora}</span> : null}
      <span className={`truncate ${ev.concluida ? "text-neutro line-through" : ev.atrasada ? "text-argila" : "text-tinta"}`}>
        {ev.titulo}
      </span>
    </span>
  );

  if (ev.camada === "plano" && ev.patientId) {
    return (
      <Link
        href={`/painel/pacientes/${ev.patientId}`}
        className="block rounded px-1.5 py-1 font-sans text-[12px] transition hover:bg-areia-clara"
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <div
      draggable={arrastavel && ev.camada === "tarefa"}
      onDragStart={
        arrastavel && ev.tarefa
          ? (e) => e.dataTransfer.setData("text/plain", ev.tarefa!.id)
          : undefined
      }
      className={`rounded px-1.5 py-1 font-sans text-[12px] ${
        arrastavel && ev.camada === "tarefa" ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {conteudo}
    </div>
  );
}

// ============================================================
// Visão Mês
// ============================================================

function VisaoMes({
  cursor,
  hoje,
  porDia,
  onAbrirDia,
  onMover,
}: {
  cursor: Date;
  hoje: string;
  porDia: Map<string, Evento[]>;
  onAbrirDia: (d: string) => void;
  onMover: (id: string, novaData: string) => void;
}) {
  const inicio = startOfWeek(startOfMonth(cursor), SEG);
  const fim = endOfWeek(endOfMonth(cursor), SEG);
  const dias = eachDayOfInterval({ start: inicio, end: fim });
  const [alvo, setAlvo] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-linha">
      <div className="grid grid-cols-7 border-b border-linha bg-areia-clara">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="olho px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((d) => {
          const iso = diaISO(d);
          const doMes = isSameMonth(d, cursor);
          const ehHoje = iso === hoje;
          const lista = ordenarDoDia(porDia.get(iso) ?? []);
          const cabem = lista.slice(0, 3);
          const resto = lista.length - cabem.length;

          return (
            <div
              key={iso}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(iso);
              }}
              onDragLeave={() => setAlvo((a) => (a === iso ? null : a))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setAlvo(null);
                if (id) onMover(id, iso);
              }}
              className={`min-h-[104px] border-b border-r border-linha p-1.5 transition last:border-r-0 ${
                alvo === iso ? "bg-vital/10" : doMes ? "bg-cartao" : "bg-areia-clara/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onAbrirDia(iso)}
                className={`mb-1 grid h-6 w-6 place-items-center rounded-full font-mono text-[12px] transition ${
                  ehHoje ? "bg-vital font-bold text-white" : doMes ? "text-tinta hover:bg-areia-clara" : "text-tenue"
                }`}
              >
                {format(d, "d")}
              </button>
              <div className="space-y-0.5">
                {cabem.map((ev) => (
                  <ItemCompacto key={ev.id} ev={ev} arrastavel />
                ))}
                {resto > 0 ? (
                  <button
                    type="button"
                    onClick={() => onAbrirDia(iso)}
                    className="px-1.5 font-sans text-[11px] text-vital-fundo"
                  >
                    +{resto} mais
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Visão Semana
// ============================================================

function VisaoSemana({
  cursor,
  hoje,
  porDia,
  onAbrirDia,
  onMover,
  onCriada,
}: {
  cursor: Date;
  hoje: string;
  porDia: Map<string, Evento[]>;
  onAbrirDia: (d: string) => void;
  onMover: (id: string, novaData: string) => void;
  onCriada: () => void;
}) {
  const inicio = startOfWeek(cursor, SEG);
  const dias = eachDayOfInterval({ start: inicio, end: addDays(inicio, 6) });
  const [alvo, setAlvo] = useState<string | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-7">
      {dias.map((d) => {
        const iso = diaISO(d);
        const ehHoje = iso === hoje;
        const lista = ordenarDoDia(porDia.get(iso) ?? []);
        return (
          <div
            key={iso}
            onDragOver={(e) => {
              e.preventDefault();
              setAlvo(iso);
            }}
            onDragLeave={() => setAlvo((a) => (a === iso ? null : a))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              setAlvo(null);
              if (id) onMover(id, iso);
            }}
            className={`flex min-h-[160px] flex-col rounded-xl border p-2 transition ${
              alvo === iso ? "border-vital bg-vital/10" : "border-linha bg-cartao"
            }`}
          >
            <button
              type="button"
              onClick={() => onAbrirDia(iso)}
              className="mb-2 flex items-baseline gap-1.5 px-1 text-left"
            >
              <span className="olho">{format(d, "EEE", { locale: ptBR })}</span>
              <span className={`font-mono text-[13px] ${ehHoje ? "font-bold text-vital-fundo" : "text-tinta"}`}>
                {format(d, "d")}
              </span>
            </button>
            <div className="flex-1 space-y-0.5">
              {lista.map((ev) => (
                <ItemCompacto key={ev.id} ev={ev} arrastavel />
              ))}
            </div>
            <AdicaoRapidaLinha diaAlvo={iso} onCriada={onCriada} compacto />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Visão Dia, integra a antiga visão Hoje
// ============================================================

function VisaoDia({
  diaSel,
  hoje,
  eventos,
  atrasadas,
  momento,
  onLocal,
  onMover,
  onCriada,
}: {
  diaSel: string;
  hoje: string;
  eventos: Evento[];
  atrasadas: Evento[];
  momento: number;
  onLocal: (id: string, muda: Partial<TarefaLocal>) => void;
  onMover: (id: string) => void;
  onCriada: () => void;
}) {
  const tarefas = eventos.filter((e) => e.camada === "tarefa" && e.tarefa);
  const outros = eventos.filter((e) => e.camada !== "tarefa");
  const feitas = tarefas.filter((e) => e.concluida).length;
  const progresso = tarefas.length ? (feitas / tarefas.length) * 100 : 0;
  const ehHoje = diaSel === hoje;

  return (
    <div className="mx-auto max-w-2xl">
      {tarefas.length > 0 ? (
        <div className="mb-4">
          <p className="font-sans text-[13px] text-neutro">
            {feitas} de {tarefas.length} {tarefas.length === 1 ? "concluída" : "concluídas"}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-areia">
            <div className="h-full rounded-full bg-vital transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      ) : null}

      <AdicaoRapidaLinha diaAlvo={diaSel} onCriada={onCriada} />

      {ehHoje && atrasadas.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-display text-lg text-argila">Atrasadas</h3>
          <ul className="mt-3 space-y-2">
            {atrasadas
              .filter((e) => e.tarefa)
              .map((e) => (
                <ItemTarefa
                  key={e.id}
                  tarefa={{ ...(e.tarefa as Tarefa), itens: e.itens }}
                  atrasada
                  onLocal={onLocal}
                  onMover={onMover}
                  momento={momento}
                />
              ))}
          </ul>
        </div>
      ) : null}

      {outros.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {outros.map((e) => (
            <li key={e.id} className="flex items-center gap-2.5 rounded-xl border border-linha bg-cartao px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_CAMADA[e.camada] }} />
              <span className="font-sans text-[14px] text-tinta">{e.titulo}</span>
              {e.camada === "rotina" ? (
                <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-neutro">rotina</span>
              ) : null}
              {e.camada === "plano" && e.patientId ? (
                <Link href={`/painel/pacientes/${e.patientId}`} className="ml-auto font-sans text-[12px] text-vital-fundo">
                  ver ficha
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        {tarefas.length === 0 && outros.length === 0 ? (
          <div className="rounded-xl border border-dashed border-linha px-6 py-12 text-center">
            <p className="font-sans text-sm text-neutro">
              Nada para {formatarData(`${diaSel}T12:00:00`)} ainda. Adicione a primeira tarefa acima.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tarefas.map((e) => (
              <ItemTarefa
                key={e.id}
                tarefa={{ ...(e.tarefa as Tarefa), itens: e.itens }}
                onLocal={onLocal}
                onMover={onMover}
                momento={momento}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Visão Agenda, lista corrida
// ============================================================

function VisaoAgenda({
  hoje,
  porDia,
  eventos,
  onAbrirDia,
}: {
  hoje: string;
  porDia: Map<string, Evento[]>;
  eventos: Evento[];
  onAbrirDia: (d: string) => void;
}) {
  // Dias com evento, de hoje em diante, mais atrasados no topo.
  const dias = useMemo(() => {
    const set = new Set(eventos.map((e) => e.dia));
    return [...set].sort();
  }, [eventos]);

  const atrasados = dias.filter((d) => d < hoje);
  const futuros = dias.filter((d) => d >= hoje);
  const ordem = [...atrasados, ...futuros];

  if (ordem.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-linha px-6 py-14 text-center">
        <p className="font-sans text-sm text-neutro">
          Nenhum item na agenda. Crie uma tarefa para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {ordem.map((d) => {
        const lista = ordenarDoDia(porDia.get(d) ?? []);
        const passado = d < hoje;
        return (
          <div key={d}>
            <button
              type="button"
              onClick={() => onAbrirDia(d)}
              className="flex items-baseline gap-2 text-left"
            >
              <span className={`font-display text-lg ${passado ? "text-argila" : d === hoje ? "text-vital-fundo" : "text-barra"}`}>
                {d === hoje ? "Hoje" : formatarData(`${d}T12:00:00`)}
              </span>
              <span className="font-mono text-[12px] text-neutro">
                {format(dia(d), "EEEE", { locale: ptBR })}
              </span>
            </button>
            <ul className="mt-2 space-y-1.5">
              {lista.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-linha bg-cartao px-4 py-2.5">
                  <ItemCompacto ev={ev} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Adição rápida em linha e modal de nova tarefa
// ============================================================

function AdicaoRapidaLinha({
  diaAlvo,
  onCriada,
  compacto = false,
}: {
  diaAlvo: string;
  onCriada: () => void;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [ocupado, iniciar] = useTransition();

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    iniciar(async () => {
      const r = await adicionarRapida(t, null, null, diaAlvo, null);
      if (!r.erro) {
        setTexto("");
        onCriada();
      }
    });
  }

  if (compacto) {
    return (
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            enviar();
          }
        }}
        disabled={ocupado}
        placeholder="+ tarefa"
        className="mt-2 w-full rounded-md border border-transparent bg-areia-clara/60 px-2 py-1.5 font-sans text-[12px] text-tinta placeholder:text-neutro outline-none focus:border-vital focus:bg-white"
      />
    );
  }

  return (
    <div className="rounded-xl border border-linha bg-cartao px-4 py-3 shadow-cartao">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-linha text-neutro">
          +
        </span>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              enviar();
            }
          }}
          disabled={ocupado}
          placeholder="O que precisa ser feito? Escreva e aperte Enter"
          className="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-tinta placeholder:text-neutro outline-none"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={ocupado || !texto.trim()}
          className="rounded-md bg-vital px-4 py-1.5 font-sans text-[13px] font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
        >
          {ocupado ? "..." : "Adicionar"}
        </button>
      </div>
    </div>
  );
}

function NovaTarefa({
  pacientes,
  diaPadrao,
  onCriada,
}: {
  pacientes: { id: string; full_name: string }[];
  diaPadrao: string;
  onCriada: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [data, setData] = useState(diaPadrao);
  const [hora, setHora] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [paciente, setPaciente] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function salvar() {
    const t = texto.trim();
    if (!t) {
      setErro("Escreva a tarefa.");
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await adicionarRapida(t, prioridade || null, paciente || null, data, hora || null);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setTexto("");
      setHora("");
      setAberto(false);
      onCriada();
    });
  }

  const campo =
    "mt-1.5 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital";
  const rot = "block font-sans text-[13px] font-semibold text-tinta";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setData(diaPadrao);
          setAberto(true);
        }}
        className="rounded-lg bg-vital px-4 py-2 font-sans text-sm font-semibold text-white shadow-acao transition hover:brightness-105"
      >
        Nova tarefa
      </button>

      {aberto ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] overflow-y-auto">
          <button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="fixed inset-0 bg-barra/45" />
          <div className="relative mx-auto my-12 w-full max-w-lg px-5">
            <div className="rounded-[20px] border border-linha bg-cartao px-6 py-6 shadow-cartao">
              <h3 className="font-display text-[22px] text-barra">Nova tarefa</h3>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="nt-texto" className={rot}>
                    O que precisa ser feito <span className="text-vital">*</span>
                  </label>
                  <input
                    id="nt-texto"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") salvar();
                    }}
                    autoFocus
                    className={campo}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nt-data" className={rot}>Data</label>
                    <input id="nt-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
                  </div>
                  <div>
                    <label htmlFor="nt-hora" className={rot}>Hora, opcional</label>
                    <input id="nt-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={campo} />
                  </div>
                  <div>
                    <label htmlFor="nt-prio" className={rot}>Prioridade</label>
                    <select id="nt-prio" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className={campo}>
                      <option value="">Sem prioridade</option>
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="nt-pac" className={rot}>Paciente</label>
                    <select id="nt-pac" value={paciente} onChange={(e) => setPaciente(e.target.value)} className={campo}>
                      <option value="">Sem paciente</option>
                      {pacientes.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {erro ? <p className="mt-3 font-sans text-[13px] text-argila">{erro}</p> : null}

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={salvar}
                  disabled={ocupado}
                  className="rounded-xl bg-vital px-5 py-2.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105 disabled:opacity-60"
                >
                  {ocupado ? "Salvando..." : "Criar tarefa"}
                </button>
                <button type="button" onClick={() => setAberto(false)} className="font-sans text-sm text-neutro transition hover:text-tinta">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
