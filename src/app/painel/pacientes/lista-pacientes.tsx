"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PacienteComResumo } from "@/lib/pacientes";
import { formatarData, formatarPeso } from "@/lib/formato";
import { BotaoCopiarLink } from "./botao-copiar-link";
import { Variacao, SeloNovo } from "./indicadores";

type Ordem = "recentes" | "nome";

/** Remove acentos para a busca casar "Joao" com "João". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function ListaPacientes({
  pacientes,
}: {
  pacientes: PacienteComResumo[];
}) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  const visiveis = useMemo(() => {
    const alvo = normalizar(busca.trim());

    const filtrados = alvo
      ? pacientes.filter((p) => normalizar(p.full_name).includes(alvo))
      : pacientes;

    return [...filtrados].sort((a, b) => {
      if (ordem === "nome") {
        return a.full_name.localeCompare(b.full_name, "pt-BR");
      }
      // Quem nunca respondeu vai para o fim da lista.
      const ta = a.resumo.ultimoEm ? Date.parse(a.resumo.ultimoEm) : -Infinity;
      const tb = b.resumo.ultimoEm ? Date.parse(b.resumo.ultimoEm) : -Infinity;
      return tb - ta;
    });
  }, [pacientes, busca, ordem]);

  if (pacientes.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-dashed border-dourado/25 px-6 py-12 text-center">
        <p className="font-display text-lg text-creme/70">
          Nenhum paciente cadastrado ainda
        </p>
        <p className="mt-2 font-sans text-sm text-creme/50">
          Use o botão Adicionar paciente para começar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div className="min-w-56 flex-1">
          <label htmlFor="busca" className="block font-sans text-sm text-creme/80">
            Buscar
          </label>
          <input
            id="busca"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome do paciente"
            className="mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme placeholder:text-creme/35 outline-none focus:border-dourado focus:ring-1 focus:ring-dourado"
          />
        </div>

        <div>
          <label htmlFor="ordem" className="block font-sans text-sm text-creme/80">
            Ordenar por
          </label>
          <select
            id="ordem"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="mt-2 rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme outline-none focus:border-dourado focus:ring-1 focus:ring-dourado"
          >
            <option value="recentes" className="bg-marrom">
              Último check-in
            </option>
            <option value="nome" className="bg-marrom">
              Nome
            </option>
          </select>
        </div>
      </div>

      <p className="mt-4 font-sans text-xs text-creme/45" aria-live="polite">
        {visiveis.length}{" "}
        {visiveis.length === 1 ? "paciente" : "pacientes"}
        {busca.trim() ? ` para "${busca.trim()}"` : ""}
      </p>

      {visiveis.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-dourado/25 px-6 py-10 text-center">
          <p className="font-sans text-sm text-creme/60">
            Nenhum paciente encontrado com esse nome.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visiveis.map(({ resumo, ...paciente }) => (
            <li
              key={paciente.id}
              className="rounded-xl border border-dourado/20 bg-creme/5 px-5 py-4 transition hover:border-dourado/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/painel/pacientes/${paciente.id}`}
                      className="font-display text-lg text-creme transition hover:text-dourado"
                    >
                      {paciente.full_name}
                    </Link>
                    {resumo.recente ? <SeloNovo /> : null}
                  </div>

                  <p className="mt-1 font-sans text-xs text-creme/45">
                    {resumo.ultimoEm
                      ? `Último check-in em ${formatarData(resumo.ultimoEm)}`
                      : "Ainda sem check-in"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <BotaoCopiarLink token={paciente.access_token} />
                  <Link
                    href={`/painel/pacientes/${paciente.id}`}
                    className="rounded-md border border-dourado/40 px-3 py-1.5 font-sans text-xs text-dourado transition hover:bg-dourado/10"
                  >
                    Abrir
                  </Link>
                </div>
              </div>

              <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-3 border-t border-dourado/10 pt-3">
                <div>
                  <dt className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
                    Peso atual
                  </dt>
                  <dd className="mt-0.5 font-sans text-sm tabular-nums text-creme/90">
                    {formatarPeso(resumo.pesoAtual) ?? (
                      <span className="text-creme/35">sem medida</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
                    Variação
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    <Variacao
                      valor={resumo.variacao}
                      tendencia={resumo.tendencia}
                    />
                  </dd>
                </div>

                <div>
                  <dt className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
                    Check-ins
                  </dt>
                  <dd className="mt-0.5 font-sans text-sm tabular-nums text-creme/90">
                    {resumo.totalCheckins}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
