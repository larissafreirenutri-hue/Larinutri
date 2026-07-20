import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  paraCampoData,
} from "@/lib/formato";
import { agora } from "@/lib/visao-geral";
import {
  ETAPA_GANHO,
  ETAPAS_FINAIS,
  type Interacao,
  type Lead,
} from "@/lib/vendas";
import { FormularioLead } from "../formulario-lead";
import { NovaInteracao } from "./interacoes";
import { ExcluirLead, TransformarEmPaciente } from "./acoes-lead";
import { excluirInteracao } from "../actions";

export const metadata: Metadata = {
  title: "Lead, Larissa Freire Nutricionista",
};

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dadosLead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // RLS devolve zero linhas para lead de outra nutricionista,
  // então vira 404 sem revelar que o registro existe.
  if (!dadosLead) {
    notFound();
  }

  const lead = dadosLead as Lead;

  const { data: dadosInteracoes } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", id)
    .order("occurred_at", { ascending: false });

  const interacoes = (dadosInteracoes ?? []) as Interacao[];
  const hoje = paraCampoData(new Date(agora()).toISOString());
  const final = ETAPAS_FINAIS.includes(lead.etapa);

  return (
    <>
      <header className="border-b border-dourado/15 pb-6">
        <Link
          href="/painel/vendas"
          className="font-sans text-sm text-dourado transition hover:text-dourado/80"
        >
          ← Voltar ao funil
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl text-creme">{lead.nome}</h1>
            <p className="mt-2 font-sans text-sm text-creme/55">
              {[lead.phone, lead.email].filter(Boolean).join("  ·  ") ||
                "Sem contato cadastrado"}
            </p>
          </div>

          <ExcluirLead id={lead.id} nome={lead.nome} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span
            className={`rounded-md border px-3 py-1.5 font-sans text-xs ${
              lead.etapa === ETAPA_GANHO
                ? "border-emerald-300/40 text-emerald-200"
                : final
                  ? "border-creme/20 text-creme/55"
                  : "border-dourado/40 text-dourado"
            }`}
          >
            {lead.etapa}
          </span>

          {lead.valor !== null ? (
            <span className="font-sans text-sm tabular-nums text-creme/80">
              {formatarMoeda(lead.valor)}
            </span>
          ) : null}

          {lead.origem ? (
            <span className="font-sans text-xs text-creme/45">
              via {lead.origem}
            </span>
          ) : null}

          <span className="font-sans text-xs text-creme/35">
            criado em {formatarData(lead.created_at)}
          </span>
        </div>
      </header>

      {lead.patient_id ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-300/30 bg-emerald-400/[0.07] px-5 py-4">
          <p className="font-sans text-sm text-emerald-100">
            Este lead já virou paciente.
          </p>
          <Link
            href={`/painel/pacientes/${lead.patient_id}`}
            className="rounded-md border border-emerald-300/40 px-4 py-2 font-sans text-xs text-emerald-200 transition hover:bg-emerald-400/10"
          >
            Abrir a ficha do paciente
          </Link>
        </div>
      ) : lead.etapa === ETAPA_GANHO ? (
        <section className="mt-8 rounded-xl border border-emerald-300/30 bg-emerald-400/[0.07] px-5 py-5">
          <h2 className="font-display text-lg text-emerald-100">
            Negócio fechado
          </h2>
          <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-creme/70">
            Crie a ficha de paciente para começar o acompanhamento e gerar o
            link de check-in.
          </p>
          <div className="mt-4">
            <TransformarEmPaciente id={lead.id} nome={lead.nome} />
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl text-dourado">Dados do lead</h2>
        <div className="mt-5 rounded-xl border border-dourado/25 bg-creme/5 px-6 py-6">
          <FormularioLead lead={lead} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-dourado">Nova interação</h2>
        <div className="mt-5 rounded-xl border border-dourado/25 bg-creme/5 px-6 py-6">
          <NovaInteracao leadId={lead.id} hoje={hoje} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-dourado">Histórico</h2>
          {interacoes.length > 0 ? (
            <span className="font-sans text-xs text-creme/45">
              {interacoes.length}{" "}
              {interacoes.length === 1 ? "registro" : "registros"}
            </span>
          ) : null}
        </div>

        {interacoes.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-dourado/25 px-6 py-10 text-center">
            <p className="font-sans text-sm text-creme/55">
              Nenhuma interação registrada ainda.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {interacoes.map((interacao) => (
              <li
                key={interacao.id}
                className="rounded-lg border border-dourado/20 bg-creme/5 px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    {interacao.tipo ? (
                      <span className="rounded border border-dourado/30 px-2 py-0.5 font-sans text-[11px] text-dourado">
                        {interacao.tipo}
                      </span>
                    ) : null}
                    <span className="font-sans text-xs text-creme/45">
                      {formatarDataHora(interacao.occurred_at)}
                    </span>
                  </div>

                  <form action={excluirInteracao}>
                    <input type="hidden" name="id" value={interacao.id} />
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <button
                      type="submit"
                      className="font-sans text-xs text-creme/35 transition hover:text-red-200"
                    >
                      Remover
                    </button>
                  </form>
                </div>

                {interacao.descricao ? (
                  <p className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-creme/80">
                    {interacao.descricao}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
