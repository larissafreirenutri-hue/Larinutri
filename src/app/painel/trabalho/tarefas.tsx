"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatarData } from "@/lib/formato";
import { PRIORIDADES, type TarefaNaLista, type Tarefa } from "@/lib/trabalho";
import {
  criarTarefa,
  atualizarTarefa,
  alternarTarefa,
  excluirTarefa,
  type EstadoTrabalho,
} from "./actions";

const rotulo = "block font-sans text-sm text-creme/80";
const controle =
  "mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme placeholder:text-creme/35 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado";
const seletor =
  "mt-2 rounded-md border border-dourado/30 bg-creme/5 px-3 py-2 font-sans text-sm text-creme outline-none focus:border-dourado";

const CORES_PRIORIDADE: Record<string, string> = {
  Alta: "border-red-300/40 text-red-200",
  Média: "border-dourado/40 text-dourado",
  Baixa: "border-creme/25 text-creme/55",
};

function BotaoSalvar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-dourado px-5 py-2.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:opacity-60"
    >
      {pending ? "Salvando..." : texto}
    </button>
  );
}

function FormularioTarefa({
  tarefa,
  pacientes,
  onPronto,
}: {
  tarefa?: Tarefa;
  pacientes: { id: string; full_name: string }[];
  onPronto?: () => void;
}) {
  const editando = Boolean(tarefa);
  const [estado, acao] = useActionState<EstadoTrabalho, FormData>(
    editando ? atualizarTarefa : criarTarefa,
    {},
  );

  return (
    <form action={acao} className="space-y-4">
      {tarefa ? <input type="hidden" name="id" value={tarefa.id} /> : null}

      <div>
        <label htmlFor={`titulo-${tarefa?.id ?? "novo"}`} className={rotulo}>
          Título <span className="text-dourado">*</span>
        </label>
        <input
          id={`titulo-${tarefa?.id ?? "novo"}`}
          name="titulo"
          required
          defaultValue={tarefa?.titulo ?? ""}
          placeholder="Montar plano da Ana, responder mensagens..."
          className={controle}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`prioridade-${tarefa?.id ?? "novo"}`}
            className={rotulo}
          >
            Prioridade
          </label>
          <select
            id={`prioridade-${tarefa?.id ?? "novo"}`}
            name="prioridade"
            defaultValue={tarefa?.prioridade ?? ""}
            className={controle}
          >
            <option value="" className="bg-marrom">
              Sem prioridade
            </option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p} className="bg-marrom">
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`due-${tarefa?.id ?? "novo"}`} className={rotulo}>
            Entregar até
          </label>
          <input
            id={`due-${tarefa?.id ?? "novo"}`}
            name="due_date"
            type="date"
            defaultValue={tarefa?.due_date ?? ""}
            className={controle}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`pac-${tarefa?.id ?? "novo"}`} className={rotulo}>
            Paciente
          </label>
          <select
            id={`pac-${tarefa?.id ?? "novo"}`}
            name="patient_id"
            defaultValue={tarefa?.patient_id ?? ""}
            className={controle}
          >
            <option value="" className="bg-marrom">
              Sem vínculo
            </option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id} className="bg-marrom">
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`desc-${tarefa?.id ?? "novo"}`} className={rotulo}>
            Descrição
          </label>
          <textarea
            id={`desc-${tarefa?.id ?? "novo"}`}
            name="descricao"
            rows={2}
            defaultValue={tarefa?.descricao ?? ""}
            placeholder="opcional"
            className={`${controle} resize-y`}
          />
        </div>
      </div>

      {tarefa ? (
        <input type="hidden" name="status" value={tarefa.status} />
      ) : null}

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <BotaoSalvar texto={editando ? "Salvar" : "Adicionar tarefa"} />
        {onPronto ? (
          <button
            type="button"
            onClick={onPronto}
            className="font-sans text-sm text-creme/60 transition hover:text-creme"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

type FiltroStatus = "pendente" | "concluída" | "atrasada" | "todas";
type FiltroPrioridade = "todas" | "Alta" | "Média" | "Baixa";

export function Tarefas({
  tarefas,
  pacientes,
  atrasadas,
}: {
  tarefas: TarefaNaLista[];
  pacientes: { id: string; full_name: string }[];
  atrasadas: number;
}) {
  const [status, setStatus] = useState<FiltroStatus>("pendente");
  const [prioridade, setPrioridade] = useState<FiltroPrioridade>("todas");
  const [novaAberta, setNovaAberta] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const visiveis = useMemo(
    () =>
      tarefas.filter((t) => {
        if (status === "atrasada" && !t.atrasada) return false;
        if (status === "pendente" && t.status !== "pendente") return false;
        if (status === "concluída" && t.status !== "concluída") return false;
        if (prioridade !== "todas" && t.prioridade !== prioridade) return false;
        return true;
      }),
    [tarefas, status, prioridade],
  );

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl text-dourado">Tarefas</h2>
        <button
          type="button"
          onClick={() => setNovaAberta((a) => !a)}
          aria-expanded={novaAberta}
          className="rounded-md bg-dourado px-5 py-2.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90"
        >
          {novaAberta ? "Fechar" : "Adicionar tarefa"}
        </button>
      </div>

      {novaAberta ? (
        <div className="mt-5 rounded-xl border border-dourado/25 bg-creme/5 px-6 py-6">
          <FormularioTarefa
            pacientes={pacientes}
            onPronto={() => setNovaAberta(false)}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <span className={rotulo}>Situação</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FiltroStatus)}
            className={seletor}
            aria-label="Filtrar tarefas por situação"
          >
            <option value="pendente" className="bg-marrom">Pendentes</option>
            <option value="concluída" className="bg-marrom">Concluídas</option>
            <option value="atrasada" className="bg-marrom">Atrasadas</option>
            <option value="todas" className="bg-marrom">Todas</option>
          </select>
        </div>

        <div>
          <span className={rotulo}>Prioridade</span>
          <select
            value={prioridade}
            onChange={(e) =>
              setPrioridade(e.target.value as FiltroPrioridade)
            }
            className={seletor}
            aria-label="Filtrar tarefas por prioridade"
          >
            <option value="todas" className="bg-marrom">Todas</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p} className="bg-marrom">{p}</option>
            ))}
          </select>
        </div>

        {atrasadas > 0 ? (
          <button
            type="button"
            onClick={() => {
              setStatus("atrasada");
              setPrioridade("todas");
            }}
            className="rounded-md border border-red-300/40 px-4 py-2 font-sans text-sm text-red-200 transition hover:bg-red-900/25"
          >
            Ver {atrasadas} {atrasadas === 1 ? "atrasada" : "atrasadas"}
          </button>
        ) : null}
      </div>

      {tarefas.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-dourado/25 px-6 py-12 text-center">
          <p className="font-display text-lg text-creme/70">
            Nenhuma tarefa por aqui
          </p>
          <p className="mt-2 font-sans text-sm text-creme/50">
            Registre o que precisa ser feito e tire da cabeça.
          </p>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-dourado/25 px-6 py-10 text-center">
          <p className="font-sans text-sm text-creme/55">
            Nenhuma tarefa com esses filtros.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {visiveis.map((t) => {
            const feita = t.status === "concluída";

            return (
              <li
                key={t.id}
                className={`rounded-xl border px-5 py-4 ${
                  t.atrasada
                    ? "border-red-300/40 bg-red-900/15"
                    : "border-dourado/20 bg-creme/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <form action={alternarTarefa} className="pt-0.5">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value={t.status} />
                    <button
                      type="submit"
                      aria-label={
                        feita ? "Reabrir tarefa" : "Marcar como concluída"
                      }
                      className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                        feita
                          ? "border-emerald-300/60 bg-emerald-400/25 text-emerald-100"
                          : "border-dourado/40 hover:border-dourado"
                      }`}
                    >
                      {feita ? "✓" : ""}
                    </button>
                  </form>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-sans text-sm ${
                        feita ? "text-creme/40 line-through" : "text-creme"
                      }`}
                    >
                      {t.titulo}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {t.prioridade ? (
                        <span
                          className={`rounded border px-2 py-0.5 font-sans text-[10px] ${
                            CORES_PRIORIDADE[t.prioridade]
                          }`}
                        >
                          {t.prioridade}
                        </span>
                      ) : null}

                      {t.due_date ? (
                        <span
                          className={`font-sans text-xs ${
                            t.atrasada ? "text-red-200" : "text-creme/45"
                          }`}
                        >
                          {t.atrasada ? "venceu " : "até "}
                          {formatarData(t.due_date)}
                        </span>
                      ) : null}

                      {t.patients ? (
                        <span className="font-sans text-xs text-creme/45">
                          {t.patients.full_name}
                        </span>
                      ) : null}
                    </div>

                    {t.descricao ? (
                      <p className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-creme/60">
                        {t.descricao}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditando(editando === t.id ? null : t.id)
                      }
                      className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                    >
                      {editando === t.id ? "Fechar" : "Editar"}
                    </button>

                    <form action={excluirTarefa}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        onClick={(e) => {
                          const ok = window.confirm(
                            `Excluir a tarefa ${t.titulo}?`,
                          );
                          if (!ok) e.preventDefault();
                        }}
                        className="rounded-md border border-red-300/30 px-3 py-1.5 font-sans text-xs text-red-200 transition hover:bg-red-900/25"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>

                {editando === t.id ? (
                  <div className="mt-4 border-t border-dourado/15 pt-4">
                    <FormularioTarefa
                      tarefa={t}
                      pacientes={pacientes}
                      onPronto={() => setEditando(null)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
