import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/formato";
import { agora } from "@/lib/visao-geral";
import {
  resumirVendas,
  ETAPAS_FINAIS,
  ETAPA_GANHO,
  type Lead,
} from "@/lib/vendas";
import { CabecalhoArea } from "../cabecalho-area";
import { Kpi } from "../pacientes/indicadores";
import { Quadro } from "./quadro";
import { NovoLead } from "./formulario-lead";

export const metadata: Metadata = {
  title: "Vendas, Larissa Freire Nutricionista",
};

export default async function VendasPage() {
  const supabase = await createClient();

  // O RLS limita o retorno aos leads desta nutricionista.
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const resumo = resumirVendas(leads, agora());

  const maiorEtapa = Math.max(1, ...resumo.porEtapa.map((e) => e.quantidade));

  return (
    <>
      <CabecalhoArea
        titulo="Vendas"
        apoio="Acompanhe cada contato desde o primeiro alô até virar paciente."
      />

      {error ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar os leads. {error.message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          rotulo="Em negociação"
          valor={resumo.emNegociacao}
          rodape="leads em aberto"
        />
        <Kpi
          rotulo="Valor em negociação"
          valor={formatarMoeda(resumo.valorEmNegociacao) ?? "R$ 0,00"}
          rodape="soma dos leads em aberto"
        />
        <Kpi
          rotulo="Fechados no mês"
          valor={resumo.ganhosNoMes}
          rodape={
            resumo.valorGanhoNoMes > 0
              ? `${formatarMoeda(resumo.valorGanhoNoMes)} ganhos`
              : "neste mês"
          }
        />
        <Kpi
          rotulo="Conversão"
          valor={
            resumo.taxaConversao === null
              ? "sem dados"
              : `${(resumo.taxaConversao * 100).toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}%`
          }
          rodape={
            resumo.finalizados === 0
              ? "nenhum lead finalizado"
              : `sobre ${resumo.finalizados} ${
                  resumo.finalizados === 1 ? "finalizado" : "finalizados"
                }`
          }
        />
      </section>

      <NovoLead />

      {leads.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-linha px-6 py-14 text-center">
          <p className="font-display text-xl text-neutro">
            Nenhum lead cadastrado ainda
          </p>
          <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-neutro">
            Use o botão Adicionar lead para registrar o primeiro contato. Depois
            é só arrastar o cartão entre as etapas conforme a conversa avança.
          </p>
        </div>
      ) : (
        <>
          <Quadro leads={leads} />

          <section className="mt-12">
            <h2 className="font-display text-xl text-vital-fundo">
              Desempenho por etapa
            </h2>
            <p className="mt-1 font-sans text-xs text-neutro">
              Quantidade e valor acumulado em cada etapa do funil
            </p>

            <ul className="mt-6 space-y-3">
              {resumo.porEtapa.map((linha) => {
                const largura = (linha.quantidade / maiorEtapa) * 100;
                const ganho = linha.etapa === ETAPA_GANHO;
                const final = ETAPAS_FINAIS.includes(linha.etapa);

                return (
                  <li key={linha.etapa}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span
                        className={`font-sans text-sm ${
                          final ? "text-neutro" : "text-tinta"
                        }`}
                      >
                        {linha.etapa}
                      </span>
                      <span className="shrink-0 font-sans text-xs tabular-nums text-neutro">
                        {linha.quantidade}{" "}
                        {linha.quantidade === 1 ? "lead" : "leads"}
                        {linha.valor > 0
                          ? `  ·  ${formatarMoeda(linha.valor)}`
                          : ""}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-areia">
                      <div
                        className={`h-full rounded-full ${
                          ganho ? "bg-emerald-600" : "bg-vital/10"
                        }`}
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
