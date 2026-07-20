"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatarData } from "@/lib/formato";
import {
  contarPorStatus,
  normalizar,
  STATUS_CARTEIRA,
  type FiltroStatus,
  type PacienteNaCarteira,
  type Tendencia,
} from "@/lib/carteira";
import { Avatar } from "../marca";
import { Cartao, SeloStatusPaciente, Vazio } from "../ui";
import { arquivarPaciente, excluirPaciente } from "./actions";

type Ordem = "nome" | "resposta" | "nota";

const CLASSE_ACAO =
  "rounded-[10px] border border-linha bg-cartao px-3.5 py-2 font-sans text-[13.5px] text-tinta transition hover:border-vital/50";

function Tendencia({
  tendencia,
  delta,
}: {
  tendencia: Tendencia;
  delta: number | null;
}) {
  if (tendencia === "sem_base" || delta === null) {
    return <span className="font-mono text-[13px] text-tenue">–</span>;
  }
  if (tendencia === "estavel") {
    return <span className="font-mono text-[13px] text-tenue">–</span>;
  }

  const subiu = tendencia === "subiu";

  return (
    <span
      className={`font-mono text-[13px] font-bold ${
        subiu ? "text-emerald-700" : "text-argila"
      }`}
    >
      {subiu ? "▲" : "▼"} {delta > 0 ? "+" : "−"}
      {Math.abs(delta)}
    </span>
  );
}

