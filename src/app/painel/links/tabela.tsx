"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatarData } from "@/lib/formato";
import { statusEfetivo, STATUS_LINK, type CheckinLink } from "@/lib/links";
import { Avatar } from "../marca";
import {
  Cartao,
  SeloLink,
  BotaoPrimario,
  CLASSE_BOTAO_SECUNDARIO,
  CLASSE_CAMPO,
  CLASSE_ROTULO,
  Vazio,
} from "../ui";
import {
  gerarLink,
  marcarEnviado,
  excluirLink,
  limparExpirados,
  novoLinkDaSemanaSeguinte,
  type EstadoLink,
} from "./actions";

const LEGENDA = [
  { chave: "gerado", rotulo: "Gerado", texto: "criado, ainda não enviado" },
  { chave: "enviado", rotulo: "Enviado", texto: "com o paciente, aguardando" },
  { chave: "respondido", rotulo: "Respondido", texto: "resposta no sistema" },
  { chave: "expirado", rotulo: "Expirado", texto: "passou dos 7 dias" },
] as const;

function BotaoGerar() {
  const { pending } = useFormStatus();
  return (
    <BotaoPrimario type="submit" disabled={pending}>
      {pending ? "Gerando..." : "Gerar link da semana"}
    </BotaoPrimario>
  );
}

