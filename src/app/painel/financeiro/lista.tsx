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
  "mt-2 rounded-md border border-linha bg-cartao px-3 py-2 font-sans text-sm text-tinta outline-none focus:border-vital";

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
          <span className="block font-sans text-sm text-tinta">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as FiltroTipo)}
            className={seletor}
            aria-label="Filtrar por tipo"
          >
            <option value="todos" className="bg-cartao">Todos</option>
            <option value="receita" className="bg-cartao">Receitas</option>
            <option value="despesa" className="bg-cartao">Despesas</option>
          </select>
        </div>

        <div>
          <span className="block font-sans text-sm text-tinta">Situação</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FiltroStatus)}
            className={seletor}
            aria-label="Filtrar por situação"
          >
            <option value="todos" className="bg-cartao">Todas</option>
            <option value="pago" className="bg-cartao">Pagos</option>
            <option value="pendente" className="bg-cartao">Pendentes</option>
            <option value="atrasado" className="bg-cartao">Atrasados</option>
          </select>
        </div>

        <div>
          <span className="block font-sans text-sm text-tinta">Período</span>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as FiltroPeriodo)}
            className={seletor}
            aria-label="Filtrar por período"
          >
            <option value="mes" className="bg-cartao">Mês atual</option>
            <option value="90" className="bg-cartao">90 dias</option>
            <option value="tudo" className="bg-cartao">Tudo</option>
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
            className="rounded-md border border-argila/35 px-4 py-2 font-sans text-sm text-argila transition hover:bg-argila-suave"
          >
            Ver {atrasadosQtd} {atrasadosQtd === 1 ? "atrasado" : "atrasados"}
          </button>
        ) : null}
      </div>

      <p className="mt-4 font-sans text-xs text-neutro" aria-live="polite">
        {visiveis.length} {visiveis.length === 1 ? "lançamento" : "lançamentos"}
        {visiveis.length > 0 ? `  ·  saldo ${formatarMoeda(soma)}` : ""}
      </p>

      {visiveis.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-linha px-6 py-10 text-center">
          <p className="font-sans text-sm text-neutro">
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
                  ? "border-argila/35 bg-argila-suave"
                  : "border-linha bg-cartao"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-tinta">{l.descricao}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 font-sans text-xs text-neutro">
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
                        ? "text-emerald-700"
                        : "text-mel-tinta"
                    }`}
                  >
                    {l.tipo === "receita" ? "+" : "−"} {formatarMoeda(l.valor)}
                  </span>

                  <span
                    className={`rounded px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${
                      l.atrasado
                        ? "bg-argila-suave text-argila"
                        : l.status === "pendente"
                          ? "bg-vital/10 text-vital-fundo"
                          : "bg-areia text-neutro"
                    }`}
                  >
                    {l.atrasado ? "atrasado" : l.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-linha pt-3">
                {l.status === "pendente" ? (
                  <form action={marcarComoPago}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-600/40 px-3 py-1.5 font-sans text-xs text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Marcar como pago
                    </button>
                  </form>
                ) : null}

                <button
                  type="button"
                  onClick={() => setEditando(editando === l.id ? null : l.id)}
                  className="rounded-md border border-linha px-3 py-1.5 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
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
                    className="rounded-md border border-argila/35 px-3 py-1.5 font-sans text-xs text-argila transition hover:bg-argila-suave"
                  >
                    Excluir
                  </button>
                </form>
              </div>

              {editando === l.id ? (
                <div className="mt-4 border-t border-linha pt-4">
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