export function Carteira({
  pacientes,
  botaoNovo,
}: {
  pacientes: PacienteNaCarteira[];
  botaoNovo: React.ReactNode;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("ativo");
  const [objetivo, setObjetivo] = useState("todos");
  const [ordem, setOrdem] = useState<Ordem>("nome");

  const contagem = useMemo(() => contarPorStatus(pacientes), [pacientes]);

  const objetivos = useMemo(() => {
    const set = new Set(
      pacientes.map((p) => p.objetivo).filter((o): o is string => Boolean(o)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [pacientes]);

  const visiveis = useMemo(() => {
    const alvo = normalizar(busca.trim());

    const filtrados = pacientes.filter((p) => {
      if (status !== "todos" && (p.status ?? "ativo") !== status) return false;
      if (objetivo !== "todos" && p.objetivo !== objetivo) return false;

      if (!alvo) return true;
      const campos = [p.full_name, p.objetivo, p.restricao]
        .filter(Boolean)
        .join(" ");
      return normalizar(campos).includes(alvo);
    });

    return [...filtrados].sort((a, b) => {
      if (ordem === "nome") {
        return a.full_name.localeCompare(b.full_name, "pt-BR");
      }
      if (ordem === "nota") {
        // Sem nota vai para o fim, senão os pacientes novos ocupariam
        // o topo da lista ordenada por nota.
        if (a.nota === null && b.nota === null) return 0;
        if (a.nota === null) return 1;
        if (b.nota === null) return -1;
        return b.nota - a.nota;
      }
      const ta = a.ultimoEm ? Date.parse(a.ultimoEm) : -Infinity;
      const tb = b.ultimoEm ? Date.parse(b.ultimoEm) : -Infinity;
      return tb - ta;
    });
  }, [pacientes, busca, status, objetivo, ordem]);

  const seletor =
    "rounded-full border border-linha bg-cartao px-4 py-2.5 font-sans text-[14.5px] text-tinta outline-none focus:border-vital";

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[240px] flex-1 sm:max-w-[360px]">
          <span className="sr-only">Buscar paciente</span>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="#8A7B65"
            strokeWidth="1.8"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, objetivo, tag"
            className="w-full rounded-full border border-linha bg-cartao py-2.5 pl-11 pr-4 font-sans text-[14.5px] text-tinta placeholder:text-neutro outline-none focus:border-vital"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_CARTEIRA.map((s) => {
            const aceso = status === s.chave;
            return (
              <button
                key={s.chave}
                type="button"
                onClick={() => setStatus(s.chave)}
                aria-pressed={aceso}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 font-sans text-[14.5px] transition ${
                  aceso
                    ? "bg-vital font-medium text-white"
                    : "border border-linha bg-cartao text-tinta hover:border-vital/40"
                }`}
              >
                {s.rotulo}
                <span
                  className={`font-mono text-[12px] ${
                    aceso ? "text-white/80" : "text-neutro"
                  }`}
                >
                  {contagem[s.chave]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            aria-label="Filtrar por objetivo"
            className={seletor}
          >
            <option value="todos">Todos os objetivos</option>
            {objetivos.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            aria-label="Ordenar"
            className={seletor}
          >
            <option value="nome">Ordenar: Nome</option>
            <option value="resposta">Ordenar: Última resposta</option>
            <option value="nota">Ordenar: Nota</option>
          </select>
        </div>
      </div>

      {pacientes.length === 0 ? (
        <div className="mt-6">
          <Vazio
            titulo="Nenhum paciente cadastrado ainda"
            texto="Cadastre o primeiro paciente para começar o acompanhamento."
            acao={botaoNovo}
          />
        </div>
      ) : visiveis.length === 0 ? (
        <div className="mt-6">
          <Vazio
            titulo="Nenhum paciente com esses filtros"
            texto="Experimente trocar a aba de status, limpar a busca ou escolher outro objetivo."
          />
        </div>
      ) : (
        <Cartao className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr className="border-b border-linha">
                  <th className="olho px-6 py-4 text-left font-normal">
                    Paciente
                  </th>
                  <th className="olho px-6 py-4 text-left font-normal">
                    Objetivo
                  </th>
                  <th className="olho px-6 py-4 text-left font-normal">
                    Status
                  </th>
                  <th className="olho px-6 py-4 text-left font-normal">
                    Última resposta
                  </th>
                  <th className="olho px-6 py-4 text-left font-normal">Nota</th>
                  <th className="olho px-6 py-4 text-right font-normal">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {visiveis.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/painel/pacientes/${p.id}`)}
                    className="cursor-pointer border-b border-linha transition last:border-0 hover:bg-areia-clara/45"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <Avatar nome={p.full_name} />
                        <div className="min-w-0">
                          <p className="font-sans text-[16px] font-semibold text-tinta">
                            {p.full_name}
                          </p>
                          <p className="mt-0.5 font-mono text-[12.5px] text-neutro">
                            {p.restricao || "Nenhuma"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-sans text-[15.5px] text-tinta">
                        {p.objetivo || "Sem objetivo"}
                      </p>
                      <p className="mt-0.5 font-sans text-[13.5px] text-neutro">
                        {[p.plano_nome, p.plano_duracao]
                          .filter(Boolean)
                          .join(" ") || "Sem plano"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <SeloStatusPaciente status={p.status ?? "ativo"} />
                    </td>

                    <td className="px-6 py-4 font-sans text-[15px] text-tinta">
                      {p.ultimoEm ? (
                        formatarData(p.ultimoEm)
                      ) : (
                        <span className="text-tenue">–</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-[16px] font-bold text-tinta">
                          {p.nota ?? <span className="text-tenue">–</span>}
                        </span>
                        {p.nota !== null ? (
                          <Tendencia tendencia={p.tendencia} delta={p.delta} />
                        ) : null}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {/* O clique nas ações não deve abrir a ficha. */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex justify-end gap-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/painel/pacientes/${p.id}/editar`)
                          }
                          className={CLASSE_ACAO}
                        >
                          Editar
                        </button>

                        <form action={arquivarPaciente}>
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              p.status === "arquivado" ? "ativo" : "arquivado"
                            }
                          />
                          <button type="submit" className={CLASSE_ACAO}>
                            {p.status === "arquivado" ? "Reativar" : "Arquivar"}
                          </button>
                        </form>

                        <form action={excluirPaciente}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              const ok = window.confirm(
                                `Excluir ${p.full_name}? Os check-ins e links dele vão junto, e a ação não pode ser desfeita. Para apenas tirar da lista, use Arquivar.`,
                              );
                              if (!ok) e.preventDefault();
                            }}
                            className="rounded-[10px] border border-argila/35 bg-cartao px-3.5 py-2 font-sans text-[13.5px] text-argila transition hover:bg-argila-suave"
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>
      )}

      {visiveis.length > 0 ? (
        <p className="mt-4 font-mono text-[12.5px] text-neutro">
          {visiveis.length} de {pacientes.length} paciente(s)
        </p>
      ) : null}
    </>
  );
}