function Copiar({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    const url = `${window.location.origin}/checkin/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      // clipboard exige contexto seguro. Sem ele, mostra para copiar à mão.
      window.prompt("Copie o link de check-in:", url);
    }
  }

  return (
    <button type="button" onClick={copiar} className={CLASSE_BOTAO_SECUNDARIO}>
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

export function Links({
  pacientes,
  links,
  agora,
}: {
  pacientes: { id: string; full_name: string; proxima: number }[];
  links: CheckinLink[];
  agora: number;
}) {
  const [estado, acao] = useActionState<EstadoLink, FormData>(gerarLink, {});
  const [pacienteId, setPacienteId] = useState(pacientes[0]?.id ?? "");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPaciente, setFiltroPaciente] = useState("todos");

  const escolhido = pacientes.find((p) => p.id === pacienteId);

  // O status guardado no banco nunca vira expirado sozinho, então o
  // efetivo é calculado aqui, comparando com a data de expiração.
  const comStatus = useMemo(
    () => links.map((l) => ({ ...l, efetivo: statusEfetivo(l, agora) })),
    [links, agora],
  );

  const expirados = comStatus.filter((l) => l.efetivo === "expirado").length;

  const visiveis = useMemo(
    () =>
      comStatus.filter((l) => {
        if (filtroStatus !== "todos" && l.efetivo !== filtroStatus) return false;
        if (filtroPaciente !== "todos" && l.patient_id !== filtroPaciente)
          return false;
        return true;
      }),
    [comStatus, filtroStatus, filtroPaciente],
  );

  const seletor =
    "rounded-full border border-linha bg-cartao px-4 py-2.5 font-sans text-[14.5px] text-tinta outline-none focus:border-vital";

  return (
    <>
      <Cartao className="mt-8 px-6 py-6">
        <p className="max-w-2xl font-sans text-[15px] leading-relaxed text-neutro">
          Escolha o paciente e gere o link único e individual do check-in desta
          semana. Cada link é tokenizado, expira em 7 dias e só pode ser
          respondido uma vez.
        </p>

        {pacientes.length === 0 ? (
          <p className="mt-5 font-sans text-[14.5px] text-neutro">
            Cadastre um paciente antes de gerar links.
          </p>
        ) : (
          <form action={acao} className="mt-5 flex flex-wrap items-end gap-3">
            <div className="min-w-56">
              <label htmlFor="patient_id" className={CLASSE_ROTULO}>
                Paciente
              </label>
              <select
                id="patient_id"
                name="patient_id"
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className={CLASSE_CAMPO}
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} · semana {p.proxima}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <label htmlFor="semana" className={CLASSE_ROTULO}>
                Semana
              </label>
              <input
                id="semana"
                name="semana"
                type="number"
                min={1}
                // A chave força o campo a acompanhar a troca de paciente,
                // senão a semana sugerida ficaria travada na primeira.
                key={escolhido?.id}
                defaultValue={escolhido?.proxima ?? 1}
                className={CLASSE_CAMPO}
              />
            </div>

            <BotaoGerar />
          </form>
        )}

        {estado.erro ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-[14px] text-argila"
          >
            {estado.erro}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-linha pt-5">
          {LEGENDA.map((l) => (
            <span key={l.chave} className="flex items-center gap-2">
              <SeloLink status={l.chave} />
              <span className="font-sans text-[13px] text-neutro">
                {l.texto}
              </span>
            </span>
          ))}
        </div>
      </Cartao>

      <Cartao className="mt-6 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-linha px-6 py-5">
          <h2 className="font-display text-[21px] text-barra">Links gerados</h2>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[12.5px] text-neutro">
              {links.length} no total
            </span>

            {links.length > 0 ? (
              <>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  aria-label="Filtrar por status"
                  className={seletor}
                >
                  <option value="todos">Todos os status</option>
                  {STATUS_LINK.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroPaciente}
                  onChange={(e) => setFiltroPaciente(e.target.value)}
                  aria-label="Filtrar por paciente"
                  className={seletor}
                >
                  <option value="todos">Todos os pacientes</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            {expirados > 0 ? (
              <form action={limparExpirados}>
                <button
                  type="submit"
                  onClick={(e) => {
                    const ok = window.confirm(
                      `Apagar ${expirados} link(s) expirado(s)? Eles já não podem ser respondidos, e a ação não pode ser desfeita.`,
                    );
                    if (!ok) e.preventDefault();
                  }}
                  className={CLASSE_BOTAO_SECUNDARIO}
                >
                  Limpar expirados
                </button>
              </form>
            ) : null}
          </div>
        </header>

        {links.length === 0 ? (
          <div className="px-6 py-4">
            <Vazio
              titulo="Nenhum link gerado ainda"
              texto="Use o formulário acima para gerar o primeiro link de check-in e enviar para um paciente."
            />
          </div>
        ) : visiveis.length === 0 ? (
          <div className="px-6 py-4">
            <Vazio
              titulo="Nenhum link com esses filtros"
              texto="Experimente trocar o status ou o paciente selecionado."
            />
          </div>
        ) : (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-linha">
                  <th className="olho px-6 py-3.5 text-left font-normal">
                    Paciente
                  </th>
                  <th className="olho px-6 py-3.5 text-left font-normal">
                    Token
                  </th>
                  <th className="olho px-6 py-3.5 text-left font-normal">
                    Status
                  </th>
                  <th className="olho px-6 py-3.5 text-left font-normal">
                    Gerado
                  </th>
                  <th className="olho px-6 py-3.5 text-left font-normal">
                    Expira
                  </th>
                  <th className="olho px-6 py-3.5 text-right font-normal">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {visiveis.map((link) => (
                  <tr
                    key={link.id}
                    className="border-b border-linha last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          nome={link.patients?.full_name ?? "?"}
                          tamanho="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-sans text-[15px] font-semibold text-tinta">
                            {link.patients?.full_name ?? "Paciente removido"}
                          </p>
                          <p className="font-mono text-[12px] text-neutro">
                            semana {link.semana ?? "sem número"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-[13px] text-neutro">
                      {link.token}
                    </td>

                    <td className="px-6 py-4">
                      <SeloLink status={link.efetivo} />
                    </td>

                    <td className="px-6 py-4 font-mono text-[13px] text-neutro">
                      {formatarData(link.gerado_em)}
                    </td>

                    <td className="px-6 py-4 font-mono text-[13px] text-neutro">
                      {formatarData(link.expira_em)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {link.status === "gerado" &&
                        link.efetivo !== "expirado" ? (
                          <form action={marcarEnviado}>
                            <input type="hidden" name="id" value={link.id} />
                            <button
                              type="submit"
                              className={CLASSE_BOTAO_SECUNDARIO}
                            >
                              Marcar enviado
                            </button>
                          </form>
                        ) : null}

                        <Copiar token={link.token} />

                        <a
                          href={`/checkin/${link.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={CLASSE_BOTAO_SECUNDARIO}
                        >
                          Ver
                        </a>

                        <form action={novoLinkDaSemanaSeguinte}>
                          <input
                            type="hidden"
                            name="patient_id"
                            value={link.patient_id}
                          />
                          <button
                            type="submit"
                            title="Gera o link da próxima semana para este paciente"
                            className={CLASSE_BOTAO_SECUNDARIO}
                          >
                            Novo
                          </button>
                        </form>

                        <form action={excluirLink}>
                          <input type="hidden" name="id" value={link.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              const ok = window.confirm(
                                `Apagar o link de ${link.patients?.full_name ?? "este paciente"}? Se ele já foi enviado, o paciente não vai mais conseguir responder.`,
                              );
                              if (!ok) e.preventDefault();
                            }}
                            className="inline-flex items-center rounded-xl border border-transparent px-3.5 py-2.5 font-sans text-[14px] text-argila transition hover:bg-argila-suave"
                          >
                            Apagar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No celular a tabela viraria 900px de rolagem lateral. */}
        {visiveis.length > 0 ? (
          <ul className="divide-y divide-linha md:hidden">
            {visiveis.map((link) => (
              <li key={link.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      nome={link.patients?.full_name ?? "?"}
                      tamanho="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[15px] font-semibold text-tinta">
                        {link.patients?.full_name ?? "Paciente removido"}
                      </p>
                      <p className="font-mono text-[12px] text-neutro">
                        semana {link.semana ?? "sem número"}
                      </p>
                    </div>
                  </div>
                  <SeloLink status={link.efetivo} />
                </div>

                <p className="mt-3 break-all font-mono text-[12.5px] text-neutro">
                  {link.token}
                </p>
                <p className="mt-1 font-mono text-[12px] text-tenue">
                  gerado {formatarData(link.gerado_em)} · expira{" "}
                  {formatarData(link.expira_em)}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  {link.status === "gerado" && link.efetivo !== "expirado" ? (
                    <form action={marcarEnviado}>
                      <input type="hidden" name="id" value={link.id} />
                      <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
                        Marcar enviado
                      </button>
                    </form>
                  ) : null}

                  <Copiar token={link.token} />

                  <a
                    href={`/checkin/${link.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CLASSE_BOTAO_SECUNDARIO}
                  >
                    Ver
                  </a>

                  <form action={novoLinkDaSemanaSeguinte}>
                    <input
                      type="hidden"
                      name="patient_id"
                      value={link.patient_id}
                    />
                    <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
                      Novo
                    </button>
                  </form>

                  <form action={excluirLink}>
                    <input type="hidden" name="id" value={link.id} />
                    <button
                      type="submit"
                      onClick={(e) => {
                        const ok = window.confirm(
                          `Apagar o link de ${link.patients?.full_name ?? "este paciente"}? Se ele já foi enviado, o paciente não vai mais conseguir responder.`,
                        );
                        if (!ok) e.preventDefault();
                      }}
                      className="inline-flex items-center rounded-xl border border-argila/35 px-3.5 py-2.5 font-sans text-[14px] text-argila transition hover:bg-argila-suave"
                    >
                      Apagar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Cartao>

      {visiveis.length > 0 && visiveis.length !== links.length ? (
        <p className="mt-4 font-mono text-[12.5px] text-neutro">
          {visiveis.length} de {links.length} link(s)
        </p>
      ) : null}
    </>
  );
}
