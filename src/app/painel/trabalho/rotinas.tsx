"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
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

/**
 * Botão de marcar rotina como feita, com estado otimista. A data da
 * próxima ocorrência já vem calculada do servidor. Enquanto salva, o
 * botão mostra "Feito!" e, se falhar, aparece a mensagem de erro. O
 * feedback é o que faltava: sem ele, a data avançava mas parecia que
 * nada tinha acontecido.
 */
function BotaoConcluir({
  id,
  frequencia,
  nextDue,
}: {
  id: string;
  frequencia: string;
  nextDue: string | null;
}) {
  const [ocupado, iniciar] = useTransition();
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function concluir() {
    setErro(null);
    iniciar(async () => {
      const r = await concluirRotina(id, frequencia, nextDue);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      // Confirmação breve. A revalidação do servidor traz a data nova.
      setFeito(true);
      setTimeout(() => setFeito(false), 2500);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={concluir}
        disabled={ocupado}
        className="rounded-md border border-emerald-600/40 px-3 py-1.5 font-sans text-xs text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
      >
        {ocupado ? "Salvando..." : feito ? "Feito!" : "Marcar como feita"}
      </button>
      {erro ? (
        <span className="font-sans text-[11px] text-argila">{erro}</span>
      ) : null}
    </span>
  );
}

const rotulo = "block font-sans text-sm text-tinta";
const controle =
  "mt-2 w-full rounded-md border border-linha bg-cartao px-4 py-2.5 font-sans text-sm text-tinta placeholder:text-neutro outline-none focus:border-vital focus:ring-1 focus:ring-vital";

function BotaoSalvar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-vital px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-vital/10 disabled:opacity-60"
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
          Título <span className="text-vital-fundo">*</span>
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
            Frequência <span className="text-vital-fundo">*</span>
          </label>
          <select
            id={`rf-${rotina?.id ?? "novo"}`}
            name="frequencia"
            defaultValue={rotina?.frequencia ?? "Semanal"}
            className={controle}
          >
            {FREQUENCIAS.map((f) => (
              <option key={f} value={f} className="bg-cartao">
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
          className="rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
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
            className="font-sans text-sm text-neutro transition hover:text-tinta"
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
        <h2 className="font-display text-xl text-vital-fundo">Rotinas</h2>
        <button
          type="button"
          onClick={() => setNovaAberta((a) => !a)}
          aria-expanded={novaAberta}
          className="rounded-md border border-linha px-5 py-2.5 font-sans text-sm text-vital-fundo transition hover:bg-vital/10"
        >
          {novaAberta ? "Fechar" : "Adicionar rotina"}
        </button>
      </div>
      <p className="mt-1 font-sans text-xs text-neutro">
        O que se repete, para não depender da memória
      </p>

      {novaAberta ? (
        <div className="mt-5 rounded-xl border border-linha bg-cartao px-6 py-6">
          <FormularioRotina hoje={hoje} onPronto={() => setNovaAberta(false)} />
        </div>
      ) : null}

      {inativas > 0 ? (
        <button
          type="button"
          onClick={() => setMostrarInativas((m) => !m)}
          className="mt-5 font-sans text-xs text-vital-fundo transition hover:text-vital"
        >
          {mostrarInativas
            ? "Ocultar as pausadas"
            : `Mostrar ${inativas} ${inativas === 1 ? "pausada" : "pausadas"}`}
        </button>
      ) : null}

      {visiveis.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-linha px-6 py-12 text-center">
          <p className="font-display text-lg text-neutro">
            Nenhuma rotina ativa
          </p>
          <p className="mt-2 font-sans text-sm text-neutro">
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
                  ? "border-linha bg-vital/[0.08]"
                  : "border-linha bg-cartao"
              } ${r.ativa ? "" : "opacity-55"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-tinta">{r.titulo}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 font-sans text-xs">
                    <span className="text-neutro">{r.frequencia}</span>
                    {r.next_due ? (
                      <span
                        className={
                          r.vencida ? "text-vital-fundo" : "text-neutro"
                        }
                      >
                        {r.vencida ? "vence hoje ou antes, " : "próxima em "}
                        {formatarData(r.next_due)}
                      </span>
                    ) : null}
                    {!r.ativa ? (
                      <span className="text-neutro">pausada</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {r.ativa ? (
                    <BotaoConcluir
                      id={r.id}
                      frequencia={r.frequencia}
                      nextDue={r.next_due}
                    />
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
                      className="rounded-md border border-linha px-3 py-1.5 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
                    >
                      {r.ativa ? "Pausar" : "Retomar"}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setEditando(editando === r.id ? null : r.id)}
                    className="rounded-md border border-linha px-3 py-1.5 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
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
                      className="rounded-md border border-argila/35 px-3 py-1.5 font-sans text-xs text-argila transition hover:bg-argila-suave"
                    >
                      Excluir
                    </button>
                  </form>
                </div>
              </div>

              {editando === r.id ? (
                <div className="mt-4 border-t border-linha pt-4">
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
