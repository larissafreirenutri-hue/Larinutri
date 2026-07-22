"use client";

import { useState, useTransition } from "react";
import { formatarData } from "@/lib/formato";
import { PRIORIDADES, contarFeitos, type Subitem, type Tarefa } from "@/lib/trabalho";
import {
  alternarTarefaRapida,
  renomearTarefa,
  mudarPrioridade,
  salvarSubitens,
  excluirTarefa,
} from "./actions";

export type TarefaLocal = Tarefa & { itens: Subitem[] };

const CORES_PRIORIDADE: Record<string, string> = {
  Alta: "border-argila/40 text-argila",
  Média: "border-mel/50 text-mel-tinta",
  Baixa: "border-linha text-neutro",
};

/**
 * Uma tarefa aberta, com check, subitens e ações. É a peça da visão
 * Dia. Recebe onLocal para o pai refletir o estado otimista, e onMover
 * para adiar ou trazer a tarefa para outra data.
 */
export function ItemTarefa({
  tarefa,
  atrasada = false,
  onLocal,
  onMover,
  momento,
}: {
  tarefa: TarefaLocal;
  atrasada?: boolean;
  onLocal: (id: string, muda: Partial<TarefaLocal>) => void;
  onMover?: (id: string) => void;
  momento: number;
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
      completed_at: concluir ? new Date(momento).toISOString() : null,
    });
    iniciar(async () => {
      const r = await alternarTarefaRapida(tarefa.id, concluir);
      if (r?.erro) {
        onLocal(tarefa.id, { status: concluir ? "pendente" : "concluída" });
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
        atrasada ? "border-argila/35 bg-argila-suave" : "border-linha bg-cartao"
      } ${feita ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
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
            <p className={`font-sans text-[15px] ${feita ? "text-neutro line-through" : "text-tinta"}`}>
              {tarefa.due_time ? (
                <span className="mr-2 font-mono text-[13px] text-vital-fundo">
                  {tarefa.due_time.slice(0, 5)}
                </span>
              ) : null}
              {tarefa.titulo}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {tarefa.prioridade ? (
              <span className={`rounded border px-1.5 py-0.5 font-sans text-[10px] ${CORES_PRIORIDADE[tarefa.prioridade]}`}>
                {tarefa.prioridade}
              </span>
            ) : null}
            {atrasada && tarefa.due_date ? (
              <span className="font-sans text-[12px] text-argila">
                venceu {formatarData(tarefa.due_date)}
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

          {abrirSub ? (
            <ul className="mt-3 space-y-1.5 border-l-2 border-linha pl-3">
              {tarefa.itens.map((s, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      salvarItens(
                        tarefa.itens.map((x, idx) => (idx === i ? { ...x, feito: !x.feito } : x)),
                      )
                    }
                    aria-label={s.feito ? "Desmarcar subitem" : "Concluir subitem"}
                    className={`grid shrink-0 place-items-center rounded border ${
                      s.feito ? "border-emerald-600/60 bg-emerald-600 text-white" : "border-neutro/50"
                    }`}
                    style={{ height: 18, width: 18 }}
                  >
                    {s.feito ? (
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                  <span className={`flex-1 font-sans text-[13.5px] ${s.feito ? "text-neutro line-through" : "text-tinta"}`}>
                    {s.texto}
                  </span>
                  <button
                    type="button"
                    onClick={() => salvarItens(tarefa.itens.filter((_, idx) => idx !== i))}
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
                      const t = novoSub.trim();
                      if (t) {
                        salvarItens([...tarefa.itens, { texto: t, feito: false }]);
                        setNovoSub("");
                      }
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

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-linha pt-2.5 font-sans text-[12px]">
        <button type="button" onClick={() => setAbrirSub((a) => !a)} className="text-vital-fundo transition hover:text-vital">
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
        <select
          value={tarefa.prioridade ?? ""}
          onChange={(e) =>
            iniciar(async () => {
              await mudarPrioridade(tarefa.id, e.target.value || null);
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
        {onMover ? (
          <button type="button" onClick={() => onMover(tarefa.id)} className="text-vital-fundo transition hover:text-vital">
            {atrasada ? "Trazer para hoje" : "Mover"}
          </button>
        ) : null}
        <form
          action={excluirTarefa}
          onSubmit={(e) => {
            if (!window.confirm(`Excluir a tarefa ${tarefa.titulo}?`)) e.preventDefault();
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
