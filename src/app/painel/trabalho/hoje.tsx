"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatarData, formatarDataExtenso } from "@/lib/formato";
import {
  PRIORIDADES,
  grupoDaTarefa,
  hojeEAmanha,
  maisUmDia,
  contarFeitos,
  type GrupoDia,
  type Subitem,
  type Tarefa,
} from "@/lib/trabalho";
import {
  adicionarRapida,
  alternarTarefaRapida,
  adiarTarefa,
  renomearTarefa,
  mudarPrioridade,
  salvarSubitens,
  excluirTarefa,
} from "./actions";

type TarefaLocal = Tarefa & { itens: Subitem[] };

const CORES_PRIORIDADE: Record<string, string> = {
  Alta: "border-argila/40 text-argila",
  Média: "border-mel/50 text-mel-tinta",
  Baixa: "border-linha text-neutro",
};

export function Hoje({
  tarefas: tarefasProp,
  pacientes,
  agora,
}: {
  tarefas: Tarefa[];
  pacientes: { id: string; full_name: string }[];
  agora: number;
}) {
  const router = useRouter();

  // Cópia local para o check e os subitens reagirem na hora, com
  // sincronização por assinatura em vez de efeito.
  const normaliza = (lista: Tarefa[]): TarefaLocal[] =>
    lista.map((t) => ({ ...t, itens: t.itens ?? [] }));
  const [tarefas, setTarefas] = useState<TarefaLocal[]>(normaliza(tarefasProp));
  const assinatura = tarefasProp
    .map((t) => `${t.id}:${t.status}:${t.due_date}:${(t.itens ?? []).length}`)
    .join("|");
  const [vista, setVista] = useState(assinatura);
  if (assinatura !== vista) {
    setTarefas(normaliza(tarefasProp));
    setVista(assinatura);
  }

  const [historico, setHistorico] = useState(false);

  const grupos = useMemo(() => {
    const g: Record<GrupoDia, TarefaLocal[]> = {
      atrasadas: [],
      hoje: [],
      amanha: [],
      proximos: [],
      sem_data: [],
    };
    for (const t of tarefas) g[grupoDaTarefa(t, agora)].push(t);

    // Dentro do dia: pendentes primeiro, concluídas ao fim, cada bloco
    // por prioridade e depois por criação.
    const ordenar = (lista: TarefaLocal[]) =>
      [...lista].sort((a, b) => {
        if (a.status !== b.status) return a.status === "concluída" ? 1 : -1;
        const peso = { Alta: 0, Média: 1, Baixa: 2 };
        const pa = a.prioridade ? peso[a.prioridade] : 3;
        const pb = b.prioridade ? peso[b.prioridade] : 3;
        if (pa !== pb) return pa - pb;
        return a.created_at.localeCompare(b.created_at);
      });

    (Object.keys(g) as GrupoDia[]).forEach((k) => (g[k] = ordenar(g[k])));
    return g;
  }, [tarefas, agora]);

  const doDia = grupos.hoje;
  const feitasHoje = doDia.filter((t) => t.status === "concluída").length;
  const progresso = doDia.length ? (feitasHoje / doDia.length) * 100 : 0;

  function atualizarLocal(id: string, muda: Partial<TarefaLocal>) {
    setTarefas((lista) =>
      lista.map((t) => (t.id === id ? { ...t, ...muda } : t)),
    );
  }

  return (
    <section className="mt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="olho">Hoje</p>
          <h2 className="mt-1.5 font-display text-2xl capitalize text-barra">
            {formatarDataExtenso(agora)}
          </h2>
        </div>
        <div className="min-w-[180px]">
          <p className="text-right font-sans text-[13px] text-neutro">
            {feitasHoje} de {doDia.length}{" "}
            {doDia.length === 1 ? "concluída" : "concluídas"} hoje
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-areia">
            <div
              className="h-full rounded-full bg-vital transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </header>

      <AdicaoRapida
        pacientes={pacientes}
        hoje={hojeEAmanha(agora).hoje}
        onCriada={() => router.refresh()}
      />

      {grupos.atrasadas.length > 0 ? (
        <Bloco
          titulo="Atrasadas"
          alerta
          contagem={grupos.atrasadas.length}
          tarefas={grupos.atrasadas}
          agora={agora}
          onLocal={atualizarLocal}
          acaoData={{ rotulo: "Trazer para hoje", data: hojeEAmanha(agora).hoje }}
        />
      ) : null}

      <Bloco
        titulo="Hoje"
        contagem={doDia.length}
        tarefas={doDia}
        pacientes={pacientes}
        agora={agora}
        onLocal={atualizarLocal}
        vazio="Nada para hoje ainda, adicione a primeira tarefa acima."
      />

      {grupos.amanha.length > 0 ? (
        <Bloco
          titulo="Amanhã"
          contagem={grupos.amanha.length}
          tarefas={grupos.amanha}
          agora={agora}
          onLocal={atualizarLocal}
        />
      ) : null}

      {grupos.proximos.length > 0 ? (
        <Bloco
          titulo="Próximos dias"
          contagem={grupos.proximos.length}
          tarefas={grupos.proximos}
          agora={agora}
          onLocal={atualizarLocal}
        />
      ) : null}

      {grupos.sem_data.length > 0 ? (
        <Bloco
          titulo="Sem data"
          contagem={grupos.sem_data.length}
          tarefas={grupos.sem_data}
          agora={agora}
          onLocal={atualizarLocal}
          acaoData={{ rotulo: "Marcar para hoje", data: hojeEAmanha(agora).hoje }}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setHistorico((h) => !h)}
        className="mt-8 font-sans text-[13px] text-vital-fundo transition hover:text-vital"
      >
        {historico ? "Ocultar o histórico" : "Ver dias anteriores"}
      </button>

      {historico ? <Historico tarefas={tarefas} /> : null}
    </section>
  );
}

// ------------------------------------------------------------

function AdicaoRapida({
  pacientes,
  hoje,
  onCriada,
}: {
  pacientes: { id: string; full_name: string }[];
  hoje: string;
  onCriada: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [prioridade, setPrioridade] = useState<string>("");
  const [paciente, setPaciente] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    setErro(null);
    iniciar(async () => {
      const r = await adicionarRapida(t, prioridade || null, paciente || null, hoje);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setTexto("");
      onCriada();
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-linha bg-cartao px-4 py-3 shadow-cartao">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-linha text-neutro"
        >
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
          placeholder="O que precisa ser feito hoje? Escreva e aperte Enter"
          className="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-tinta placeholder:text-neutro outline-none"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-linha pt-2.5">
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          aria-label="Prioridade"
          className="rounded-md border border-linha bg-white px-2.5 py-1.5 font-sans text-[13px] text-tinta outline-none focus:border-vital"
        >
          <option value="">Prioridade</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {pacientes.length > 0 ? (
          <select
            value={paciente}
            onChange={(e) => setPaciente(e.target.value)}
            aria-label="Paciente"
            className="max-w-[180px] rounded-md border border-linha bg-white px-2.5 py-1.5 font-sans text-[13px] text-tinta outline-none focus:border-vital"
          >
            <option value="">Sem paciente</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="button"
          onClick={enviar}
          disabled={ocupado || !texto.trim()}
          className="ml-auto rounded-md bg-vital px-4 py-1.5 font-sans text-[13px] font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
        >
          {ocupado ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      {erro ? (
        <p className="mt-2 font-sans text-[12px] text-argila">{erro}</p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------

function Bloco({
  titulo,
  contagem,
  tarefas,
  agora,
  onLocal,
  alerta = false,
  vazio,
  acaoData,
}: {
  titulo: string;
  contagem: number;
  tarefas: TarefaLocal[];
  agora: number;
  onLocal: (id: string, muda: Partial<TarefaLocal>) => void;
  alerta?: boolean;
  vazio?: string;
  acaoData?: { rotulo: string; data: string };
}) {
  return (
    <div className="mt-8">
      <div className="flex items-baseline gap-2">
        <h3
          className={`font-display text-lg ${
            alerta ? "text-argila" : "text-barra"
          }`}
        >
          {titulo}
        </h3>
        <span className="font-mono text-[12px] text-neutro">{contagem}</span>
      </div>

      {tarefas.length === 0 ? (
        vazio ? (
          <div className="mt-3 rounded-xl border border-dashed border-linha px-6 py-8 text-center">
            <p className="font-sans text-sm text-neutro">{vazio}</p>
          </div>
        ) : null
      ) : (
        <ul className="mt-3 space-y-2">
          {tarefas.map((t) => (
            <ItemTarefa
              key={t.id}
              tarefa={t}
              agora={agora}
              alerta={alerta}
              onLocal={onLocal}
              acaoData={acaoData}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------

function ItemTarefa({
  tarefa,
  agora,
  alerta,
  onLocal,
  acaoData,
}: {
  tarefa: TarefaLocal;
  agora: number;
  alerta?: boolean;
  onLocal: (id: string, muda: Partial<TarefaLocal>) => void;
  acaoData?: { rotulo: string; data: string };
}) {
  const [ocupado, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [textoEdit, setTextoEdit] = useState(tarefa.titulo);
  const [abrirSub, setAbrirSub] = useState(false);
  const [novoSub, setNovoSub] = useState("");

  const feita = tarefa.status === "concluída";
  const { feitos, total } = contarFeitos(tarefa.itens);

  function alternar() {
    const concluir = !feita;
    setErro(null);
    onLocal(tarefa.id, {
      status: concluir ? "concluída" : "pendente",
      completed_at: concluir ? new Date(agora).toISOString() : null,
    });
    iniciar(async () => {
      const r = await alternarTarefaRapida(tarefa.id, concluir);
      if (r?.erro) {
        onLocal(tarefa.id, {
          status: concluir ? "pendente" : "concluída",
        });
        setErro(r.erro);
      }
    });
  }

  function salvarItens(itens: Subitem[]) {
    onLocal(tarefa.id, { itens });
    iniciar(async () => {
      const r = await salvarSubitens(tarefa.id, itens);
      if (r?.erro) setErro(r.erro);
    });
  }

  function addSubitem() {
    const t = novoSub.trim();
    if (!t) return;
    salvarItens([...tarefa.itens, { texto: t, feito: false }]);
    setNovoSub("");
  }

  function alternarSub(i: number) {
    salvarItens(
      tarefa.itens.map((s, idx) =>
        idx === i ? { ...s, feito: !s.feito } : s,
      ),
    );
  }

  function removerSub(i: number) {
    salvarItens(tarefa.itens.filter((_, idx) => idx !== i));
  }

  function renomear() {
    const t = textoEdit.trim();
    if (!t || t === tarefa.titulo) {
      setEditando(false);
      return;
    }
    onLocal(tarefa.id, { titulo: t });
    setEditando(false);
    iniciar(async () => {
      const r = await renomearTarefa(tarefa.id, t);
      if (r?.erro) setErro(r.erro);
    });
  }

  return (
    <li
      className={`rounded-xl border px-4 py-3 transition ${
        alerta
          ? "border-argila/35 bg-argila-suave"
          : "border-linha bg-cartao"
      } ${feita ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox com boa área de toque. */}
        <button
          type="button"
          onClick={alternar}
          disabled={ocupado}
          aria-pressed={feita}
          aria-label={feita ? "Desmarcar tarefa" : "Concluir tarefa"}
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
            feita
              ? "border-emerald-600/60 bg-emerald-600 text-white"
              : "border-neutro/50 hover:border-vital"
          }`}
        >
          {feita ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          {editando ? (
            <input
              value={textoEdit}
              onChange={(e) => setTextoEdit(e.target.value)}
              onBlur={renomear}
              onKeyDown={(e) => {
                if (e.key === "Enter") renomear();
                if (e.key === "Escape") {
                  setTextoEdit(tarefa.titulo);
                  setEditando(false);
                }
              }}
              autoFocus
              className="w-full rounded-md border border-linha bg-white px-2 py-1 font-sans text-[15px] text-tinta outline-none focus:border-vital"
            />
          ) : (
            <p
              className={`font-sans text-[15px] ${
                feita ? "text-neutro line-through" : "text-tinta"
              }`}
            >
              {tarefa.titulo}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {tarefa.prioridade ? (
              <span
                className={`rounded border px-1.5 py-0.5 font-sans text-[10px] ${
                  CORES_PRIORIDADE[tarefa.prioridade]
                }`}
              >
                {tarefa.prioridade}
              </span>
            ) : null}
            {tarefa.due_date ? (
              <span
                className={`font-sans text-[12px] ${
                  alerta ? "text-argila" : "text-neutro"
                }`}
              >
                {alerta ? "venceu " : ""}
                {formatarData(tarefa.due_date)}
              </span>
            ) : null}
            {tarefa.patients ? (
              <span className="font-sans text-[12px] text-neutro">
                {tarefa.patients.full_name}
              </span>
            ) : null}
            {total > 0 ? (
              <button
                type="button"
                onClick={() => setAbrirSub((a) => !a)}
                className="font-mono text-[12px] text-vital-fundo"
              >
                {feitos}/{total} subitens
              </button>
            ) : null}
          </div>

          {abrirSub || (total === 0 && abrirSub) ? (
            <ul className="mt-3 space-y-1.5 border-l-2 border-linha pl-3">
              {tarefa.itens.map((s, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => alternarSub(i)}
                    aria-label={s.feito ? "Desmarcar subitem" : "Concluir subitem"}
                    className={`grid shrink-0 place-items-center rounded border ${
                      s.feito
                        ? "border-emerald-600/60 bg-emerald-600 text-white"
                        : "border-neutro/50"
                    }`}
                    style={{ height: 18, width: 18 }}
                  >
                    {s.feito ? (
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                  <span
                    className={`flex-1 font-sans text-[13.5px] ${
                      s.feito ? "text-neutro line-through" : "text-tinta"
                    }`}
                  >
                    {s.texto}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerSub(i)}
                    aria-label="Remover subitem"
                    className="font-sans text-[13px] text-neutro transition hover:text-argila"
                  >
                    ×
                  </button>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <input
                  value={novoSub}
                  onChange={(e) => setNovoSub(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubitem();
                    }
                  }}
                  placeholder="Novo subitem, Enter para adicionar"
                  className="min-w-0 flex-1 rounded-md border border-linha bg-white px-2 py-1 font-sans text-[13px] text-tinta placeholder:text-neutro outline-none focus:border-vital"
                />
              </li>
            </ul>
          ) : null}
        </div>
      </div>

      {/* Ações */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-linha pt-2.5 font-sans text-[12px]">
        <button
          type="button"
          onClick={() => setAbrirSub((a) => !a)}
          className="text-vital-fundo transition hover:text-vital"
        >
          {abrirSub ? "Fechar checklist" : "Checklist"}
        </button>
        <button
          type="button"
          onClick={() => {
            setTextoEdit(tarefa.titulo);
            setEditando(true);
          }}
          className="text-vital-fundo transition hover:text-vital"
        >
          Editar
        </button>
        <PrioridadeRapida id={tarefa.id} atual={tarefa.prioridade ?? ""} />
        {acaoData ? (
          <button
            type="button"
            onClick={() =>
              iniciar(async () => {
                await adiarTarefa(tarefa.id, acaoData.data);
              })
            }
            className="text-vital-fundo transition hover:text-vital"
          >
            {acaoData.rotulo}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              iniciar(async () => {
                const alvo = tarefa.due_date
                  ? maisUmDia(tarefa.due_date)
                  : hojeEAmanha(agora).amanha;
                await adiarTarefa(tarefa.id, alvo);
              })
            }
            className="text-vital-fundo transition hover:text-vital"
          >
            Adiar
          </button>
        )}
        <form
          action={excluirTarefa}
          onSubmit={(e) => {
            if (!window.confirm(`Excluir a tarefa ${tarefa.titulo}?`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={tarefa.id} />
          <button type="submit" className="text-argila transition hover:underline">
            Excluir
          </button>
        </form>
        {erro ? <span className="text-argila">{erro}</span> : null}
      </div>
    </li>
  );
}

function PrioridadeRapida({ id, atual }: { id: string; atual: string }) {
  const [, iniciar] = useTransition();
  return (
    <select
      value={atual}
      onChange={(e) =>
        iniciar(async () => {
          await mudarPrioridade(id, e.target.value || null);
        })
      }
      aria-label="Mudar prioridade"
      className="rounded border border-linha bg-white px-1.5 py-0.5 font-sans text-[12px] text-tinta outline-none focus:border-vital"
    >
      <option value="">Sem prioridade</option>
      {PRIORIDADES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

// ------------------------------------------------------------

function Historico({ tarefas }: { tarefas: TarefaLocal[] }) {
  // Concluídas agrupadas pelo dia em que foram concluídas, do mais
  // recente ao mais antigo. Sai da própria lista já carregada, sem
  // outra consulta.
  const porDia = useMemo(() => {
    const mapa = new Map<string, TarefaLocal[]>();
    for (const t of tarefas) {
      if (t.status !== "concluída" || !t.completed_at) continue;
      const dia = t.completed_at.slice(0, 10);
      const lista = mapa.get(dia) ?? [];
      lista.push(t);
      mapa.set(dia, lista);
    }
    return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [tarefas]);

  if (porDia.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-linha px-6 py-8 text-center">
        <p className="font-sans text-sm text-neutro">
          Nenhuma tarefa concluída ainda. Conforme você for marcando, elas
          aparecem aqui, agrupadas por dia.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5">
      {porDia.map(([dia, lista]) => (
        <div key={dia}>
          <p className="font-mono text-[12px] uppercase tracking-wider text-neutro">
            {formatarData(`${dia}T12:00:00Z`)} · {lista.length}{" "}
            {lista.length === 1 ? "concluída" : "concluídas"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {lista.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2.5 rounded-lg border border-linha bg-cartao px-4 py-2.5"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#059669" strokeWidth="3" aria-hidden>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-sans text-[14px] text-neutro line-through">
                  {t.titulo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
