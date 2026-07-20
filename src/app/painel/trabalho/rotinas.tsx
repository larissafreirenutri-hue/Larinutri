"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatarData } from "@/lib/formato";
import { FREQUENCIAS, type Rotina, type RotinaNaLista } from "@/lib/trabalho";
import {
  criarRotina,
  atualizarRotina,
  concluirRotina,
  alternarRotina,
  excluirRotina,
  type EstadoTrabalho,
} from "./actions";

const rotulo = "block font-sans text-sm text-creme/80";
const controle =
  "mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme placeholder:text-creme/35 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado";

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

function FormularioRotina({
  rotina,
  hoje,
  onPronto,
}: {
  rotina?: Rotina;
  hoje: string;
  onPronto?: () => void;
}) {
  const editando = Boolean(rotina);
  const [estado, acao] = useActionState<EstadoTrabalho, FormData>(
    editando ? atualizarRotina : criarRotina,
    {},
  );

  return (
    <form action={acao} className="space-y-4">
      {rotina ? <input type="hidden" name="id" value={rotina.id} /> : null}

      <div>
        <label htmlFor={`rt-${rotina?.id ?? "novo"}`} className={rotulo}>
          Título <span className="text-dourado">*</span>
        </label>
        <input
          id={`rt-${rotina?.id ?? "novo"}`}
          name="titulo"
          required
          defaultValue={rotina?.titulo ?? ""}
          placeholder="Revisar check-ins da semana, emitir notas..."
          className={controle}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`rf-${rotina?.id ?? "novo"}`} className={rotulo}>
            Frequência <span className="text-dourado">*</span>
          </label>
          <select
            id={`rf-${rotina?.id ?? "novo"}`}
            name="frequencia"
            defaultValue={rotina?.frequencia ?? "Semanal"}
            className={controle}
          >
            {FREQUENCIAS.map((f) => (
              <option key={f} value={f} className="bg-marrom">
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`rd-${rotina?.id ?? "novo"}`} className={rotulo}>
            Próxima vez
          </label>
          <input
            id={`rd-${rotina?.id ?? "novo"}`}
            name="next_due"
            type="date"
            defaultValue={rotina?.next_due ?? hoje}
            className={controle}
          />
        </div>
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <BotaoSalvar texto={editando ? "Salvar" : "Adicionar rotina"} />
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

export function Rotinas({
  rotinas,
  hoje,
}: {
  rotinas: RotinaNaLista[];
  hoje: string;
}) {
  const [novaAberta, setNovaAberta] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [mostrarInativas, setMostrarInativas] = useState(false);

  const visiveis = mostrarInativas ? rotinas : rotinas.filter((r) => r.ativa);
  const inativas = rotinas.filter((r) => !r.ativa).length;

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl text-dourado">Rotinas</h2>
        <button
          type="button"
          onClick={() => setNovaAberta((a) => !a)}
          aria-expanded={novaAberta}
          className="rounded-md border border-dourado/40 px-5 py-2.5 font-sans text-sm text-dourado transition hover:bg-dourado/10"
        >
          {novaAberta ? "Fechar" : "Adicionar rotina"}
        </button>
      </div>
      <p className="mt-1 font-sans text-xs text-creme/40">
        O que se repete, para não depender da memória
      </p>

      {novaAberta ? (
        <div className="mt-5 rounded-xl border border-dourado/25 bg-creme/5 px-6 py-6">
          <FormularioRotina hoje={hoje} onPronto={() => setNovaAberta(false)} />
        </div>
      ) : null}

      {inativas > 0 ? (
        <button
          type="button"
          onClick={() => setMostrarInativas((m) => !m)}
          className="mt-5 font-sans text-xs text-dourado transition hover:text-dourado/80"
        >
          {mostrarInativas
            ? "Ocultar as pausadas"
            : `Mostrar ${inativas} ${inativas === 1 ? "pausada" : "pausadas"}`}
        </button>
      ) : null}

      {visiveis.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-dourado/25 px-6 py-12 text-center">
          <p className="font-display text-lg text-creme/70">
            Nenhuma rotina ativa
          </p>
          <p className="mt-2 font-sans text-sm text-creme/50">
            Cadastre o que você repete toda semana, como revisar os check-ins.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {visiveis.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border px-5 py-4 ${
                r.vencida
                  ? "border-dourado/50 bg-dourado/[0.08]"
                  : "border-dourado/20 bg-creme/5"
              } ${r.ativa ? "" : "opacity-55"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-creme">{r.titulo}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 font-sans text-xs">
                    <span className="text-creme/45">{r.frequencia}</span>
                    {r.next_due ? (
                      <span
                        className={
                          r.vencida ? "text-dourado" : "text-creme/45"
                        }
                      >
                        {r.vencida ? "vence hoje ou antes, " : "próxima em "}
                        {formatarData(r.next_due)}
                      </span>
                    ) : null}
                    {!r.ativa ? (
                      <span className="text-creme/40">pausada</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {r.ativa ? (
                    <form action={concluirRotina}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        type="hidden"
                        name="frequencia"
                        value={r.frequencia}
                      />
                      <input
                        type="hidden"
                        name="next_due"
                        value={r.next_due ?? ""}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-emerald-300/40 px-3 py-1.5 font-sans text-xs text-emerald-200 transition hover:bg-emerald-400/10"
                      >
                        Marcar como feita
                      </button>
                    </form>
                  ) : null}

                  <form action={alternarRotina}>
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      type="hidden"
                      name="ativa"
                      value={String(r.ativa)}
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                    >
                      {r.ativa ? "Pausar" : "Retomar"}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setEditando(editando === r.id ? null : r.id)}
                    className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                  >
                    {editando === r.id ? "Fechar" : "Editar"}
                  </button>

                  <form action={excluirRotina}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      onClick={(e) => {
                        const ok = window.confirm(
                          `Excluir a rotina ${r.titulo}?`,
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

              {editando === r.id ? (
                <div className="mt-4 border-t border-dourado/15 pt-4">
                  <FormularioRotina
                    rotina={r}
                    hoje={hoje}
                    onPronto={() => setEditando(null)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
