"use client";

import { useMemo, useState } from "react";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { chaveMes, dataEfetiva, type LancamentoNaLista } from "@/lib/financeiro";
import { FormularioLancamento } from "./formulario-lancamento";
import { marcarComoPago, excluirLancamento } from "./actions";

type FiltroTipo = "todos" | "receita" | "despesa";
type FiltroStatus = "todos" | "pago" | "pendente" | "atrasado";
type FiltroPeriodo = "mes" | "90" | "tudo";

const DIA = 24 * 60 * 60 * 1000;

const seletor =
  "mt-2 rounded-md border border-dourado/30 bg-creme/5 px-3 py-2 font-sans text-sm text-creme outline-none focus:border-dourado";

export function Lista({
  lancamentos,
  pacientes,
  hoje,
  mesAtual,
  agora,
  atrasadosQtd,
}: {
  lancamentos: LancamentoNaLista[];
  pacientes: { id: string; full_name: string }[];
  hoje: string;
  mesAtual: string;
  agora: number;
  atrasadosQtd: number;
}) {
  const [tipo, setTipo] = useState<FiltroTipo>("todos");
  const [status, setStatus] = useState<FiltroStatus>("todos");
  const [periodo, setPeriodo] = useState<FiltroPeriodo>("mes");
  const [editando, setEditando] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    return lancamentos.filter((l) => {
      if (tipo !== "todos" && l.tipo !== tipo) return false;

      if (status === "atrasado" && !l.atrasado) return false;
      if (status === "pago" && l.status !== "pago") return false;
      if (status === "pendente" && l.status !== "pendente") return false;

      if (periodo === "mes") {
        // Pendentes ficam visíveis sempre, senão uma conta a receber
        // some da tela e ninguém cobra.
        if (l.status === "pendente") return true;
        return chaveMes(dataEfetiva(l)) === mesAtual;
      }
      if (periodo === "90") {
        if (l.status === "pendente") return true;
        return Date.parse(dataEfetiva(l)) >= agora - 90 * DIA;
      }
      return true;
    });
  }, [lancamentos, tipo, status, periodo, mesAtual, agora]);

  const soma = visiveis.reduce(
    (acc, l) => acc + (l.tipo === "receita" ? l.valor : -l.valor),
    0,
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <span className="block font-sans text-sm text-creme/80">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as FiltroTipo)}
            className={seletor}
            aria-label="Filtrar por tipo"
          >
            <option value="todos" className="bg-marrom">Todos</option>
            <option value="receita" className="bg-marrom">Receitas</option>
            <option value="despesa" className="bg-marrom">Despesas</option>
          </select>
        </div>

        <div>
          <span className="block font-sans text-sm text-creme/80">Situação</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FiltroStatus)}
            className={seletor}
            aria-label="Filtrar por situação"
          >
            <option value="todos" className="bg-marrom">Todas</option>
            <option value="pago" className="bg-marrom">Pagos</option>
            <option value="pendente" className="bg-marrom">Pendentes</option>
            <option value="atrasado" className="bg-marrom">Atrasados</option>
          </select>
        </div>

        <div>
          <span className="block font-sans text-sm text-creme/80">Período</span>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as FiltroPeriodo)}
            className={seletor}
            aria-label="Filtrar por período"
          >
            <option value="mes" className="bg-marrom">Mês atual</option>
            <option value="90" className="bg-marrom">90 dias</option>
            <option value="tudo" className="bg-marrom">Tudo</option>
          </select>
        </div>

        {atrasadosQtd > 0 ? (
          <button
            type="button"
            onClick={() => {
              setStatus("atrasado");
              setTipo("todos");
              setPeriodo("tudo");
            }}
            className="rounded-md border border-red-300/40 px-4 py-2 font-sans text-sm text-red-200 transition hover:bg-red-900/25"
          >
            Ver {atrasadosQtd} {atrasadosQtd === 1 ? "atrasado" : "atrasados"}
          </button>
        ) : null}
      </div>

      <p className="mt-4 font-sans text-xs text-creme/45" aria-live="polite">
        {visiveis.length} {visiveis.length === 1 ? "lançamento" : "lançamentos"}
        {visiveis.length > 0 ? `  ·  saldo ${formatarMoeda(soma)}` : ""}
      </p>

      {visiveis.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-dourado/25 px-6 py-10 text-center">
          <p className="font-sans text-sm text-creme/55">
            Nenhum lançamento com esses filtros.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {visiveis.map((l) => (
            <li
              key={l.id}
              className={`rounded-xl border px-5 py-4 ${
                l.atrasado
                  ? "border-red-300/40 bg-red-900/15"
                  : "border-dourado/20 bg-creme/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-creme">{l.descricao}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 font-sans text-xs text-creme/45">
                    <span>
                      {l.status === "pendente" && l.vencimento
                        ? `vence ${formatarData(l.vencimento)}`
                        : formatarData(dataEfetiva(l))}
                    </span>
                    {l.patients ? <span>{l.patients.full_name}</span> : null}
                    {l.categoria ? <span>{l.categoria}</span> : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`font-sans text-sm font-medium tabular-nums ${
                      l.tipo === "receita"
                        ? "text-emerald-200"
                        : "text-amber-200"
                    }`}
                  >
                    {l.tipo === "receita" ? "+" : "−"} {formatarMoeda(l.valor)}
                  </span>

                  <span
                    className={`rounded px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${
                      l.atrasado
                        ? "bg-red-400/20 text-red-200"
                        : l.status === "pendente"
                          ? "bg-dourado/20 text-dourado"
                          : "bg-creme/10 text-creme/50"
                    }`}
                  >
                    {l.atrasado ? "atrasado" : l.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dourado/10 pt-3">
                {l.status === "pendente" ? (
                  <form action={marcarComoPago}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-300/40 px-3 py-1.5 font-sans text-xs text-emerald-200 transition hover:bg-emerald-400/10"
                    >
                      Marcar como pago
                    </button>
                  </form>
                ) : null}

                <button
                  type="button"
                  onClick={() => setEditando(editando === l.id ? null : l.id)}
                  className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                >
                  {editando === l.id ? "Fechar" : "Editar"}
                </button>

                <form action={excluirLancamento}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    onClick={(e) => {
                      const ok = window.confirm(
                        `Excluir o lançamento ${l.descricao}? Esta ação não pode ser desfeita.`,
                      );
                      if (!ok) e.preventDefault();
                    }}
                    className="rounded-md border border-red-300/30 px-3 py-1.5 font-sans text-xs text-red-200 transition hover:bg-red-900/25"
                  >
                    Excluir
                  </button>
                </form>
              </div>

              {editando === l.id ? (
                <div className="mt-4 border-t border-dourado/15 pt-4">
                  <FormularioLancamento
                    lancamento={l}
                    pacientes={pacientes}
                    hoje={hoje}
                    onPronto={() => setEditando(null)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
