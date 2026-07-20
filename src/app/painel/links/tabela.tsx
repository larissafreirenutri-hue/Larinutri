"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatarData } from "@/lib/formato";
import { statusEfetivo, type CheckinLink } from "@/lib/links";
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
  type EstadoLink,
} from "./actions";

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

  const escolhido = pacientes.find((p) => p.id === pacienteId);
  const expirados = links.filter(
    (l) => statusEfetivo(l, agora) === "expirado",
  ).length;

  return (
    <>
      <Cartao className="mt-8 px-6 py-6">
        <p className="max-w-2xl font-sans text-[15px] leading-relaxed text-neutro">
          Escolha o paciente e gere o link único e individual do check-in desta
          semana. Cada link é tokenizado, expira em 7 dias e só pode ser
          respondido uma vez.
        </p>

        {pacientes.length === 0 ? (
          <p className="mt-5 font-sans text-sm text-neutro">
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
            className="mt-4 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
          >
            {estado.erro}
          </p>
        ) : null}
      </Cartao>

      <Cartao className="mt-6 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-linha px-6 py-5">
          <h2 className="font-display text-[21px] text-barra">Links gerados</h2>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-neutro">
              {links.length} no total
            </span>
            {expirados > 0 ? (
              <form action={limparExpirados}>
                <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
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
              texto="Use o formulário acima para gerar o primeiro link de check-in."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-linha">
                  {["Paciente", "Token", "Status", "Gerado", "Expira", ""].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className="olho px-6 py-3 text-left font-normal"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {links.map((link) => {
                  const status = statusEfetivo(link, agora);

                  return (
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
                        <SeloLink status={status} />
                      </td>

                      <td className="px-6 py-4 font-mono text-[13px] text-neutro">
                        {formatarData(link.gerado_em)}
                      </td>

                      <td className="px-6 py-4 font-mono text-[13px] text-neutro">
                        {formatarData(link.expira_em)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {link.status === "gerado" ? (
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
                              className="inline-flex items-center rounded-xl border border-transparent px-3 py-2.5 font-sans text-[14px] text-argila transition hover:bg-argila-suave"
                            >
                              Apagar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}
