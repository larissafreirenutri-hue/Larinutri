"use client";

import { useEffect, useState } from "react";
import { formatarData } from "@/lib/formato";
import {
  SECOES_ANAMNESE,
  statusEfetivoAnamnese,
  type Anamnese,
  type AnamneseLink,
  type Pergunta,
} from "@/lib/anamnese";
import { SeloLink, Vazio, CLASSE_BOTAO_SECUNDARIO } from "../../ui";
import {
  gerarAnamnese,
  marcarAnamneseEnviada,
} from "../anamnese-actions";

function valorLegivel(p: Pergunta, respostas: Record<string, unknown>) {
  const bruto = respostas[p.chave];

  if (p.tipo === "multipla") {
    const lista = Array.isArray(bruto)
      ? bruto.filter((x): x is string => typeof x === "string")
      : [];
    const outro = respostas[`${p.chave}_outro`];
    const partes = lista.map((x) =>
      x === "Outro" && typeof outro === "string" ? `Outro: ${outro}` : x,
    );
    return partes.length > 0 ? partes.join(", ") : null;
  }

  if (p.tipo === "unica") {
    const outro = respostas[`${p.chave}_outro`];
    if (bruto === "Outro" && typeof outro === "string") return `Outro: ${outro}`;
    return typeof bruto === "string" && bruto ? bruto : null;
  }

  if (p.tipo === "escala") {
    return typeof bruto === "number" ? `${bruto} de ${p.max ?? 10}` : null;
  }

  if (p.tipo === "data") {
    return typeof bruto === "string" && bruto ? formatarData(bruto) : null;
  }

  return typeof bruto === "string" && bruto.trim() ? bruto : null;
}

function CopiarAnamnese({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    const url = `${window.location.origin}/anamnese/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      window.prompt("Copie o link da anamnese:", url);
    }
  }

  return (
    <button type="button" onClick={copiar} className={CLASSE_BOTAO_SECUNDARIO}>
      {copiado ? "Copiado" : "Copiar link"}
    </button>
  );
}

export function AbaAnamnese({
  patientId,
  anamnese,
  link,
  agora,
}: {
  patientId: string;
  anamnese: Anamnese | null;
  link: AnamneseLink | null;
  agora: number;
}) {
  const status = link ? statusEfetivoAnamnese(link, agora) : null;

  // Já respondida: mostra as respostas por seção.
  if (anamnese) {
    const respostas = anamnese.respostas;

    return (
      <div className="mt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-sans text-[14px] text-neutro">
            Respondida em {formatarData(anamnese.created_at)}
          </p>
          <form action={gerarAnamnese}>
            <input type="hidden" name="patient_id" value={patientId} />
            <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
              Gerar nova anamnese
            </button>
          </form>
        </div>

        <div className="space-y-5">
          {SECOES_ANAMNESE.map((secao) => {
            const respondidas = secao.perguntas
              .map((p) => ({ p, valor: valorLegivel(p, respostas) }))
              .filter((x) => x.valor !== null);

            if (respondidas.length === 0) return null;

            return (
              <section
                key={secao.chave}
                className="rounded-[18px] border border-linha bg-cartao shadow-cartao"
              >
                <header className="border-b border-linha px-6 py-4">
                  <h3 className="font-display text-[19px] text-barra">
                    {secao.titulo}
                  </h3>
                </header>
                <dl className="px-6 py-2">
                  {respondidas.map(({ p, valor }) => (
                    <div
                      key={p.chave}
                      className="border-b border-linha py-3.5 last:border-0"
                    >
                      <dt className="font-sans text-[13px] font-semibold text-neutro">
                        {p.rotulo}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-tinta">
                        {valor}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  // Existe link, mas ainda sem resposta.
  if (link && status !== "expirado") {
    return (
      <div className="mt-6">
        <div className="rounded-[18px] border border-linha bg-cartao px-6 py-6 shadow-cartao">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="olho">Anamnese</p>
              <p className="mt-1.5 font-sans text-[15px] text-tinta">
                Link {status === "enviado" ? "enviado" : "gerado"}, aguardando a
                resposta do paciente.
              </p>
            </div>
            <SeloLink status={status ?? "gerado"} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-linha pt-5">
            <CopiarAnamnese token={link.token} />
            <a
              href={`/anamnese/${link.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className={CLASSE_BOTAO_SECUNDARIO}
            >
              Ver
            </a>
            {link.status === "gerado" ? (
              <form action={marcarAnamneseEnviada}>
                <input type="hidden" name="id" value={link.id} />
                <input type="hidden" name="patient_id" value={patientId} />
                <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
                  Marcar enviado
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Nenhuma anamnese e nenhum link ativo.
  return (
    <div className="mt-6">
      <Vazio
        titulo="Nenhuma anamnese ainda"
        texto="Gere o link da anamnese inicial e envie para o paciente. É o formulário que dá a base de todo o plano."
        acao={
          <form action={gerarAnamnese}>
            <input type="hidden" name="patient_id" value={patientId} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-vital px-5 py-2.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105"
            >
              Gerar anamnese
            </button>
          </form>
        }
      />
    </div>
  );
}
